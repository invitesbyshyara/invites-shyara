import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { sanitizeEmail, sanitizeOptionalText, sanitizePlainText } from "../lib/sanitize";
import {
  normalizeLocalizationSettings,
  normalizeRsvpSettings,
  pickGuestLanguage,
  TECHNICAL_GUEST_COUNT_LIMIT,
} from "../services/inviteOps";
import { sendRsvpConfirmationEmail, sendRsvpNotificationEmail } from "../services/email";
import { getCustomerAcquisitionStatus } from "../services/customerAcquisitionLock";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const uniq = <T,>(values: T[]) => Array.from(new Set(values));

const optionalText = (value: string | undefined) => {
  return sanitizeOptionalText(value, { maxLength: 1_000 });
};

const validatePartyCounts = ({
  guestCount,
  adultCount,
  childCount,
}: {
  guestCount: number;
  adultCount?: number;
  childCount?: number;
}) => {
  if ((adultCount ?? 0) + (childCount ?? 0) > guestCount) {
    throw new AppError("Adults and children cannot exceed total guests", 400);
  }
};

const sanitizeCustomAnswers = (
  answers: Record<string, string | number | boolean> | undefined,
  settings: ReturnType<typeof normalizeRsvpSettings>
) => {
  const result: Record<string, string | number | boolean> = {};
  const questionMap = new Map(settings.customQuestions.map((question) => [question.id, question]));

  Object.entries(answers ?? {}).forEach(([questionId, value]) => {
    const question = questionMap.get(questionId);
    if (!question) {
      return;
    }

    if (question.type === "boolean") {
      if (typeof value !== "boolean") {
        throw new AppError(`Answer for ${question.label} must be true or false`, 400);
      }
      result[questionId] = value;
      return;
    }

    if (question.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
        throw new AppError(`Answer for ${question.label} must be a whole number`, 400);
      }
      if (value < 0 || value > TECHNICAL_GUEST_COUNT_LIMIT) {
        throw new AppError(`Answer for ${question.label} is out of range`, 400);
      }
      result[questionId] = value;
      return;
    }

    if (typeof value !== "string") {
      throw new AppError(`Answer for ${question.label} must be text`, 400);
    }

    const maxLength = question.type === "textarea" ? 500 : 120;
    const sanitized = sanitizePlainText(value, { maxLength });
    if (!sanitized) {
      return;
    }

    if (question.type === "select") {
      const allowed = new Set(question.options ?? []);
      if (!allowed.has(sanitized)) {
        throw new AppError(`Answer for ${question.label} must match a configured option`, 400);
      }
    }

    result[questionId] = sanitized;
  });

  return result;
};

