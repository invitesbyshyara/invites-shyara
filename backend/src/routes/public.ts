import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from "../services/email";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

router.get(
  "/invites/:slug",
  validate({ params: z.object({ slug: z.string().min(3).max(60) }) }),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findUnique({
      where: { slug: req.params.slug },
    });

    if (!invite || invite.status === "draft") {
      throw new AppError("Invite not found", 404);
    }

    if (invite.status === "taken_down") {
      return sendSuccess(res, { status: "taken_down" });
    }

    return sendSuccess(res, {
      templateSlug: invite.templateSlug,
      templateCategory: invite.templateCategory,
      data: invite.data,
      inviteId: invite.id,
      status: invite.status,
    });
  }),
);

router.post(
  "/invites/:slug/view",
  validate({ params: z.object({ slug: z.string().min(3).max(60) }) }),
  asyncHandler(async (req, res) => {
    await prisma.invite.updateMany({
      where: { slug: req.params.slug, status: "published" },
      data: { viewCount: { increment: 1 } },
    });
    return sendSuccess(res, { ok: true });
  }),
);

const submitRsvpSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  response: z.enum(["yes", "no", "maybe"]),
  guestCount: z.coerce.number().int().min(1).max(20),
  message: z.string().max(1000).optional(),
});

router.post(
  "/invites/:slug/rsvp",
  validate({ params: z.object({ slug: z.string().min(3).max(60) }), body: submitRsvpSchema }),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findUnique({
      where: { slug: req.params.slug },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!invite || invite.status !== "published") {
      throw new AppError("Invite not found", 404);
    }

    const normalizedEmail = req.body.email?.toLowerCase();

    if (normalizedEmail) {
      const existing = await prisma.rsvp.findFirst({
        where: { inviteId: invite.id, email: normalizedEmail },
      });

      if (existing) {
        const updated = await prisma.rsvp.update({
          where: { id: existing.id },
          data: {
            name: req.body.name,
            email: normalizedEmail,
            response: req.body.response,
            guestCount: req.body.guestCount,
            message: req.body.message,
            ipAddress: req.ip,
            submittedAt: new Date(),
          },
        });

        return sendSuccess(res, updated);
      }
    } else {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await prisma.rsvp.findFirst({
        where: {
          inviteId: invite.id,
          ipAddress: req.ip,
          submittedAt: { gte: since },
        },
      });

      if (existing) {
        const updated = await prisma.rsvp.update({
          where: { id: existing.id },
          data: {
            name: req.body.name,
            response: req.body.response,
            guestCount: req.body.guestCount,
            message: req.body.message,
            submittedAt: new Date(),
          },
        });

        return sendSuccess(res, updated);
      }
    }

    const created = await prisma.rsvp.create({
      data: {
        inviteId: invite.id,
        name: req.body.name,
        email: normalizedEmail,
        response: req.body.response,
        guestCount: req.body.guestCount,
        message: req.body.message,
        ipAddress: req.ip,
      },
    });

    const totalCount = await prisma.rsvp.count({ where: { inviteId: invite.id } });
    const inviteName =
      typeof invite.data === "object" && invite.data && "eventTitle" in (invite.data as Record<string, unknown>)
        ? String((invite.data as Record<string, unknown>).eventTitle)
        : "your event";
    const eventDate =
      typeof invite.data === "object" && invite.data && "eventDate" in (invite.data as Record<string, unknown>)
        ? String((invite.data as Record<string, unknown>).eventDate)
        : undefined;

    if (normalizedEmail) {
      await sendRsvpConfirmationEmail(normalizedEmail, {
        guestName: req.body.name,
        inviteName,
        response: req.body.response,
        eventDate,
      });
    }

    await sendRsvpNotificationEmail(invite.user.email, {
      guestName: req.body.name,
      response: req.body.response,
      totalCount,
    });

    return sendSuccess(res, created, undefined, 201);
  }),
);

export default router;
