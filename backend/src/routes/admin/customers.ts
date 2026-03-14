import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma, UserPlan, UserStatus } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { sanitizeEmail, sanitizeOptionalText, sanitizePlainText } from "../../lib/sanitize";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { AppError, asyncHandler, createPagination, parsePagination, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  validate({
    query: z.object({
      search: z.string().optional(),
      status: z.enum(["active", "suspended"]).optional(),
      plan: z.enum(["free", "premium"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { search, status, plan } = req.query as {
      search?: string;
      status?: UserStatus;
      plan?: UserPlan;
    };
    const { page, limit, skip } = parsePagination(req);

    const where: Prisma.UserWhereInput = {
      ...(status ? { status } : {}),
      ...(plan ? { plan } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const userIds = users.map((user) => user.id);

    const [inviteCounts, spendTotals] = await Promise.all([
      prisma.invite.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          status: "success",
        },
        _sum: { amount: true },
      }),
    ]);

    const inviteCountMap = new Map(inviteCounts.map((item) => [item.userId, item._count._all]));
    const spendMap = new Map(spendTotals.map((item) => [item.userId, item._sum.amount ?? 0]));

    const data = users.map((user) => ({
      ...user,
      inviteCount: inviteCountMap.get(user.id) ?? 0,
      totalSpend: spendMap.get(user.id) ?? 0,
    }));

    return sendSuccess(res, data, createPagination(page, limit, total));
  }),
);

const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  plan: z.enum(["free", "premium"]).optional(),
});

router.post(
  "/",
  validate({ body: createCustomerSchema }),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const email = sanitizeEmail(req.body.email);

    const user = await prisma.user.create({
      data: {
        name: sanitizePlainText(req.body.name, { maxLength: 100 }),
        email,
        passwordHash,
        plan: req.body.plan ?? "free",
      },
    });

    return sendSuccess(res, user, undefined, 201);
  }),
);

router.get(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError("Customer not found", 404);
    }

    const [invites, transactions, inviteCount, rsvpCountAgg, spendAgg] = await Promise.all([
      prisma.invite.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.invite.count({ where: { userId: id } }),
      prisma.rsvp.count({
        where: {
          invite: {
            userId: id,
          },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: id,
          status: "success",
        },
        _sum: { amount: true },
      }),
    ]);

    return sendSuccess(res, {
      user,
      invites,
      transactions,
      stats: {
        inviteCount,
        rsvpCount: rsvpCountAgg,
        totalSpend: spendAgg._sum.amount ?? 0,
      },
    });
  }),
);

const updateCustomerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(20).optional(),
  plan: z.enum(["free", "premium"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});

router.put(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }), body: updateCustomerSchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: sanitizePlainText(req.body.name, { maxLength: 100 }) } : {}),
        ...(req.body.email !== undefined ? { email: sanitizeEmail(req.body.email) } : {}),
        ...(req.body.phone !== undefined ? { phone: sanitizeOptionalText(req.body.phone, { maxLength: 20 }) } : {}),
        ...(req.body.plan !== undefined ? { plan: req.body.plan } : {}),
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
      },
    });

    return sendSuccess(res, updated);
  }),
);

router.delete(
  "/:id",
  requirePermission("delete_customer"),
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });

    await logAudit({
      adminId: req.admin!.id,
      action: "DELETE_USER",
      entityType: "user",
      entityId: req.params.id,
    });

    return sendSuccess(res, { message: "Customer deleted" });
  }),
);

const suspendSchema = z.object({ reason: z.string().max(500).optional() });

router.post(
  "/:id/suspend",
  requirePermission("suspend_customer"),
  validate({ params: z.object({ id: z.string().min(1) }), body: suspendSchema }),
  asyncHandler(async (req, res) => {
    const reason = req.body.reason ? sanitizePlainText(req.body.reason, { maxLength: 500 }) : undefined;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "suspended" },
    });

    await prisma.adminNote.create({
      data: {
        entityId: req.params.id,
        entityType: "customer",
        note: reason ? `Suspended: ${reason}` : "Account suspended",
        createdById: req.admin!.id,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "SUSPEND_USER",
      entityType: "user",
      entityId: req.params.id,
      details: reason ? { reason } : undefined,
    });

    return sendSuccess(res, user);
  }),
);

router.post(
  "/:id/unsuspend",
  requirePermission("suspend_customer"),
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "active" },
    });

    await prisma.adminNote.create({
      data: {
        entityId: req.params.id,
        entityType: "customer",
        note: "Account unsuspended",
        createdById: req.admin!.id,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "UNSUSPEND_USER",
      entityType: "user",
      entityId: req.params.id,
    });

    return sendSuccess(res, user);
  }),
);

const unlockSchema = z.object({
  templateSlug: z.string().min(1),
  reason: z.string().min(2).max(500),
});

router.post(
  "/:id/unlock-template",
  requirePermission("manual_unlock"),
  validate({ params: z.object({ id: z.string().min(1) }), body: unlockSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { templateSlug } = req.body;
    const reason = sanitizePlainText(req.body.reason, { maxLength: 500 });

    const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
    if (!template) {
      throw new AppError("Template not found", 404);
    }

    const unlocked = await prisma.userTemplate.upsert({
      where: {
        userId_templateSlug: {
          userId: id,
          templateSlug,
        },
      },
      create: {
        userId: id,
        templateSlug,
      },
      update: {},
    });

    await prisma.adminNote.create({
      data: {
        entityId: id,
        entityType: "customer",
        note: `Unlocked template ${templateSlug}. Reason: ${reason}`,
        createdById: req.admin!.id,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "MANUAL_TEMPLATE_UNLOCK",
      entityType: "user",
      entityId: id,
      details: { templateSlug, reason },
    });

    return sendSuccess(res, unlocked);
  }),
);

router.get(
  "/:id/activity",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const [notes, invites, rsvps, transactions] = await Promise.all([
      prisma.adminNote.findMany({
        where: {
          entityType: "customer",
          entityId: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.rsvp.findMany({
        where: {
          invite: {
            userId,
          },
        },
        include: {
          invite: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const timeline = [
      ...invites.map((invite) => ({
        type: "invite",
        id: invite.id,
        message: `Invite ${invite.slug} ${invite.status}`,
        timestamp: invite.updatedAt,
      })),
      ...rsvps.map((rsvp) => ({
        type: "rsvp",
        id: rsvp.id,
        message: `RSVP ${rsvp.response} from ${rsvp.name} for ${rsvp.invite.slug}`,
        timestamp: rsvp.submittedAt,
      })),
      ...transactions.map((transaction) => ({
        type: "transaction",
        id: transaction.id,
        message: `Transaction ${transaction.status} for ${transaction.templateSlug}`,
        timestamp: transaction.createdAt,
      })),
      ...notes.map((note) => ({
        type: "note",
        id: note.id,
        message: note.note,
        timestamp: note.createdAt,
        admin: note.createdBy.email,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return sendSuccess(res, {
      notes,
      timeline,
    });
  }),
);

export default router;
