import crypto from "crypto";
import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { verifyToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifyRazorpayWebhook,
} from "../services/payment";
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from "../services/email";
import { logger } from "../lib/logger";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const validatePromoSchema = z.object({
  code: z.string().min(1),
  templateSlug: z.string().min(1),
});

const resolvePromo = async (code: string, templateSlug: string) => {
  const promo = await prisma.promoCode.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      isActive: true,
    },
  });

  if (!promo) {
    throw new AppError("Invalid promo code", 400);
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new AppError("Promo code expired", 400);
  }

  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    throw new AppError("Promo code usage limit reached", 400);
  }

  if (promo.appliesTo !== "all" && promo.appliesTo !== templateSlug) {
    throw new AppError("Promo code not applicable for this template", 400);
  }

  return promo;
};

const calculateAmount = (baseAmount: number, promo?: { discountType: "percentage" | "flat"; discountValue: number }) => {
  if (!promo) {
    return { discountAmount: 0, finalAmount: baseAmount };
  }

  const discountAmount =
    promo.discountType === "percentage"
      ? Math.floor((baseAmount * promo.discountValue) / 100)
      : promo.discountValue;

  return {
    discountAmount: Math.min(discountAmount, baseAmount),
    finalAmount: Math.max(0, baseAmount - discountAmount),
  };
};

