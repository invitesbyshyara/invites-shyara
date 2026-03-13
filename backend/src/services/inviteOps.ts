import { Prisma, RsvpResponse } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const COLLABORATOR_PERMISSIONS = [
  "edit_content",
  "manage_rsvps",
  "send_reminders",
  "view_reports",
  "handle_guest_support",
] as const;

export type CollaboratorPermission = (typeof COLLABORATOR_PERMISSIONS)[number];

export const DEFAULT_LANGUAGE = "en";
export const SUPPORTED_GUEST_LANGUAGES = ["en", "es", "fr", "de", "it"] as const;

export type CustomRsvpQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "number";
  required: boolean;
  options?: string[];
  translations?: Record<string, string>;
};

export type NormalizedRsvpSettings = {
  collectEmail: boolean;
  allowPlusOnes: boolean;
  maxGuestCount: number;
  collectAdultsChildrenSplit: boolean;
  collectMealChoice: boolean;
  mealOptions: string[];
  collectDietaryRestrictions: boolean;
  collectTravelPlans: boolean;
  collectStayNeeds: boolean;
  collectHousehold: boolean;
  collectPhone: boolean;
  deadline?: string;
  customQuestions: CustomRsvpQuestion[];
};

export type LocalizationSettings = {
  defaultLanguage: string;
  enabledLanguages: string[];
  translations: Record<string, Record<string, unknown>>;
};

export const normalizeRsvpSettings = (data: Record<string, unknown>): NormalizedRsvpSettings => {
  const raw = (data.rsvpSettings ?? {}) as Record<string, unknown>;
  const questions = Array.isArray(raw.customQuestions) ? raw.customQuestions.slice(0, 6) : [];

  return {
    collectEmail: raw.collectEmail !== false,
    allowPlusOnes: raw.allowPlusOnes !== false,
    maxGuestCount: Math.min(Math.max(Number(raw.maxGuestCount ?? 4) || 4, 1), 12),
    collectAdultsChildrenSplit: raw.collectAdultsChildrenSplit === true,
    collectMealChoice: raw.collectMealChoice === true,
    mealOptions: Array.isArray(raw.mealOptions) ? raw.mealOptions.map(String).filter(Boolean).slice(0, 8) : [],
    collectDietaryRestrictions: raw.collectDietaryRestrictions !== false,
    collectTravelPlans: raw.collectTravelPlans === true,
    collectStayNeeds: raw.collectStayNeeds === true,
    collectHousehold: raw.collectHousehold === true,
    collectPhone: raw.collectPhone === true,
    deadline: typeof raw.deadline === "string" && raw.deadline ? raw.deadline : undefined,
    customQuestions: questions.map((question, index) => {
      const value = (question ?? {}) as Record<string, unknown>;
      return {
        id: typeof value.id === "string" && value.id ? value.id : `question_${index + 1}`,
        label: String(value.label ?? `Question ${index + 1}`).slice(0, 80),
        type: ["text", "textarea", "select", "boolean", "number"].includes(String(value.type))
          ? (value.type as CustomRsvpQuestion["type"])
          : "text",
        required: value.required === true,
        options: Array.isArray(value.options)
          ? value.options.map(String).filter(Boolean).slice(0, 6)
          : undefined,
        translations: typeof value.translations === "object" && value.translations
          ? Object.fromEntries(
              Object.entries(value.translations as Record<string, unknown>).map(([key, entry]) => [key, String(entry)])
            )
          : undefined,
      };
    }),
  };
};

export const normalizeLocalizationSettings = (data: Record<string, unknown>): LocalizationSettings => {
  const raw = (data.localization ?? {}) as Record<string, unknown>;
  const enabledLanguages = Array.isArray(raw.enabledLanguages)
    ? raw.enabledLanguages.map(String).filter((language) => SUPPORTED_GUEST_LANGUAGES.includes(language as never)).slice(0, 5)
    : [DEFAULT_LANGUAGE];

  const defaultLanguage =
    typeof raw.defaultLanguage === "string" && enabledLanguages.includes(raw.defaultLanguage)
      ? raw.defaultLanguage
      : enabledLanguages[0] ?? DEFAULT_LANGUAGE;

  return {
    defaultLanguage,
    enabledLanguages: Array.from(new Set(enabledLanguages.length > 0 ? enabledLanguages : [DEFAULT_LANGUAGE])),
    translations: typeof raw.translations === "object" && raw.translations
      ? (raw.translations as Record<string, Record<string, unknown>>)
      : {},
  };
};

export const mergeInviteData = (
  currentData: Prisma.JsonValue | null,
  patch: Record<string, unknown>
): Prisma.InputJsonValue => {
  const current: Prisma.InputJsonObject = currentData && typeof currentData === "object" && !Array.isArray(currentData)
    ? { ...(currentData as Prisma.JsonObject) }
    : {};

  return {
    ...current,
    ...(patch as Prisma.InputJsonObject),
  };
};

