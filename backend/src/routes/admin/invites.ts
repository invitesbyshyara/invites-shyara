import { Router } from "express";
import { EventCategory, InviteStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { sanitizePlainText } from "../../lib/sanitize";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { isInviteSlugAvailable, validateSlugFormat } from "../../services/slug";
import { AppError, asyncHandler, createPagination, parsePagination, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  validate({
    query: z.object({
      search: z.string().optional(),
      status: z
        .string()
        .optional()
        .transform((value) => (value ? value.replace(/-/g, "_") : undefined))
        .pipe(z.nativeEnum(InviteStatus).optional()),
      category: z
        .string()
        .optional()
        .transform((value) => (value ? value.replace(/-/g, "_") : undefined))
        .pipe(z.nativeEnum(EventCategory).optional()),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { search, status, category } = req.query as {
      search?: string;
      status?: InviteStatus;
      category?: EventCategory;
    };

    const { page, limit, skip } = parsePagination(req);

    const where: Prisma.InviteWhereInput = {
      ...(status ? { status } : {}),
      ...(category ? { templateCategory: category } : {}),
      ...(search
        ? {
            OR: [
              { slug: { contains: search, mode: "insensitive" } },
              {
                user: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
              {
                user: {
                  email: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [total, invites] = await Promise.all([
      prisma.invite.count({ where }),
      prisma.invite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { rsvps: true },
          },
        },
      }),
    ]);

    const data = invites.map((invite) => {
      const eventName =
        typeof invite.data === "object" && invite.data && "eventTitle" in (invite.data as Record<string, unknown>)
          ? String((invite.data as Record<string, unknown>).eventTitle)
          : invite.slug;

      return {
        ...invite,
        eventName,
        rsvpCount: invite._count.rsvps,
      };
    });

    return sendSuccess(res, data, createPagination(page, limit, total));
  }),
);

router.get(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            plan: true,
          },
        },
        rsvps: true,
      },
    });

    if (!invite) {
      throw new AppError("Invite not found", 404);
    }

    const summary = {
      total: invite.rsvps.length,
      yes: invite.rsvps.filter((item) => item.response === "yes").length,
      no: invite.rsvps.filter((item) => item.response === "no").length,
      maybe: invite.rsvps.filter((item) => item.response === "maybe").length,
    };

    return sendSuccess(res, {
      ...invite,
      rsvpSummary: summary,
    });
  }),
);

const updateSlugSchema = z.object({
  slug: z.string().min(3).max(60),
});

router.put(
  "/:id/slug",
  validate({ params: z.object({ id: z.string().min(1) }), body: updateSlugSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { slug } = req.body;

    if (!validateSlugFormat(slug)) {
      throw new AppError("Invalid slug format", 400);
    }

    const available = await isInviteSlugAvailable(slug, id);
    if (!available) {
      throw new AppError("Slug already taken", 409);
    }

    const updated = await prisma.invite.update({
      where: { id },
      data: { slug },
    });

    return sendSuccess(res, updated);
  }),
);

const reasonSchema = z.object({ reason: z.string().max(500).optional() });

router.post(
  "/:id/takedown",
  requirePermission("takedown_invite"),
  validate({ params: z.object({ id: z.string().min(1) }), body: reasonSchema }),
  asyncHandler(async (req, res) => {
    const reason = req.body.reason ? sanitizePlainText(req.body.reason, { maxLength: 500 }) : undefined;
    const invite = await prisma.invite.update({
      where: { id: req.params.id },
      data: { status: "taken_down" },
    });

    await prisma.adminNote.create({
      data: {
        entityId: invite.id,
        entityType: "invite",
        note: reason ? `Taken down: ${reason}` : "Invite taken down",
        createdById: req.admin!.id,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "TAKEDOWN_INVITE",
      entityType: "invite",
      entityId: invite.id,
      details: reason ? { reason } : undefined,
    });

    return sendSuccess(res, invite);
  }),
);

router.post(
  "/:id/republish",
  requirePermission("takedown_invite"),
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.update({
      where: { id: req.params.id },
      data: { status: "published" },
    });

    await prisma.adminNote.create({
      data: {
        entityId: invite.id,
        entityType: "invite",
        note: "Invite republished",
        createdById: req.admin!.id,
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "REPUBLISH_INVITE",
      entityType: "invite",
      entityId: invite.id,
    });

    return sendSuccess(res, invite);
  }),
);

router.get(
  "/:id/rsvps",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const rsvps = await prisma.rsvp.findMany({
      where: { inviteId: req.params.id },
      orderBy: { submittedAt: "desc" },
    });

    const stats = {
      total: rsvps.length,
      yes: rsvps.filter((item) => item.response === "yes").length,
      no: rsvps.filter((item) => item.response === "no").length,
      maybe: rsvps.filter((item) => item.response === "maybe").length,
      totalGuests: rsvps.reduce((sum, item) => sum + item.guestCount, 0),
    };

    return sendSuccess(res, { rsvps, stats });
  }),
);

export default router;
