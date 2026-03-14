import { Router } from "express";
import { Prisma, RsvpResponse } from "@prisma/client";
import { z } from "zod";
import { env } from "../lib/env";
import { createAiLocalizationRateLimit, createAiWriteRateLimit } from "../middleware/aiRateLimit";
import { prisma } from "../lib/prisma";
import { buildCanonicalApiUrl } from "../lib/apiPaths";
import { verifyToken } from "../middleware/auth";
import { sanitizeEmail, sanitizeOptionalText, sanitizePlainText, sanitizeTextList } from "../lib/sanitize";
import { sendCollaboratorInviteEmail, sendGuestBroadcastEmail } from "../services/email";
import {
  buildOperationsSummary,
  collaboratorHasAnyPermission,
  collaboratorHasPermission,
  COLLABORATOR_PERMISSIONS,
  getInviteAccess,
  getMissingCollaboratorPermissions,
  normalizeLocalizationSettings,
  normalizeRsvpSettings,
  pickGuestLanguage,
  setInviteLocalization,
  setInviteRsvpSettings,
  TECHNICAL_GUEST_COUNT_LIMIT,
} from "../services/inviteOps";
import { markInviteDataTranslationsStale, refreshInviteTranslations, scheduleInviteTranslationRefresh } from "../services/inviteTranslation";
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
  guestCount: z.coerce.number().int().min(1).max(TECHNICAL_GUEST_COUNT_LIMIT).default(1),
  adultCount: z.coerce.number().int().min(0).max(TECHNICAL_GUEST_COUNT_LIMIT).optional().nullable(),
  childCount: z.coerce.number().int().min(0).max(TECHNICAL_GUEST_COUNT_LIMIT).optional().nullable(),
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

const optionalConfiguredGuestCountSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  },
  z.coerce.number().int().min(1).max(TECHNICAL_GUEST_COUNT_LIMIT).optional()
);

const rsvpSettingsSchema = z.object({
  collectEmail: z.boolean(),
  allowPlusOnes: z.boolean(),
  maxGuestCount: optionalConfiguredGuestCountSchema,
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
}).superRefine((value, ctx) => {
  const mealOptions = Array.from(
    new Set(value.mealOptions.map((option) => option.trim()).filter(Boolean).map((option) => option.toLowerCase()))
  );

  if (value.collectMealChoice && mealOptions.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mealOptions"],
      message: "Add at least one meal option when meal selection is enabled.",
    });
  }
});

const localizationSchema = z.object({
  defaultLanguage: z.string().max(10),
  enabledLanguages: z.array(z.string().max(10)).min(1).max(5),
}).strict();

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

const accessRequestSchema = z.object({
  permissions: z.array(z.enum(COLLABORATOR_PERMISSIONS)).min(1).max(COLLABORATOR_PERMISSIONS.length),
});

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const uniq = <T,>(values: T[]) => Array.from(new Set(values));

const optionalText = (value: string | null | undefined) => {
  return sanitizeOptionalText(value, { maxLength: 800 });
};

const parseOptionalDate = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Invalid date provided", 400);
  }

  return parsed;
};

const requireOwnerAccess = async (userId: string, inviteId: string) => {
  const access = await requireInviteOpsAccess(userId, inviteId);
  if (!access.isOwner) {
    throw new AppError("Only the buyer can manage collaborators", 403);
  }
  return access;
};

const getWorkspacePermissions = (access: Awaited<ReturnType<typeof getInviteAccess>>) =>
  access?.isOwner ? [...COLLABORATOR_PERMISSIONS] : ((access?.collaborator?.permissions ?? []) as Array<(typeof COLLABORATOR_PERMISSIONS)[number]>);

