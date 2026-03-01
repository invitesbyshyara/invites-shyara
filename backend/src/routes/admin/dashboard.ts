import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalInvites,
      publishedInvites,
      totalRsvps,
      totalRevenueAgg,
      revenueThisMonthAgg,
      newUsersThisMonth,
      premiumUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.invite.count(),
      prisma.invite.count({ where: { status: "published" } }),
      prisma.rsvp.count(),
      prisma.transaction.aggregate({
        where: { status: "success" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "success",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: monthStart },
        },
      }),
      prisma.user.count({ where: { plan: "premium" } }),
    ]);

    return sendSuccess(res, {
      totalUsers,
      activeUsers,
      totalInvites,
      publishedInvites,
      totalRsvps,
      totalRevenue: totalRevenueAgg._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonthAgg._sum.amount ?? 0,
      newUsersThisMonth,
      premiumUsers,
    });
  }),
);

router.get(
  "/revenue",
  validate({ query: z.object({ period: z.enum(["7d", "30d", "90d"]).default("30d") }) }),
  asyncHandler(async (req, res) => {
    const { period } = req.query as { period: "7d" | "30d" | "90d" };
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "success",
        createdAt: { gte: start },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const map = new Map<string, number>();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      map.set(key, 0);
    }

    transactions.forEach((transaction) => {
      const key = transaction.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + transaction.amount);
    });

    const data = Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
    return sendSuccess(res, data);
  }),
);

router.get(
  "/recent-signups",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, users);
  }),
);

router.get(
  "/recent-transactions",
  asyncHandler(async (_req, res) => {
    const transactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, transactions);
  }),
);

router.get(
  "/top-templates",
  asyncHandler(async (_req, res) => {
    const templates = await prisma.template.findMany({
      take: 5,
      orderBy: { purchaseCount: "desc" },
    });

    return sendSuccess(res, templates);
  }),
);

router.get(
  "/alerts",
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedTransactionsCount, takenDownInvitesCount, suspendedUsersCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          status: "failed",
          createdAt: { gte: since },
        },
      }),
      prisma.invite.count({ where: { status: "taken_down" } }),
      prisma.user.count({ where: { status: "suspended" } }),
    ]);

    return sendSuccess(res, {
      failedTransactionsCount,
      takenDownInvitesCount,
      suspendedUsersCount,
    });
  }),
);

export default router;
