import { Router } from "express";
import { RsvpResponse } from "@prisma/client";
import { z } from "zod";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../middleware/auth";
import { sendCollaboratorInviteEmail, sendGuestBroadcastEmail } from "../services/email";
import {
  buildOperationsSummary,
  collaboratorHasAnyPermission,
  COLLABORATOR_PERMISSIONS,
  getInviteAccess,
  mergeInviteData,
  normalizeLocalizationSettings,
  normalizeRsvpSettings,
  pickGuestLanguage,
} from "../services/inviteOps";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();
router.use(verifyToken);

const requireInviteOpsAccess = async (
  userId: string,
  inviteId: string,
  permissions?: Array<"edit_content" | "manage_rsvps" | "send_reminders" | "view_reports" | "handle_guest_support">
) => {
  const access = await getInviteAccess(userId, inviteId);
  if (!access) {
    throw new AppError("Invite not found", 404);
  }

  if (!access.isOwner && permissions && !collaboratorHasAnyPermission(access.collaborator, permissions)) {
    throw new AppError("You do not have permission for this workspace", 403);
  }

  return access;
};

const guestSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(25).optional(),
  household: z.string().max(100).optional(),
  audienceSegment: z.string().max(40).default("general"),
  tags: z.array(z.string().max(30)).max(8).default([]),
  language: z.string().max(10).default("en"),
  invitationStatus: z.enum(["invited", "confirmed", "waitlisted", "cancelled"]).default("invited"),
  response: z.enum(["yes", "no", "maybe"]).optional().nullable(),
  guestCount: z.coerce.number().int().min(1).max(12).default(1),
  adultCount: z.coerce.number().int().min(0).max(12).optional().nullable(),
  childCount: z.coerce.number().int().min(0).max(12).optional().nullable(),
  mealChoice: z.string().max(100).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  stayNeeded: z.boolean().default(false),
  lodgingStatus: z.string().max(40).optional(),
  hotelName: z.string().max(120).optional(),
  roomType: z.string().max(80).optional(),
  roomCount: z.coerce.number().int().min(0).max(20).default(0),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  shuttleRequired: z.boolean().default(false),
  transportMode: z.string().max(80).optional(),
  arrivalDetails: z.string().max(500).optional(),
  departureDetails: z.string().max(500).optional(),
  parkingRequired: z.boolean().default(false),
  supportNotes: z.string().max(800).optional(),
});

const rsvpSettingsSchema = z.object({
  collectEmail: z.boolean(),
  allowPlusOnes: z.boolean(),
  maxGuestCount: z.coerce.number().int().min(1).max(12),
  collectAdultsChildrenSplit: z.boolean(),
  collectMealChoice: z.boolean(),
  mealOptions: z.array(z.string().max(50)).max(8),
  collectDietaryRestrictions: z.boolean(),
  collectTravelPlans: z.boolean(),
  collectStayNeeds: z.boolean(),
  collectHousehold: z.boolean(),
  collectPhone: z.boolean(),
  deadline: z.string().optional(),
  customQuestions: z.array(
    z.object({
      id: z.string().min(1).max(50),
      label: z.string().min(1).max(80),
      type: z.enum(["text", "textarea", "select", "boolean", "number"]),
      required: z.boolean(),
      options: z.array(z.string().max(50)).max(6).optional(),
      translations: z.record(z.string()).optional(),
    })
  ).max(6),
});

const localizationSchema = z.object({
  defaultLanguage: z.string().max(10),
  enabledLanguages: z.array(z.string().max(10)).min(1).max(5),
  translations: z.record(z.record(z.any())).default({}),
});

const collaboratorSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  roleLabel: z.string().min(2).max(60),
  permissions: z.array(z.enum(COLLABORATOR_PERMISSIONS)).min(1).max(5),
});