type AccessRequestRecord = {
  id: string;
  inviteId: string;
  requesterUserId: string;
  requesterCollaboratorId: string;
  requestedPermissions: string[];
  status: string;
  requestedAt: Date;
  decidedAt: Date | null;
  decidedByUserId: string | null;
  requester?: { id: string; name: string; email: string } | null;
  requesterCollaborator?: {
    id: string;
    email: string;
    name: string | null;
    roleLabel: string;
    status: string;
    permissions: string[];
  } | null;
  decider?: { id: string; name: string; email: string } | null;
};

const serializeAccessRequest = (request: AccessRequestRecord) => ({
  id: request.id,
  inviteId: request.inviteId,
  requesterUserId: request.requesterUserId,
  requesterCollaboratorId: request.requesterCollaboratorId,
  requestedPermissions: request.requestedPermissions.filter((permission): permission is (typeof COLLABORATOR_PERMISSIONS)[number] =>
    COLLABORATOR_PERMISSIONS.includes(permission as (typeof COLLABORATOR_PERMISSIONS)[number])
  ),
  status: request.status,
  requestedAt: request.requestedAt,
  decidedAt: request.decidedAt,
  decidedByUserId: request.decidedByUserId,
  requester: request.requester
    ? {
        id: request.requester.id,
        name: request.requester.name,
        email: request.requester.email,
      }
    : undefined,
  requesterCollaborator: request.requesterCollaborator
    ? {
        id: request.requesterCollaborator.id,
        email: request.requesterCollaborator.email,
        name: request.requesterCollaborator.name,
        roleLabel: request.requesterCollaborator.roleLabel,
        status: request.requesterCollaborator.status,
        permissions: request.requesterCollaborator.permissions,
      }
    : undefined,
  decider: request.decider
    ? {
        id: request.decider.id,
        name: request.decider.name,
        email: request.decider.email,
      }
    : undefined,
});

const validateGuestPartyCounts = ({
  guestCount,
  adultCount,
  childCount,
}: {
  guestCount: number;
  adultCount?: number | null;
  childCount?: number | null;
}) => {
  const adults = Math.max(0, adultCount ?? 0);
  const children = Math.max(0, childCount ?? 0);

  if (adults + children > guestCount) {
    throw new AppError("Adults and children cannot exceed total guests", 400);
  }
};

const assertMealChoiceAllowed = ({
  mealChoice,
  rsvpSettings,
  existingMealChoice,
}: {
  mealChoice?: string;
  rsvpSettings: ReturnType<typeof normalizeRsvpSettings>;
  existingMealChoice?: string | null;
}) => {
  const normalizedMealChoice = optionalText(mealChoice);
  if (!normalizedMealChoice) {
    return undefined;
  }

  const allowedChoices = new Set(rsvpSettings.mealOptions);
  if (existingMealChoice) {
    allowedChoices.add(existingMealChoice);
  }

  if (allowedChoices.size > 0 && !allowedChoices.has(normalizedMealChoice)) {
    throw new AppError("Meal choice must match one of the configured options", 400);
  }

  return normalizedMealChoice;
};

const buildGuestMutationData = ({
  payload,
  rsvpSettings,
  existingMealChoice,
}: {
  payload: z.infer<typeof guestSchema>;
  rsvpSettings: ReturnType<typeof normalizeRsvpSettings>;
  existingMealChoice?: string | null;
}) => {
  validateGuestPartyCounts(payload);

  return {
    name: sanitizePlainText(payload.name, { maxLength: 120 }),
    email: payload.email ? sanitizeEmail(payload.email) : undefined,
    phone: optionalText(payload.phone),
    household: optionalText(payload.household),
    audienceSegment: optionalText(payload.audienceSegment) ?? "general",
    tags: sanitizeTextList(payload.tags, 8, 30),
    language: optionalText(payload.language) ?? "en",
    invitationStatus: payload.invitationStatus,
    response: payload.response ?? undefined,
    guestCount: payload.guestCount,
    adultCount: payload.adultCount ?? undefined,
    childCount: payload.childCount ?? undefined,
    mealChoice: assertMealChoiceAllowed({
      mealChoice: payload.mealChoice,
      rsvpSettings,
      existingMealChoice,
    }),
    dietaryRestrictions: optionalText(payload.dietaryRestrictions),
    stayNeeded: payload.stayNeeded,
    lodgingStatus: optionalText(payload.lodgingStatus),
    hotelName: optionalText(payload.hotelName),
    roomType: optionalText(payload.roomType),
    roomCount: payload.roomCount,
    checkInDate: parseOptionalDate(payload.checkInDate),
    checkOutDate: parseOptionalDate(payload.checkOutDate),
    shuttleRequired: payload.shuttleRequired,
    transportMode: optionalText(payload.transportMode),
    arrivalDetails: optionalText(payload.arrivalDetails),
    departureDetails: optionalText(payload.departureDetails),
    parkingRequired: payload.parkingRequired,
    supportNotes: optionalText(payload.supportNotes),
  };
};