const makeDraftSlug = (userId: string) => `draft-${userId.slice(0, 6)}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

const incrementPromoUsageAtomically = async (tx: Prisma.TransactionClient, where: Prisma.PromoCodeWhereInput) => {
  const updated = await tx.promoCode.updateMany({
    where: {
      ...where,
      isActive: true,
      OR: [{ usageLimit: null }, { usageCount: { lt: prisma.promoCode.fields.usageLimit } }],
    },
    data: { usageCount: { increment: 1 } },
  });

  if (updated.count === 0) {
    throw new AppError("Promo code usage limit reached", 409);
  }
};

router.post(
  "/validate-promo",
  verifyToken,
  validate({ body: validatePromoSchema }),
  asyncHandler(async (req, res) => {
    const { code, templateSlug } = req.body;
    const promo = await resolvePromo(code, templateSlug);

    const label =
      promo.discountType === "percentage"
        ? `${promo.discountValue}% OFF`
        : `${promo.discountValue} OFF`;

    return sendSuccess(res, {
      valid: true,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      label,
    });
  }),
);

const createOrderSchema = z.object({
  templateSlug: z.string().min(1),
  currency: z.enum(["usd", "eur"]),
  promoCode: z.string().min(1).optional(),
});

router.post(
  "/create-order",
  verifyToken,
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { templateSlug, currency, promoCode } = req.body;

    const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
    if (!template) {
      throw new AppError("Template not found", 404);
    }

    const existingPurchase = await prisma.userTemplate.findUnique({
      where: {
        userId_templateSlug: {
          userId: user.id,
          templateSlug,
        },
      },
    });

    if (existingPurchase) {
      throw new AppError("Template already purchased", 409);
    }

    const promo = promoCode ? await resolvePromo(promoCode, templateSlug) : undefined;
    const baseAmount = currency === "usd" ? template.priceUsd : template.priceEur;
    const { discountAmount, finalAmount } = calculateAmount(baseAmount, promo);

    if (finalAmount === 0) {
      const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId: user.id,
            templateSlug,
            amount: 0,
            currency: currency.toUpperCase(),
            status: "success",
            promoCode: promo?.code,
            discountAmount,
          },
        });

        await tx.userTemplate.create({
          data: {
            userId: user.id,
            templateSlug,
            transactionId: transaction.id,
          },
        });

        if (template.isPremium || baseAmount > 0) {
          await tx.template.update({
            where: { slug: templateSlug },
            data: { purchaseCount: { increment: 1 } },
          });
        }

        if (promo) {
          await incrementPromoUsageAtomically(tx, { id: promo.id });
        }

        const invite = await tx.invite.create({
          data: {
            userId: user.id,
            templateSlug,
            templateCategory: template.category,
            slug: makeDraftSlug(user.id),
            status: "draft",
            data: {},
          },
        });

        return { inviteId: invite.id, transactionId: transaction.id };
      });

      sendOrderConfirmationEmail(user.email, {
        name: user.name,
        templateName: template.name,
        amount: 0,
        currency: currency.toUpperCase(),
        transactionId: result.transactionId,
        dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
      }).catch((err) => logger.error("Order confirmation email failed (free)", { err }));

      return sendSuccess(res, {
        free: true,
        inviteId: result.inviteId,
        transactionId: result.transactionId,
      });
    }

    const order = await createRazorpayOrder({
      amountInCents: finalAmount,
      currency: currency.toUpperCase() as "USD" | "EUR",
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        templateSlug,
        promoCode: promo?.code ?? "",
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        templateSlug,
        amount: finalAmount,
        currency: currency.toUpperCase(),
        status: "pending",
        razorpayOrderId: order.id,
        promoCode: promo?.code,
        discountAmount,
      },
    });

    return sendSuccess(res, {
      free: false,
      orderId: order.id,
      amount: finalAmount,
      currency: currency.toUpperCase(),
      keyId: env.RAZORPAY_KEY_ID,
      transactionId: transaction.id,
    });
  }),
);

const findExistingInvite = async (tx: Prisma.TransactionClient, userId: string, templateSlug: string) => {
  const existingInvite = await tx.invite.findFirst({
    where: { userId, templateSlug },
    orderBy: { createdAt: "desc" },
  });
  return existingInvite?.id ?? null;
};

const completeTransactionByOrderId = async (
  tx: Prisma.TransactionClient,
  razorpayOrderId: string,
  razorpayPaymentId?: string,
  expectedUserId?: string,
) => {
  const transaction = await tx.transaction.findFirst({
    where: { razorpayOrderId },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  if (expectedUserId && transaction.userId !== expectedUserId) {
    throw new AppError("Unauthorized transaction access", 403);
  }

  if (transaction.status === "success") {
    return {
      inviteId: await findExistingInvite(tx, transaction.userId, transaction.templateSlug),
      transactionId: transaction.id,
      wasNewlyCompleted: false as const,
      templateSlug: transaction.templateSlug,
      userId: transaction.userId,
      amount: transaction.amount,
      currency: transaction.currency,
    };
  }

  if (transaction.status !== "pending") {
    throw new AppError("Transaction already processed", 409);
  }

  const markedAsSuccess = await tx.transaction.updateMany({
    where: { id: transaction.id, status: "pending" },
    data: {
      status: "success",
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    },
  });

  if (markedAsSuccess.count === 0) {
    const latest = await tx.transaction.findUniqueOrThrow({ where: { id: transaction.id } });
    if (latest.status === "success") {
      return {
        inviteId: await findExistingInvite(tx, latest.userId, latest.templateSlug),
        transactionId: latest.id,
        wasNewlyCompleted: false as const,
        templateSlug: latest.templateSlug,
        userId: latest.userId,
        amount: latest.amount,
        currency: latest.currency,
      };
    }
    throw new AppError("Transaction already processed", 409);
  }

  const template = await tx.template.findUniqueOrThrow({ where: { slug: transaction.templateSlug } });

  await tx.userTemplate.upsert({
    where: {
      userId_templateSlug: { userId: transaction.userId, templateSlug: transaction.templateSlug },
    },
    create: { userId: transaction.userId, templateSlug: transaction.templateSlug, transactionId: transaction.id },
    update: { transactionId: transaction.id },
  });

  await tx.template.update({
    where: { slug: template.slug },
    data: { purchaseCount: { increment: 1 } },
  });

  if (transaction.promoCode) {
    await incrementPromoUsageAtomically(tx, {
      code: { equals: transaction.promoCode, mode: "insensitive" },
    });
  }

  const invite = await tx.invite.create({
    data: {
      userId: transaction.userId,
      templateSlug: transaction.templateSlug,
      templateCategory: template.category,
      slug: makeDraftSlug(transaction.userId),
      status: "draft",
      data: {},
    },
  });

  return {
    inviteId: invite.id,
    transactionId: transaction.id,
    wasNewlyCompleted: true as const,
    templateSlug: transaction.templateSlug,
    userId: transaction.userId,
    amount: transaction.amount,
    currency: transaction.currency,
  };
};

const verifyPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

router.post(
  "/verify-payment",
  verifyToken,
  validate({ body: verifyPaymentSchema }),
  asyncHandler(async (req, res) => {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new AppError("Invalid payment signature", 400);
    }

    const result = await prisma.$transaction((tx) =>
      completeTransactionByOrderId(tx, razorpayOrderId, razorpayPaymentId, req.user!.id),
    );

    if (result.wasNewlyCompleted) {
      const tmpl = await prisma.template.findUnique({ where: { slug: result.templateSlug } });
      sendOrderConfirmationEmail(req.user!.email, {
        name: req.user!.name,
        templateName: tmpl?.name ?? result.templateSlug,
        amount: result.amount,
        currency: result.currency,
        transactionId: result.transactionId,
        dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
      }).catch((err) => logger.error("Order confirmation email failed (verify-payment)", { err }));
    }

    return sendSuccess(res, {
      transactionId: result.transactionId,
      inviteId: result.inviteId,
    });
  }),
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature || typeof signature !== "string") {
      throw new AppError("Missing webhook signature", 400);
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new AppError("Missing webhook body", 400);
    }

    let event: Record<string, any>;
    try {
      event = verifyRazorpayWebhook(rawBody, signature);
    } catch {
      throw new AppError("Invalid webhook signature", 400);
    }

    const eventType: string = event.event ?? "";
    const paymentEntity = event.payload?.payment?.entity;

    if (eventType === "payment.captured" && paymentEntity) {
      const razorpayOrderId: string = paymentEntity.order_id;
      const razorpayPaymentId: string = paymentEntity.id;

      try {
        const result = await prisma.$transaction((tx) =>
          completeTransactionByOrderId(tx, razorpayOrderId, razorpayPaymentId),
        );
        if (result.wasNewlyCompleted) {
          const [user, tmpl] = await Promise.all([
            prisma.user.findUnique({ where: { id: result.userId }, select: { email: true, name: true } }),
            prisma.template.findUnique({ where: { slug: result.templateSlug } }),
          ]);
          if (user) {
            sendOrderConfirmationEmail(user.email, {
              name: user.name,
              templateName: tmpl?.name ?? result.templateSlug,
              amount: result.amount,
              currency: result.currency,
              transactionId: result.transactionId,
              dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
            }).catch((err) => logger.error("Order confirmation email failed (webhook)", { err }));
          }
        }
      } catch (error) {
        if (!(error instanceof AppError) || error.statusCode !== 404) {
          throw error;
        }
      }

      return res.status(200).json({ received: true });
    }

    if (eventType === "payment.failed" && paymentEntity) {
      const razorpayOrderId: string = paymentEntity.order_id;
      const errorDescription: string = paymentEntity.error_description ?? "Payment failed";

      await prisma.transaction.updateMany({
        where: { razorpayOrderId, status: "pending" },
        data: { status: "failed", refundReason: errorDescription },
      });

      prisma.transaction.findFirst({
        where: { razorpayOrderId },
        include: { user: { select: { email: true, name: true } } },
      }).then(async (tx) => {
        if (!tx) return;
        const tmpl = await prisma.template.findUnique({ where: { slug: tx.templateSlug } });
        return sendPaymentFailedEmail(tx.user.email, {
          name: tx.user.name,
          templateName: tmpl?.name ?? tx.templateSlug,
          retryUrl: `${env.FRONTEND_URL}/templates`,
        });
      }).catch((err) => logger.error("Payment failed email error", { err }));
    }

    return res.status(200).json({ received: true });
  }),
);

export default router;
