import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { normalizeLocalizationSettings, normalizeRsvpSettings, pickGuestLanguage } from "../services/inviteOps";
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from "../services/email";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

router.get(
  "/invites/:slug",
  asyncHandler(async (req, res) => {
    const params = z.object({ slug: z.string().min(3).max(60) }).parse(req.params);
    const query = z.object({ guest: z.string().optional(), lang: z.string().optional() }).parse(req.query);

    const invite = await prisma.invite.findUnique({
      where: { slug: params.slug },
    });

    if (!invite || invite.status === "draft") {
      throw new AppError("Invite not found", 404);
    }

    if (invite.status === "taken_down") {
      return sendSuccess(res, { status: "taken_down" });
    }

    const inviteData = (invite.data ?? {}) as Record<string, unknown>;
    const viewer = query.guest
      ? await prisma.inviteGuest.findFirst({
          where: {
            inviteId: invite.id,
            token: query.guest,
          },
        })
      : null;

    const localization = normalizeLocalizationSettings(inviteData);
    const selectedLanguage = pickGuestLanguage(inviteData, query.lang, viewer?.language);

    return sendSuccess(res, {
      templateSlug: invite.templateSlug,
      templateCategory: invite.templateCategory,
      data: inviteData,
      inviteId: invite.id,
      status: invite.status,
      selectedLanguage,
      languages: localization.enabledLanguages,
      viewer: viewer
        ? {
            token: viewer.token,
            name: viewer.name,
            email: viewer.email,
            language: viewer.language,
            audienceSegment: viewer.audienceSegment,
            response: viewer.response,
            guestCount: viewer.guestCount,
          }
        : undefined,
    });
  }),
);

router.post(
  "/invites/:slug/view",
  asyncHandler(async (req, res) => {
    await prisma.invite.updateMany({
      where: { slug: req.params.slug, status: "published" },
      data: { viewCount: { increment: 1 } },
    });
    return sendSuccess(res, { ok: true });
  }),
);

router.get(
  "/invites/:inviteId/rsvp-config",
  asyncHandler(async (req, res) => {
    const params = z.object({ inviteId: z.string().min(1) }).parse(req.params);
    const query = z.object({ guest: z.string().optional(), lang: z.string().optional() }).parse(req.query);

    const invite = await prisma.invite.findUnique({
      where: { id: params.inviteId },
      select: { id: true, status: true, data: true },
    });

    if (!invite || invite.status !== "published") {
      throw new AppError("Invite not found", 404);
    }

    const inviteData = (invite.data ?? {}) as Record<string, unknown>;
    const viewer = query.guest
      ? await prisma.inviteGuest.findFirst({
          where: {
            inviteId: invite.id,
            token: query.guest,
          },
        })
      : null;

    const settings = normalizeRsvpSettings(inviteData);
    const localization = normalizeLocalizationSettings(inviteData);
    const language = pickGuestLanguage(inviteData, query.lang, viewer?.language);

    return sendSuccess(res, {
      ...settings,
      language,
      enabledLanguages: localization.enabledLanguages,
      viewer: viewer
        ? {
            token: viewer.token,
            name: viewer.name,
            email: viewer.email,
            phone: viewer.phone,
            guestCount: viewer.guestCount,
            response: viewer.response,
            adultCount: viewer.adultCount,
            childCount: viewer.childCount,
            mealChoice: viewer.mealChoice,
            dietaryRestrictions: viewer.dietaryRestrictions,
            household: viewer.household,
            stayNeeded: viewer.stayNeeded,
            roomRequirement: viewer.roomType,
            transportNeeded: viewer.shuttleRequired,
            transportMode: viewer.transportMode,
            customAnswers: viewer.customAnswers,
          }
        : undefined,
    });
  }),
);

const submitRsvpSchema = z.object({
  guestToken: z.string().optional(),
  language: z.string().optional(),
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().max(25).optional(),
  household: z.string().max(100).optional(),
  response: z.enum(["yes", "no", "maybe"]),
  guestCount: z.coerce.number().int().min(1).max(12),
  adultCount: z.coerce.number().int().min(0).max(12).optional(),
  childCount: z.coerce.number().int().min(0).max(12).optional(),
  message: z.string().max(1000).optional(),
  mealChoice: z.string().max(100).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  stayNeeded: z.boolean().optional(),
  roomRequirement: z.string().max(120).optional(),
  transportNeeded: z.boolean().optional(),
  transportMode: z.string().max(100).optional(),
  customAnswers: z.record(z.any()).optional(),
});