const buildWorkspaceGuest = (
  guest: Awaited<ReturnType<typeof prisma.inviteGuest.findMany>>[number],
  inviteSlug: string,
  includeSensitiveFields: boolean
) => {
  const base = {
    id: guest.id,
    inviteId: guest.inviteId,
    token: includeSensitiveFields ? guest.token : "",
    name: guest.name,
    email: guest.email ?? undefined,
    language: guest.language,
    audienceSegment: guest.audienceSegment,
    invitationStatus: guest.invitationStatus,
    response: guest.response ?? undefined,
    guestCount: guest.guestCount,
    guestLink: `${env.FRONTEND_URL}/i/${inviteSlug}?guest=${guest.token}&lang=${guest.language}`,
    lastBroadcastAt: guest.lastBroadcastAt?.toISOString(),
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
    tags: guest.tags,
  };

  if (!includeSensitiveFields) {
    return base;
  }

  return {
    ...base,
    phone: guest.phone ?? undefined,
    household: guest.household ?? undefined,
    adultCount: guest.adultCount ?? undefined,
    childCount: guest.childCount ?? undefined,
    message: guest.message ?? undefined,
    mealChoice: guest.mealChoice ?? undefined,
    dietaryRestrictions: guest.dietaryRestrictions ?? undefined,
    customAnswers: guest.customAnswers ?? undefined,
    stayNeeded: guest.stayNeeded,
    lodgingStatus: guest.lodgingStatus ?? undefined,
    hotelName: guest.hotelName ?? undefined,
    roomType: guest.roomType ?? undefined,
    roomCount: guest.roomCount,
    checkInDate: guest.checkInDate?.toISOString(),
    checkOutDate: guest.checkOutDate?.toISOString(),
    shuttleRequired: guest.shuttleRequired,
    transportMode: guest.transportMode ?? undefined,
    arrivalDetails: guest.arrivalDetails ?? undefined,
    departureDetails: guest.departureDetails ?? undefined,
    parkingRequired: guest.parkingRequired,
    supportNotes: guest.supportNotes ?? undefined,
    inviteSentAt: guest.inviteSentAt?.toISOString(),
    rsvpSubmittedAt: guest.rsvpSubmittedAt?.toISOString(),
  };
};

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
    const access = await requireInviteOpsAccess(req.user!.id, inviteId);
    const workspacePermissions = getWorkspacePermissions(access);
    const canViewFullGuests =
      access.isOwner || collaboratorHasAnyPermission(access.collaborator, ["manage_rsvps", "handle_guest_support", "edit_content"]);
    const canViewGuestDirectory = canViewFullGuests || access.isOwner || collaboratorHasPermission(access.collaborator, "send_reminders");
    const canEditContent = access.isOwner || collaboratorHasPermission(access.collaborator, "edit_content");
    const canViewReports = access.isOwner || collaboratorHasPermission(access.collaborator, "view_reports");
    const canManageBroadcasts = access.isOwner || collaboratorHasPermission(access.collaborator, "send_reminders");
    const canManageCollaborators = access.isOwner;

    const [invite, guests, collaborators, broadcasts, accessRequests, myAccessRequests] = await Promise.all([
      prisma.invite.findUniqueOrThrow({ where: { id: access.invite.id } }),
      canViewGuestDirectory || canViewReports
        ? prisma.inviteGuest.findMany({ where: { inviteId }, orderBy: [{ household: "asc" }, { name: "asc" }] })
        : Promise.resolve([]),
      canManageCollaborators
        ? prisma.inviteCollaborator.findMany({ where: { inviteId }, orderBy: { createdAt: "asc" } })
        : Promise.resolve([]),
      canManageBroadcasts
        ? prisma.inviteBroadcast.findMany({
            where: { inviteId },
            include: { recipients: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
      canManageCollaborators
        ? prisma.inviteAccessRequest.findMany({
            where: { inviteId },
            include: {
              requester: { select: { id: true, name: true, email: true } },
              requesterCollaborator: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  roleLabel: true,
                  status: true,
                  permissions: true,
                },
              },
              decider: { select: { id: true, name: true, email: true } },
            },
            orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
          })
        : Promise.resolve([]),
      access.isOwner
        ? Promise.resolve([])
        : prisma.inviteAccessRequest.findMany({
            where: {
              inviteId,
              requesterUserId: req.user!.id,
            },
            include: {
              requester: { select: { id: true, name: true, email: true } },
              requesterCollaborator: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  roleLabel: true,
                  status: true,
                  permissions: true,
                },
              },
              decider: { select: { id: true, name: true, email: true } },
            },
            orderBy: { requestedAt: "desc" },
          }),
    ]);

    const data = asRecord(invite.data);
    const rsvpSettings = normalizeRsvpSettings(data);
    const localization = normalizeLocalizationSettings(data);

    return sendSuccess(res, {
      invite: {
        id: invite.id,
        slug: invite.slug,
        status: invite.status,
        templateSlug: invite.templateSlug,
      },
      availableLanguages: localization.enabledLanguages,
      defaultLanguage: localization.defaultLanguage,
      rsvpSettings,
      localization: canEditContent ? localization : undefined,
      summary: canViewReports ? buildOperationsSummary(guests) : undefined,
      guests: canViewGuestDirectory
        ? guests.map((guest: Awaited<ReturnType<typeof prisma.inviteGuest.findMany>>[number]) =>
            buildWorkspaceGuest(guest, invite.slug, canViewFullGuests)
          )
        : [],
      collaborators,
      broadcasts: broadcasts.map((broadcast) => {
        const recipients = (broadcast as typeof broadcast & {
          recipients?: Array<{ status: string }>;
        }).recipients ?? [];

        return {
          ...broadcast,
          stats: {
            sent: recipients.filter((recipient) => recipient.status === "sent" || recipient.status === "opened").length,
            opened: recipients.filter((recipient) => recipient.status === "opened").length,
            bounced: recipients.filter((recipient) => recipient.status === "bounced").length,
          },
        };
      }),
      accessRole: access.isOwner ? "owner" : access.collaborator?.roleLabel ?? "collaborator",
      permissions: workspacePermissions,
      requestablePermissions: access.isOwner
        ? []
        : getMissingCollaboratorPermissions(access.collaborator, [...COLLABORATOR_PERMISSIONS]),
      myAccessRequests: myAccessRequests.map(serializeAccessRequest),
      accessRequests: accessRequests.map(serializeAccessRequest),
    });
  }),
);

