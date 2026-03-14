import { Router } from "express";
import { Prisma, TransactionStatus } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { sanitizePlainText } from "../../lib/sanitize";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { createRazorpayRefund } from "../../services/payment";
import { AppError, asyncHandler, createPagination, parsePagination, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  validate({
    query: z.object({
      status: z.enum(["pending", "success", "failed", "refunded"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { status } = req.query as { status?: TransactionStatus };
    const { page, limit, skip } = parsePagination(req);

    const where: Prisma.TransactionWhereInput = {
      ...(status ? { status } : {}),
    };

    const [total, transactions, revenueAgg, successCount, failedCount, refundedCount] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.aggregate({
        where: { status: "success" },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { status: "success" } }),
      prisma.transaction.count({ where: { status: "failed" } }),
      prisma.transaction.count({ where: { status: "refunded" } }),
    ]);

    return sendSuccess(
      res,
      {
        transactions,
        summary: {
          totalRevenue: revenueAgg._sum.amount ?? 0,
          successCount,
          failedCount,
          refundedCount,
        },
      },
      createPagination(page, limit, total),
    );
  }),
);

const refundSchema = z.object({
  reason: z.string().min(2).max(500),
});

router.post(
  "/:id/refund",
  requirePermission("refund"),
  validate({ params: z.object({ id: z.string().min(1) }), body: refundSchema }),
  asyncHandler(async (req, res) => {
    const reason = sanitizePlainText(req.body.reason, { maxLength: 500 });
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) {
      throw new AppError("Transaction not found", 404);
    }

    if (transaction.status !== "success") {
      throw new AppError("Only successful transactions can be refunded", 400);
    }

    if (!transaction.razorpayPaymentId) {
      throw new AppError("Razorpay payment ID missing for this transaction", 400);
    }

    await createRazorpayRefund(transaction.razorpayPaymentId);

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "refunded",
        refundedAt: new Date(),
        refundReason: reason,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "PROCESS_REFUND",
      entityType: "transaction",
      entityId: updated.id,
      details: { reason, razorpayPaymentId: transaction.razorpayPaymentId },
    });

    return sendSuccess(res, updated);
  }),
);

router.get(
  "/failed",
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const where: Prisma.TransactionWhereInput = {
      status: "failed",
      createdAt: { gte: since },
    };

    const [total, data] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return sendSuccess(res, data, createPagination(page, limit, total));
  }),
);

export default router;