router.post(
  "/invites/:slug/rsvp",
  asyncHandler(async (req, res) => {
    const params = z.object({ slug: z.string().min(3).max(60) }).parse(req.params);
    const body = submitRsvpSchema.parse(req.body);

    const invite = await prisma.invite.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            unsubscribeToken: true,
          },
        },
      },
    });

    if (!invite || invite.status !== "published") {
      throw new AppError("Invite not found", 404);
    }

    const inviteData = (invite.data ?? {}) as Record<string, unknown>;
    const settings = normalizeRsvpSettings(inviteData);
    if (settings.deadline && new Date(settings.deadline) < new Date()) {
      throw new AppError("RSVP deadline has passed", 410);
    }

    const normalizedEmail = body.email?.toLowerCase();
    let guest = body.guestToken
      ? await prisma.inviteGuest.findFirst({
          where: { inviteId: invite.id, token: body.guestToken },
        })
      : null;

    if (!guest && normalizedEmail) {
      guest = await prisma.inviteGuest.findFirst({
        where: { inviteId: invite.id, email: normalizedEmail },
      });
    }

    const selectedLanguage = pickGuestLanguage(inviteData, body.language, guest?.language);

    if (guest) {
      guest = await prisma.inviteGuest.update({
        where: { id: guest.id },
        data: {
          name: body.name,
          email: normalizedEmail ?? guest.email,
          phone: body.phone ?? guest.phone,
          household: body.household ?? guest.household,
          language: selectedLanguage,
          response: body.response,
          guestCount: body.guestCount,
          adultCount: body.adultCount,
          childCount: body.childCount,
          message: body.message,
          mealChoice: body.mealChoice,
          dietaryRestrictions: body.dietaryRestrictions,
          customAnswers: body.customAnswers,
          stayNeeded: body.stayNeeded ?? false,
          roomType: body.roomRequirement,
          shuttleRequired: body.transportNeeded ?? false,
          transportMode: body.transportMode,
          rsvpSubmittedAt: new Date(),
        },
      });
    } else {
      guest = await prisma.inviteGuest.create({
        data: {
          inviteId: invite.id,
          name: body.name,
          email: normalizedEmail,
          phone: body.phone,
          household: body.household,
          language: selectedLanguage,
          response: body.response,
          guestCount: body.guestCount,
          adultCount: body.adultCount,
          childCount: body.childCount,
          message: body.message,
          mealChoice: body.mealChoice,
          dietaryRestrictions: body.dietaryRestrictions,
          customAnswers: body.customAnswers,
          stayNeeded: body.stayNeeded ?? false,
          roomType: body.roomRequirement,
          shuttleRequired: body.transportNeeded ?? false,
          transportMode: body.transportMode,
          rsvpSubmittedAt: new Date(),
        },
      });
    }

    const existing = await prisma.rsvp.findFirst({
      where: {
        inviteId: invite.id,
        OR: [
          { guestId: guest.id },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    const rsvpPayload = {
      inviteId: invite.id,
      guestId: guest.id,
      name: body.name,
      email: normalizedEmail,
      response: body.response,
      guestCount: body.guestCount,
      adultCount: body.adultCount,
      childCount: body.childCount,
      message: body.message,
      mealChoice: body.mealChoice,
      dietaryRestrictions: body.dietaryRestrictions,
      customAnswers: body.customAnswers,
      stayNeeded: body.stayNeeded,
      roomRequirement: body.roomRequirement,
      transportNeeded: body.transportNeeded,
      transportMode: body.transportMode,
      language: selectedLanguage,
      ipAddress: req.ip,
      submittedAt: new Date(),
    };

    const saved = existing
      ? await prisma.rsvp.update({
          where: { id: existing.id },
          data: rsvpPayload,
        })
      : await prisma.rsvp.create({
          data: rsvpPayload,
        });

    const totalCount = await prisma.rsvp.count({ where: { inviteId: invite.id } });
    const inviteName =
      typeof inviteData.eventTitle === "string" && inviteData.eventTitle
        ? inviteData.eventTitle
        : "your event";
    const eventDate =
      typeof inviteData.eventDate === "string" && inviteData.eventDate
        ? inviteData.eventDate
        : undefined;

    if (normalizedEmail) {
      await sendRsvpConfirmationEmail(normalizedEmail, {
        guestName: body.name,
        inviteName,
        response: body.response,
        eventDate,
      });
    }

    await sendRsvpNotificationEmail(invite.user.email, {
      guestName: body.name,
      response: body.response,
      totalCount,
      inviteSlug: invite.slug,
      unsubscribeToken: invite.user.unsubscribeToken ?? undefined,
    });

    return sendSuccess(res, saved, undefined, existing ? 200 : 201);
  }),
);

router.get(
  "/broadcasts/open/:token.gif",
  asyncHandler(async (req, res) => {
    const params = z.object({ token: z.string().min(1) }).parse(req.params);

    await prisma.broadcastRecipient.updateMany({
      where: {
        openToken: params.token,
        status: { in: ["sent", "opened"] },
      },
      data: {
        status: "opened",
        openedAt: new Date(),
      },
    });

    const gif = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(gif);
  }),
);

export default router;