router.put(
  "/:inviteId/rsvp-settings",
  createAiWriteRateLimit("invite-rsvp-settings"),
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = rsvpSettingsSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["edit_content"]);

    const normalizedRsvpSettings = normalizeRsvpSettings({
      ...(asRecord(access.invite.data)),
      rsvpSettings: {
        ...payload,
        collectMealChoice: payload.collectMealChoice || payload.mealOptions.some((option) => option.trim().length > 0),
        mealOptions: uniq(payload.mealOptions.map((option) => option.trim()).filter(Boolean)).slice(0, 8),
      },
    });
    const nextData = markInviteDataTranslationsStale(
      asRecord(setInviteRsvpSettings(access.invite.data, normalizedRsvpSettings))
    ) as Prisma.InputJsonValue;

    const updated = await prisma.invite.update({
      where: { id: access.invite.id },
      data: { data: nextData },
    });

    scheduleInviteTranslationRefresh(updated.id);

    return sendSuccess(res, {
      rsvpSettings: normalizeRsvpSettings(asRecord(updated.data)),
      localization: normalizeLocalizationSettings(asRecord(updated.data)),
    });
  }),
);

router.put(
  "/:inviteId/localization",
  createAiLocalizationRateLimit("invite-localization"),
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = localizationSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["edit_content"]);

    const normalizedLocalization = normalizeLocalizationSettings({
      ...(asRecord(access.invite.data)),
      localization: payload,
    });
    const nextData = markInviteDataTranslationsStale(
      asRecord(setInviteLocalization(access.invite.data, normalizedLocalization))
    ) as Prisma.InputJsonValue;

    const updated = await prisma.invite.update({
      where: { id: access.invite.id },
      data: { data: nextData },
    });

    await refreshInviteTranslations(updated.id);

    return sendSuccess(res, { localization: normalizeLocalizationSettings(asRecord(updated.data)) });
  }),
);

