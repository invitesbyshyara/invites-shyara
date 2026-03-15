import { InviteStatus, Prisma, PromoCode, Transaction } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { buildInitialInviteEntitlements } from "./packageEntitlements";
import { AppError } from "../utils/http";

export const validatePromoCode = async (code: string, templateSlug: string) => {
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

export const calculateFinalAmount = (baseAmount: number, promo?: PromoCode) => {
  if (!promo) {
    return { discountAmount: 0, finalAmount: baseAmount };
  }

  const discountAmount =
    promo.discountType === "percentage"
      ? Math.floor((baseAmount * promo.discountValue) / 100)
      : promo.discountValue;

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return { discountAmount: Math.min(discountAmount, baseAmount), finalAmount };
};

export const finalizeSuccessfulTransaction = async (params: {
  transactionId: string;
  razorpayPaymentId?: string;
  status?: "success" | "failed";
  failureReason?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({ where: { id: params.transactionId } });
    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    if (params.status === "failed") {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          refundReason: params.failureReason,
        },
      });
      return { transaction: null, inviteId: null };
    }

    if (transaction.status === "success") {
      const existingInvite = await tx.invite.findFirst({
        where: { userId: transaction.userId, templateSlug: transaction.templateSlug },
        orderBy: { createdAt: "desc" },
      });
      return { transaction, inviteId: existingInvite?.id ?? null };
    }

    const updatedTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "success",
        razorpayPaymentId: params.razorpayPaymentId,
      },
    });

    await tx.userTemplate.upsert({
      where: {
        userId_templateSlug: {
          userId: transaction.userId,
          templateSlug: transaction.templateSlug,
        },
      },
      create: {
        userId: transaction.userId,
        templateSlug: transaction.templateSlug,
        transactionId: transaction.id,
      },
      update: {},
    });

    await tx.template.update({
      where: { slug: transaction.templateSlug },
      data: { purchaseCount: { increment: 1 } },
    });

    if (transaction.promoCode) {
      await tx.promoCode.updateMany({
        where: {
          code: { equals: transaction.promoCode, mode: "insensitive" },
        },
        data: { usageCount: { increment: 1 } },
      });
    }

    const invite = await tx.invite.create({
      data: {
        userId: transaction.userId,
        templateSlug: transaction.templateSlug,
        templateCategory: (await tx.template.findUniqueOrThrow({ where: { slug: transaction.templateSlug } })).category,
        ...buildInitialInviteEntitlements(transaction.packageCode),
        slug: `${transaction.userId.slice(0, 6)}-${Date.now()}`,
        status: InviteStatus.draft,
        data: Prisma.JsonNull,
      },
    });

    return { transaction: updatedTransaction, inviteId: invite.id };
  });
};