router.get(
  "/platform-status",
  asyncHandler(async (_req, res) => {
    return sendSuccess(res, getCustomerAcquisitionStatus());
  }),
);

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
      mealOptions: viewer?.mealChoice
        ? uniq([...settings.mealOptions, viewer.mealChoice])
        : settings.mealOptions,
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
  guestCount: z.coerce.number().int().min(1).max(TECHNICAL_GUEST_COUNT_LIMIT),
  adultCount: z.coerce.number().int().min(0).max(TECHNICAL_GUEST_COUNT_LIMIT).optional(),
  childCount: z.coerce.number().int().min(0).max(TECHNICAL_GUEST_COUNT_LIMIT).optional(),
  message: z.string().max(1000).optional(),
  mealChoice: z.string().max(100).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  stayNeeded: z.boolean().optional(),
  roomRequirement: z.string().max(120).optional(),
  transportNeeded: z.boolean().optional(),
  transportMode: z.string().max(100).optional(),
  customAnswers: z.record(z.union([z.string(), z.number().finite(), z.boolean()])).optional(),
}).strict();

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

    const normalizedEmail = body.email ? sanitizeEmail(body.email) : undefined;
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
    const reservedGuestCount = guest?.guestCount ?? 1;
    const effectiveGuestCount = body.response !== "yes"
      ? 1
      : settings.allowPlusOnes === false
        ? reservedGuestCount
        : body.guestCount;

    if (body.response === "yes" && settings.maxGuestCount !== undefined && effectiveGuestCount > settings.maxGuestCount) {
      throw new AppError(`You can RSVP for up to ${settings.maxGuestCount} guest(s) for this event`, 400);
    }

    validatePartyCounts({
      guestCount: effectiveGuestCount,
      adultCount: body.response === "yes" ? body.adultCount : undefined,
      childCount: body.response === "yes" ? body.childCount : undefined,
    });

    const allowedMealChoices = new Set(settings.mealOptions);
    if (guest?.mealChoice) {
      allowedMealChoices.add(guest.mealChoice);
    }

    const normalizedMealChoice = optionalText(body.mealChoice);
    if (normalizedMealChoice && allowedMealChoices.size > 0 && !allowedMealChoices.has(normalizedMealChoice)) {
      throw new AppError("Meal choice must match one of the host's configured options", 400);
    }

    const filteredCustomAnswers = sanitizeCustomAnswers(body.customAnswers, settings);

    const effectiveAdultCount = body.response === "yes" && settings.collectAdultsChildrenSplit ? body.adultCount : undefined;
    const effectiveChildCount = body.response === "yes" && settings.collectAdultsChildrenSplit ? body.childCount : undefined;
    const effectiveMealChoice = body.response === "yes" && settings.collectMealChoice ? normalizedMealChoice : undefined;
    const effectiveDietaryRestrictions = body.response === "yes" && settings.collectDietaryRestrictions
      ? optionalText(body.dietaryRestrictions)
      : undefined;
    const effectiveStayNeeded = body.response === "yes" && settings.collectStayNeeds ? Boolean(body.stayNeeded) : false;
    const effectiveRoomRequirement = effectiveStayNeeded ? optionalText(body.roomRequirement) : undefined;
    const effectiveTransportNeeded = body.response === "yes" && settings.collectTravelPlans ? Boolean(body.transportNeeded) : false;
    const effectiveTransportMode = effectiveTransportNeeded ? optionalText(body.transportMode) : undefined;

    // Wrap guest upsert + RSVP upsert in a single transaction so concurrent submissions
    // from the same guest (e.g. mobile double-tap) can't produce duplicate RSVP rows.
    // Emails are intentionally sent OUTSIDE the transaction (after commit).
    const { saved, wasExisting } = await prisma.$transaction(async (tx) => {
      let txGuest = guest;
      if (txGuest) {
        txGuest = await tx.inviteGuest.update({
          where: { id: txGuest.id },
          data: {
            name: sanitizePlainText(body.name, { maxLength: 120 }),
            email: normalizedEmail ?? txGuest.email,
            phone: optionalText(body.phone) ?? txGuest.phone,
            household: optionalText(body.household) ?? txGuest.household,
            language: selectedLanguage,
            response: body.response,
            guestCount: effectiveGuestCount,
            adultCount: effectiveAdultCount,
            childCount: effectiveChildCount,
            message: optionalText(body.message),
            mealChoice: effectiveMealChoice,
            dietaryRestrictions: effectiveDietaryRestrictions,
            customAnswers: filteredCustomAnswers,
            stayNeeded: effectiveStayNeeded,
            roomType: effectiveRoomRequirement,
            shuttleRequired: effectiveTransportNeeded,
            transportMode: effectiveTransportMode,
            rsvpSubmittedAt: new Date(),
          },
        });
      } else {
        txGuest = await tx.inviteGuest.create({
          data: {
            inviteId: invite.id,
            name: sanitizePlainText(body.name, { maxLength: 120 }),
            email: normalizedEmail,
            phone: optionalText(body.phone),
            household: optionalText(body.household),
            language: selectedLanguage,
            response: body.response,
            guestCount: effectiveGuestCount,
            adultCount: effectiveAdultCount,
            childCount: effectiveChildCount,
            message: optionalText(body.message),
            mealChoice: effectiveMealChoice,
            dietaryRestrictions: effectiveDietaryRestrictions,
            customAnswers: filteredCustomAnswers,
            stayNeeded: effectiveStayNeeded,
            roomType: effectiveRoomRequirement,
            shuttleRequired: effectiveTransportNeeded,
            transportMode: effectiveTransportMode,
            rsvpSubmittedAt: new Date(),
          },
        });
      }

      const existing = await tx.rsvp.findFirst({
        where: {
          inviteId: invite.id,
          OR: [
            { guestId: txGuest.id },
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ],
        },
      });

      const rsvpPayload = {
        inviteId: invite.id,
        guestId: txGuest.id,
        name: sanitizePlainText(body.name, { maxLength: 120 }),
        email: normalizedEmail,
        response: body.response,
        guestCount: effectiveGuestCount,
        adultCount: effectiveAdultCount,
        childCount: effectiveChildCount,
        message: optionalText(body.message),
        mealChoice: effectiveMealChoice,
        dietaryRestrictions: effectiveDietaryRestrictions,
        customAnswers: filteredCustomAnswers,
        stayNeeded: effectiveStayNeeded,
        roomRequirement: effectiveRoomRequirement,
        transportNeeded: effectiveTransportNeeded,
        transportMode: effectiveTransportMode,
        language: selectedLanguage,
        ipAddress: req.ip,
        submittedAt: new Date(),
      };

      const txSaved = existing
        ? await tx.rsvp.update({ where: { id: existing.id }, data: rsvpPayload })
        : await tx.rsvp.create({ data: rsvpPayload });

      return { saved: txSaved, wasExisting: Boolean(existing) };
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
        guestName: sanitizePlainText(body.name, { maxLength: 120 }),
        inviteName,
        response: body.response,
        eventDate,
      });
    }

    await sendRsvpNotificationEmail(invite.user.email, {
      guestName: sanitizePlainText(body.name, { maxLength: 120 }),
      response: body.response,
      totalCount,
      inviteSlug: invite.slug,
      unsubscribeToken: invite.user.unsubscribeToken ?? undefined,
    });

    return sendSuccess(res, saved, undefined, wasExisting ? 200 : 201);
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