router.post(
  "/:inviteId/access-requests",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = accessRequestSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId);

    if (access.isOwner || !access.collaborator || access.collaborator.status !== "active") {
      throw new AppError("Only active collaborators can request additional access", 403);
    }

    const requestedPermissions = uniq(payload.permissions);
    const missingPermissions = getMissingCollaboratorPermissions(access.collaborator, requestedPermissions);
    if (missingPermissions.length === 0) {
      throw new AppError("You already have all requested permissions", 400);
    }

    const pendingRequest = await prisma.inviteAccessRequest.findFirst({
      where: {
        inviteId,
        requesterCollaboratorId: access.collaborator.id,
        status: "pending",
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        requesterCollaborator: {
          select: {
            id: true,
            email: true,
            name: true,
            roleLabel: true,
            status: true,
            permissions: true,
          },
        },
        decider: { select: { id: true, name: true, email: true } },
      },
    });

    const accessRequest = pendingRequest
      ? await prisma.inviteAccessRequest.update({
          where: { id: pendingRequest.id },
          data: {
            requestedPermissions: uniq([
              ...pendingRequest.requestedPermissions,
              ...missingPermissions,
            ]),
            requestedAt: new Date(),
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            requesterCollaborator: {
              select: {
                id: true,
                email: true,
                name: true,
                roleLabel: true,
                status: true,
                permissions: true,
              },
            },
            decider: { select: { id: true, name: true, email: true } },
          },
        })
      : await prisma.inviteAccessRequest.create({
          data: {
            inviteId,
            requesterUserId: req.user!.id,
            requesterCollaboratorId: access.collaborator.id,
            requestedPermissions: missingPermissions,
          },
          include: {
            requester: { select: { id: true, name: true, email: true } },
            requesterCollaborator: {
              select: {
                id: true,
                email: true,
                name: true,
                roleLabel: true,
                status: true,
                permissions: true,
              },
            },
            decider: { select: { id: true, name: true, email: true } },
          },
        });

    return sendSuccess(res, serializeAccessRequest(accessRequest), undefined, pendingRequest ? 200 : 201);
  }),
);