export const activateCollaboratorInvitations = async (email: string, userId: string, name?: string) => {
  await prisma.inviteCollaborator.updateMany({
    where: {
      email: email.toLowerCase(),
      status: "pending",
    },
    data: {
      userId,
      name,
      status: "active",
      joinedAt: new Date(),
    },
  });
};

export const getInviteAccess = async (userId: string, inviteId: string) => {
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: {
      collaborators: {
        where: {
          userId,
          status: "active",
        },
      },
    },
  });

  if (!invite) {
    return null;
  }

  if (invite.userId === userId) {
    return { invite, isOwner: true as const, collaborator: null };
  }

  const collaborator = invite.collaborators[0] ?? null;
  if (!collaborator) {
    return null;
  }

  return { invite, isOwner: false as const, collaborator };
};

export const collaboratorHasAnyPermission = (
  collaborator: { permissions: string[] } | null,
  permissions: CollaboratorPermission[]
) => {
  if (!collaborator) return false;
  return collaborator.permissions.some((permission) => permissions.includes(permission as CollaboratorPermission));
};

export const pickGuestLanguage = (
  inviteData: Record<string, unknown>,
  requestedLanguage?: string,
  guestLanguage?: string | null
) => {
  const localization = normalizeLocalizationSettings(inviteData);

  if (requestedLanguage && localization.enabledLanguages.includes(requestedLanguage)) {
    return requestedLanguage;
  }

  if (guestLanguage && localization.enabledLanguages.includes(guestLanguage)) {
    return guestLanguage;
  }

  return localization.defaultLanguage;
};

export const responseLabel = (response?: RsvpResponse | null) => {
  if (!response) return "pending";
  return response;
};

export const buildOperationsSummary = (guests: Array<{
  household: string | null;
  response: RsvpResponse | null;
  guestCount: number;
  adultCount: number | null;
  childCount: number | null;
  mealChoice: string | null;
  stayNeeded: boolean;
  hotelName: string | null;
  roomType: string | null;
  roomCount: number;
  shuttleRequired: boolean;
  transportMode: string | null;
  customAnswers: Prisma.JsonValue | null;
  email: string | null;
}>) => {
  const attending = guests.filter((guest) => guest.response === "yes");
  const households = new Set(attending.map((guest) => guest.household || guest.email || "Walk-in"));

  const mealCounts = attending.reduce<Record<string, number>>((accumulator, guest) => {
    const key = guest.mealChoice || "Unspecified";
    accumulator[key] = (accumulator[key] ?? 0) + Math.max(guest.guestCount, 1);
    return accumulator;
  }, {});

  const roomSummary = attending
    .filter((guest) => guest.stayNeeded)
    .reduce<Record<string, { rooms: number; guests: number }>>((accumulator, guest) => {
      const key = `${guest.hotelName || "Unassigned"} | ${guest.roomType || "Standard"}`;
      const current = accumulator[key] ?? { rooms: 0, guests: 0 };
      current.rooms += Math.max(guest.roomCount || 0, 0);
      current.guests += Math.max(guest.guestCount || 1, 1);
      accumulator[key] = current;
      return accumulator;
    }, {});

  const transportSummary = attending
    .filter((guest) => guest.shuttleRequired || guest.transportMode)
    .reduce<Record<string, number>>((accumulator, guest) => {
      const key = guest.transportMode || (guest.shuttleRequired ? "shuttle" : "unspecified");
      accumulator[key] = (accumulator[key] ?? 0) + Math.max(guest.guestCount, 1);
      return accumulator;
    }, {});

  const missingInfoAlerts = attending.flatMap((guest) => {
    const alerts: string[] = [];
    if (!guest.email) alerts.push("Guest missing email");
    if (guest.stayNeeded && !guest.hotelName) alerts.push("Stay required but hotel not assigned");
    if (guest.shuttleRequired && !guest.transportMode) alerts.push("Transport required but mode missing");
    if (!guest.mealChoice) alerts.push("Meal preference missing");
    return alerts;
  });

  const followUpTasks = [
    ...(Object.keys(mealCounts).includes("Unspecified") ? ["Follow up on missing meal preferences."] : []),
    ...(missingInfoAlerts.length > 0 ? ["Resolve guest records with missing operational information."] : []),
    ...(attending.some((guest) => guest.stayNeeded && guest.roomCount === 0) ? ["Assign rooms for guests who requested accommodation."] : []),
    ...(attending.some((guest) => guest.shuttleRequired) ? ["Confirm shuttle capacity against current demand."] : []),
  ];

  return {
    totals: {
      invited: guests.length,
      attending: attending.reduce((sum, guest) => sum + Math.max(guest.guestCount || 1, 1), 0),
      households: households.size,
      adults: attending.reduce((sum, guest) => sum + (guest.adultCount ?? 0), 0),
      children: attending.reduce((sum, guest) => sum + (guest.childCount ?? 0), 0),
      stayRequests: attending.filter((guest) => guest.stayNeeded).length,
      transportRequests: attending.filter((guest) => guest.shuttleRequired || guest.transportMode).length,
    },
    mealCounts,
    roomSummary,
    transportSummary,
    followUpTasks,
    missingInfoAlerts,
  };
};