const broadcastSchema = z.object({
  type: z.enum([
    "venue_change",
    "timing_update",
    "rsvp_reminder",
    "dress_code_reminder",
    "weather_advisory",
    "parking_update",
    "photos_uploaded",
    "post_event_thank_you",
    "custom",
  ]),
  title: z.string().min(3).max(120),
  subject: z.string().max(140).optional(),
  message: z.string().min(10).max(2000),
  language: z.string().max(10).default("en"),
  audience: z.object({
    guestIds: z.array(z.string()).max(500).optional(),
    segments: z.array(z.string()).max(10).optional(),
    responses: z.array(z.enum(["yes", "no", "maybe", "pending"])).max(4).optional(),
    languages: z.array(z.string()).max(5).optional(),
    onlyMissingRsvp: z.boolean().optional(),
  }),
});

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const buildCsv = (headers: string[], rows: Array<Array<unknown>>) => [
  headers.map(csvEscape).join(","),
  ...rows.map((row) => row.map(csvEscape).join(",")),
].join("\n");

const buildExportPack = (inviteSlug: string, guests: Awaited<ReturnType<typeof prisma.inviteGuest.findMany>>) => {
  const attending = guests.filter((guest) => guest.response === "yes");
  const files = [
    {
      filename: `caterer-sheet-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Household", "Guests", "Meal", "Dietary Notes"], attending.map((guest) => [
        guest.name,
        guest.household ?? "",
        guest.guestCount,
        guest.mealChoice ?? "Unspecified",
        guest.dietaryRestrictions ?? "",
      ])),
    },
    {
      filename: `venue-headcount-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Response", "Guests", "Adults", "Children"], guests.map((guest) => [
        guest.name,
        guest.response ?? "pending",
        guest.guestCount,
        guest.adultCount ?? "",
        guest.childCount ?? "",
      ])),
    },
    {
      filename: `welcome-desk-checkin-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Email", "Segment", "Response", "Hotel"], guests.map((guest) => [
        guest.name,
        guest.email ?? "",
        guest.audienceSegment,
        guest.response ?? "pending",
        guest.hotelName ?? "",
      ])),
    },
    {
      filename: `room-block-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Hotel", "Room Type", "Rooms", "Check-in", "Check-out"], guests.filter((guest) => guest.stayNeeded).map((guest) => [
        guest.name,
        guest.hotelName ?? "Unassigned",
        guest.roomType ?? "",
        guest.roomCount,
        guest.checkInDate?.toISOString().slice(0, 10) ?? "",
        guest.checkOutDate?.toISOString().slice(0, 10) ?? "",
      ])),
    },
    {
      filename: `shuttle-manifest-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Guests", "Mode", "Arrival", "Departure"], guests.filter((guest) => guest.shuttleRequired || guest.transportMode).map((guest) => [
        guest.name,
        guest.guestCount,
        guest.transportMode ?? "shuttle",
        guest.arrivalDetails ?? "",
        guest.departureDetails ?? "",
      ])),
    },
    {
      filename: `family-shot-list-${inviteSlug}.csv`,
      content: buildCsv(["Guest", "Household", "Segment", "Notes"], guests.filter((guest) => guest.audienceSegment === "family").map((guest) => [
        guest.name,
        guest.household ?? "",
        guest.audienceSegment,
        guest.supportNotes ?? "",
      ])),
    },
  ];

  return files;
};

router.get(
  "/:inviteId",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, [
      "edit_content",
      "manage_rsvps",
      "send_reminders",
      "view_reports",
      "handle_guest_support",
    ]);

    const [invite, guests, collaborators, broadcasts] = await Promise.all([
      prisma.invite.findUniqueOrThrow({ where: { id: access.invite.id } }),
      prisma.inviteGuest.findMany({ where: { inviteId }, orderBy: [{ household: "asc" }, { name: "asc" }] }),
      prisma.inviteCollaborator.findMany({ where: { inviteId }, orderBy: { createdAt: "asc" } }),
      prisma.inviteBroadcast.findMany({
        where: { inviteId },
        include: { recipients: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const data = (invite.data ?? {}) as Record<string, unknown>;
    const summary = buildOperationsSummary(guests);

    return sendSuccess(res, {
      invite: {
        id: invite.id,
        slug: invite.slug,
        status: invite.status,
        templateSlug: invite.templateSlug,
      },
      rsvpSettings: normalizeRsvpSettings(data),
      localization: normalizeLocalizationSettings(data),
      summary,
      guests: guests.map((guest) => ({
        ...guest,
        guestLink: `${env.FRONTEND_URL}/i/${invite.slug}?guest=${guest.token}&lang=${guest.language}`,
      })),
      collaborators,
      broadcasts: broadcasts.map((broadcast) => ({
        ...broadcast,
        stats: {
          sent: broadcast.recipients.filter((recipient) => recipient.status === "sent" || recipient.status === "opened").length,
          opened: broadcast.recipients.filter((recipient) => recipient.status === "opened").length,
          bounced: broadcast.recipients.filter((recipient) => recipient.status === "bounced").length,
        },
      })),
      accessRole: access.isOwner ? "owner" : access.collaborator?.roleLabel ?? "collaborator",
      permissions: access.isOwner ? COLLABORATOR_PERMISSIONS : access.collaborator?.permissions ?? [],
    });
  }),
);

router.put(
  "/:inviteId/rsvp-settings",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = rsvpSettingsSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["edit_content", "manage_rsvps"]);

    const updated = await prisma.invite.update({
      where: { id: access.invite.id },
      data: { data: mergeInviteData(access.invite.data, { rsvpSettings: payload }) },
    });

    return sendSuccess(res, { rsvpSettings: normalizeRsvpSettings((updated.data ?? {}) as Record<string, unknown>) });
  }),
);

router.put(
  "/:inviteId/localization",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = localizationSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["edit_content"]);

    const updated = await prisma.invite.update({
      where: { id: access.invite.id },
      data: { data: mergeInviteData(access.invite.data, { localization: payload }) },
    });

    return sendSuccess(res, { localization: normalizeLocalizationSettings((updated.data ?? {}) as Record<string, unknown>) });
  }),
);

router.post(
  "/:inviteId/guests",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = guestSchema.parse(req.body);
    await requireInviteOpsAccess(req.user!.id, inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);

    const guest = await prisma.inviteGuest.create({
      data: {
        inviteId,
        name: payload.name,
        email: payload.email || undefined,
        phone: payload.phone,
        household: payload.household,
        audienceSegment: payload.audienceSegment,
        tags: payload.tags,
        language: payload.language,
        invitationStatus: payload.invitationStatus,
        response: payload.response ?? undefined,
        guestCount: payload.guestCount,
        adultCount: payload.adultCount ?? undefined,
        childCount: payload.childCount ?? undefined,
        mealChoice: payload.mealChoice,
        dietaryRestrictions: payload.dietaryRestrictions,
        stayNeeded: payload.stayNeeded,
        lodgingStatus: payload.lodgingStatus,
        hotelName: payload.hotelName,
        roomType: payload.roomType,
        roomCount: payload.roomCount,
        checkInDate: payload.checkInDate ? new Date(payload.checkInDate) : undefined,
        checkOutDate: payload.checkOutDate ? new Date(payload.checkOutDate) : undefined,
        shuttleRequired: payload.shuttleRequired,
        transportMode: payload.transportMode,
        arrivalDetails: payload.arrivalDetails,
        departureDetails: payload.departureDetails,
        parkingRequired: payload.parkingRequired,
        supportNotes: payload.supportNotes,
      },
    });

    return sendSuccess(res, guest, undefined, 201);
  }),
);

router.put(
  "/:inviteId/guests/:guestId",
  asyncHandler(async (req, res) => {
    const params = z.object({ inviteId: z.string().min(1), guestId: z.string().min(1) }).parse(req.params);
    const payload = guestSchema.parse(req.body);
    await requireInviteOpsAccess(req.user!.id, params.inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);

    const guest = await prisma.inviteGuest.update({
      where: { id: params.guestId },
      data: {
        name: payload.name,
        email: payload.email || undefined,
        phone: payload.phone,
        household: payload.household,
        audienceSegment: payload.audienceSegment,
        tags: payload.tags,
        language: payload.language,
        invitationStatus: payload.invitationStatus,
        response: payload.response ?? undefined,
        guestCount: payload.guestCount,
        adultCount: payload.adultCount ?? undefined,
        childCount: payload.childCount ?? undefined,
        mealChoice: payload.mealChoice,
        dietaryRestrictions: payload.dietaryRestrictions,
        stayNeeded: payload.stayNeeded,
        lodgingStatus: payload.lodgingStatus,
        hotelName: payload.hotelName,
        roomType: payload.roomType,
        roomCount: payload.roomCount,
        checkInDate: payload.checkInDate ? new Date(payload.checkInDate) : null,
        checkOutDate: payload.checkOutDate ? new Date(payload.checkOutDate) : null,
        shuttleRequired: payload.shuttleRequired,
        transportMode: payload.transportMode,
        arrivalDetails: payload.arrivalDetails,
        departureDetails: payload.departureDetails,
        parkingRequired: payload.parkingRequired,
        supportNotes: payload.supportNotes,
      },
    });

    return sendSuccess(res, guest);
  }),
);

router.delete(
  "/:inviteId/guests/:guestId",
  asyncHandler(async (req, res) => {
    const params = z.object({ inviteId: z.string().min(1), guestId: z.string().min(1) }).parse(req.params);
    await requireInviteOpsAccess(req.user!.id, params.inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);
    await prisma.inviteGuest.delete({ where: { id: params.guestId } });
    return sendSuccess(res, { message: "Guest removed" });
  }),
);

router.post(
  "/:inviteId/collaborators",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = collaboratorSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId);
    if (!access.isOwner) {
      throw new AppError("Only the buyer can manage collaborators", 403);
    }

    const invite = await prisma.invite.findUniqueOrThrow({ where: { id: inviteId } });
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
    const collaborator = await prisma.inviteCollaborator.upsert({
      where: {
        inviteId_email: {
          inviteId,
          email: payload.email.toLowerCase(),
        },
      },
      create: {
        inviteId,
        email: payload.email.toLowerCase(),
        name: payload.name,
        roleLabel: payload.roleLabel,
        permissions: payload.permissions,
        invitedByUserId: req.user!.id,
        userId: existingUser?.id,
        status: existingUser ? "active" : "pending",
        joinedAt: existingUser ? new Date() : undefined,
      },
      update: {
        name: payload.name,
        roleLabel: payload.roleLabel,
        permissions: payload.permissions,
        userId: existingUser?.id,
        status: existingUser ? "active" : "pending",
        joinedAt: existingUser ? new Date() : undefined,
      },
    });

    await sendCollaboratorInviteEmail(payload.email.toLowerCase(), {
      inviterName: req.user!.name,
      eventName: invite.slug,
      roleLabel: payload.roleLabel,
      permissions: payload.permissions,
      dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
    });

    return sendSuccess(res, collaborator, undefined, 201);
  }),
);

router.delete(
  "/:inviteId/collaborators/:collaboratorId",
  asyncHandler(async (req, res) => {
    const params = z.object({ inviteId: z.string().min(1), collaboratorId: z.string().min(1) }).parse(req.params);
    const access = await requireInviteOpsAccess(req.user!.id, params.inviteId);
    if (!access.isOwner) {
      throw new AppError("Only the buyer can manage collaborators", 403);
    }

    await prisma.inviteCollaborator.update({
      where: { id: params.collaboratorId },
      data: { status: "revoked" },
    });

    return sendSuccess(res, { message: "Collaborator removed" });
  }),
);

router.get(
  "/:inviteId/automation",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    await requireInviteOpsAccess(req.user!.id, inviteId, ["manage_rsvps", "view_reports", "handle_guest_support", "edit_content"]);
    const guests = await prisma.inviteGuest.findMany({ where: { inviteId } });
    return sendSuccess(res, buildOperationsSummary(guests));
  }),
);

router.get(
  "/:inviteId/export-pack",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    await requireInviteOpsAccess(req.user!.id, inviteId, ["manage_rsvps", "view_reports", "handle_guest_support", "edit_content"]);
    const invite = await prisma.invite.findUniqueOrThrow({ where: { id: inviteId } });
    const guests = await prisma.inviteGuest.findMany({ where: { inviteId }, orderBy: { name: "asc" } });
    return sendSuccess(res, {
      generatedAt: new Date().toISOString(),
      files: buildExportPack(invite.slug, guests),
    });
  }),
);

router.post(
  "/:inviteId/broadcasts",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = broadcastSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["send_reminders", "manage_rsvps", "edit_content"]);
    const invite = await prisma.invite.findUniqueOrThrow({ where: { id: inviteId } });

    const guests = await prisma.inviteGuest.findMany({
      where: {
        inviteId,
        ...(payload.audience.guestIds?.length ? { id: { in: payload.audience.guestIds } } : {}),
      },
      orderBy: { name: "asc" },
    });

    const selectedGuests = guests.filter((guest) => {
      if (payload.audience.segments?.length && !payload.audience.segments.includes(guest.audienceSegment)) return false;
      if (payload.audience.languages?.length && !payload.audience.languages.includes(guest.language)) return false;
      if (payload.audience.onlyMissingRsvp && guest.response) return false;
      if (payload.audience.responses?.length) {
        const guestResponse = guest.response ?? "pending";
        if (!payload.audience.responses.includes(guestResponse as RsvpResponse | "pending")) return false;
      }
      return Boolean(guest.email);
    });

    if (selectedGuests.length === 0) {
      throw new AppError("No guests matched this broadcast audience", 400);
    }

    const broadcast = await prisma.inviteBroadcast.create({
      data: {
        inviteId,
        type: payload.type,
        title: payload.title,
        subject: payload.subject,
        message: payload.message,
        language: payload.language,
        audience: payload.audience,
        createdByUserId: req.user!.id,
      },
    });

    const recipientResults = [];
    for (const guest of selectedGuests) {
      const language = pickGuestLanguage((invite.data ?? {}) as Record<string, unknown>, payload.language, guest.language);
      const inviteUrl = `${env.FRONTEND_URL}/i/${invite.slug}?guest=${guest.token}&lang=${language}`;
      const recipient = await prisma.broadcastRecipient.create({
        data: {
          broadcastId: broadcast.id,
          guestId: guest.id,
          email: guest.email!,
          name: guest.name,
          language,
          inviteUrl,
        },
      });

      try {
        await sendGuestBroadcastEmail(guest.email!, {
          subject: payload.subject || payload.title,
          title: payload.title,
          content: payload.message,
          ctaLabel: "Open invitation",
          ctaUrl: inviteUrl,
          trackingPixelUrl: `${env.FRONTEND_URL}/api/public/broadcasts/open/${recipient.openToken}.gif`,
        });

        const updatedRecipient = await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: "sent", sentAt: new Date() },
        });
        await prisma.inviteGuest.update({
          where: { id: guest.id },
          data: { lastBroadcastAt: new Date() },
        });
        recipientResults.push(updatedRecipient);
      } catch (error) {
        const updatedRecipient = await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "bounced",
            bouncedAt: new Date(),
            errorMessage: error instanceof Error ? error.message.slice(0, 250) : "Delivery failed",
          },
        });
        recipientResults.push(updatedRecipient);
      }
    }

    const sentCount = recipientResults.filter((recipient) => recipient.status === "sent").length;
    const bouncedCount = recipientResults.filter((recipient) => recipient.status === "bounced").length;

    const updatedBroadcast = await prisma.inviteBroadcast.update({
      where: { id: broadcast.id },
      data: {
        status: bouncedCount > 0 && sentCount > 0 ? "partial" : "sent",
        sentAt: new Date(),
      },
      include: { recipients: true },
    });

    return sendSuccess(res, updatedBroadcast, undefined, 201);
  }),
);

export default router;