router.post(
  "/:inviteId/access-requests/:accessRequestId/approve",
  asyncHandler(async (req, res) => {
    const params = z.object({
      inviteId: z.string().min(1),
      accessRequestId: z.string().min(1),
    }).parse(req.params);

    await requireOwnerAccess(req.user!.id, params.inviteId);

    const accessRequest = await prisma.inviteAccessRequest.findFirst({
      where: {
        id: params.accessRequestId,
        inviteId: params.inviteId,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        requesterCollaborator: {
          select: {
            id: true,
            email: true,
            name: true,
            roleLabel: true,
            status: true,
            permissions: true,
          },
        },
        decider: { select: { id: true, name: true, email: true } },
      },
    });

    if (!accessRequest) {
      throw new AppError("Access request not found", 404);
    }

    if (accessRequest.status !== "pending") {
      throw new AppError("Access request has already been decided", 400);
    }

    if (accessRequest.requesterCollaborator.status !== "active") {
      throw new AppError("Only active collaborators can receive additional access", 409);
    }

    const updated = await prisma.$transaction(async (transaction) => {
      await transaction.inviteCollaborator.update({
        where: { id: accessRequest.requesterCollaboratorId },
        data: {
          permissions: uniq([
            ...accessRequest.requesterCollaborator.permissions,
            ...accessRequest.requestedPermissions,
          ]),
        },
      });

      return transaction.inviteAccessRequest.update({
        where: { id: accessRequest.id },
        data: {
          status: "approved",
          decidedByUserId: req.user!.id,
          decidedAt: new Date(),
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          requesterCollaborator: {
            select: {
              id: true,
              email: true,
              name: true,
              roleLabel: true,
              status: true,
              permissions: true,
            },
          },
          decider: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return sendSuccess(res, serializeAccessRequest(updated));
  }),
);

router.post(
  "/:inviteId/access-requests/:accessRequestId/reject",
  asyncHandler(async (req, res) => {
    const params = z.object({
      inviteId: z.string().min(1),
      accessRequestId: z.string().min(1),
    }).parse(req.params);

    await requireOwnerAccess(req.user!.id, params.inviteId);

    const accessRequest = await prisma.inviteAccessRequest.findFirst({
      where: {
        id: params.accessRequestId,
        inviteId: params.inviteId,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        requesterCollaborator: {
          select: {
            id: true,
            email: true,
            name: true,
            roleLabel: true,
            status: true,
            permissions: true,
          },
        },
        decider: { select: { id: true, name: true, email: true } },
      },
    });

    if (!accessRequest) {
      throw new AppError("Access request not found", 404);
    }

    if (accessRequest.status !== "pending") {
      throw new AppError("Access request has already been decided", 400);
    }

    const updated = await prisma.inviteAccessRequest.update({
      where: { id: accessRequest.id },
      data: {
        status: "rejected",
        decidedByUserId: req.user!.id,
        decidedAt: new Date(),
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        requesterCollaborator: {
          select: {
            id: true,
            email: true,
            name: true,
            roleLabel: true,
            status: true,
            permissions: true,
          },
        },
        decider: { select: { id: true, name: true, email: true } },
      },
    });

    return sendSuccess(res, serializeAccessRequest(updated));
  }),
);

router.post(
  "/:inviteId/guests",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = guestSchema.parse(req.body);
    const access = await requireInviteOpsAccess(req.user!.id, inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);
    const rsvpSettings = normalizeRsvpSettings(asRecord(access.invite.data));

    const guest = await prisma.inviteGuest.create({
      data: {
        inviteId,
        ...buildGuestMutationData({
          payload,
          rsvpSettings,
        }),
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
    const access = await requireInviteOpsAccess(req.user!.id, params.inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);
    const existingGuest = await prisma.inviteGuest.findFirst({
      where: {
        id: params.guestId,
        inviteId: params.inviteId,
      },
    });

    if (!existingGuest) {
      throw new AppError("Guest not found", 404);
    }

    const rsvpSettings = normalizeRsvpSettings(asRecord(access.invite.data));

    const guest = await prisma.inviteGuest.update({
      where: { id: params.guestId },
      data: buildGuestMutationData({
        payload,
        rsvpSettings,
        existingMealChoice: existingGuest.mealChoice,
      }),
    });

    return sendSuccess(res, guest);
  }),
);

router.delete(
  "/:inviteId/guests/:guestId",
  asyncHandler(async (req, res) => {
    const params = z.object({ inviteId: z.string().min(1), guestId: z.string().min(1) }).parse(req.params);
    await requireInviteOpsAccess(req.user!.id, params.inviteId, ["manage_rsvps", "handle_guest_support", "edit_content"]);
    const existingGuest = await prisma.inviteGuest.findFirst({
      where: {
        id: params.guestId,
        inviteId: params.inviteId,
      },
      select: { id: true },
    });

    if (!existingGuest) {
      throw new AppError("Guest not found", 404);
    }

    await prisma.inviteGuest.delete({ where: { id: existingGuest.id } });
    return sendSuccess(res, { message: "Guest removed" });
  }),
);

router.post(
  "/:inviteId/collaborators",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    const payload = collaboratorSchema.parse(req.body);
    await requireOwnerAccess(req.user!.id, inviteId);

    const invite = await prisma.invite.findUniqueOrThrow({ where: { id: inviteId } });
    const email = sanitizeEmail(payload.email);
    const name = payload.name ? sanitizePlainText(payload.name, { maxLength: 120 }) : undefined;
    const roleLabel = sanitizePlainText(payload.roleLabel, { maxLength: 60 });
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const collaborator = await prisma.inviteCollaborator.upsert({
      where: {
        inviteId_email: {
          inviteId,
          email,
        },
      },
      create: {
        inviteId,
        email,
        name,
        roleLabel,
        permissions: payload.permissions,
        invitedByUserId: req.user!.id,
        userId: existingUser?.id,
        status: existingUser ? "active" : "pending",
        joinedAt: existingUser ? new Date() : undefined,
      },
      update: {
        name,
        roleLabel,
        permissions: payload.permissions,
        userId: existingUser?.id,
        status: existingUser ? "active" : "pending",
        joinedAt: existingUser ? new Date() : undefined,
      },
    });

    await sendCollaboratorInviteEmail(email, {
      inviterName: req.user!.name,
      eventName: invite.slug,
      roleLabel,
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
    await requireOwnerAccess(req.user!.id, params.inviteId);

    const collaborator = await prisma.inviteCollaborator.findFirst({
      where: {
        id: params.collaboratorId,
        inviteId: params.inviteId,
      },
      select: { id: true },
    });

    if (!collaborator) {
      throw new AppError("Collaborator not found", 404);
    }

    await prisma.inviteCollaborator.update({
      where: { id: collaborator.id },
      data: { status: "revoked" },
    });

    return sendSuccess(res, { message: "Collaborator removed" });
  }),
);

router.get(
  "/:inviteId/automation",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    await requireInviteOpsAccess(req.user!.id, inviteId, ["view_reports"]);
    const guests = await prisma.inviteGuest.findMany({ where: { inviteId } });
    return sendSuccess(res, buildOperationsSummary(guests));
  }),
);

router.get(
  "/:inviteId/export-pack",
  asyncHandler(async (req, res) => {
    const inviteId = z.string().min(1).parse(req.params.inviteId);
    await requireInviteOpsAccess(req.user!.id, inviteId, ["view_reports"]);
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
    await requireInviteOpsAccess(req.user!.id, inviteId, ["send_reminders"]);
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
        title: sanitizePlainText(payload.title, { maxLength: 120 }),
        subject: payload.subject ? sanitizePlainText(payload.subject, { maxLength: 140 }) : undefined,
        message: sanitizePlainText(payload.message, { maxLength: 2_000 }),
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
          subject: payload.subject ? sanitizePlainText(payload.subject, { maxLength: 140 }) : sanitizePlainText(payload.title, { maxLength: 120 }),
          title: sanitizePlainText(payload.title, { maxLength: 120 }),
          content: sanitizePlainText(payload.message, { maxLength: 2_000 }),
          ctaLabel: "Open invitation",
          ctaUrl: inviteUrl,
          trackingPixelUrl: buildCanonicalApiUrl(`/public/broadcasts/open/${recipient.openToken}.gif`),
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
