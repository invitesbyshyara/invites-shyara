import { Prisma, RsvpResponse } from "@prisma/client";
import { sanitizeJsonRecord } from "../lib/json";
import { prisma } from "../lib/prisma";
import { sanitizePlainText, sanitizeTextList } from "../lib/sanitize";

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
export const TECHNICAL_GUEST_COUNT_LIMIT = 9_999;

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
  maxGuestCount?: number;
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

export type TranslationSyncStatus = "up_to_date" | "stale" | "failed";

export type LocalizationTranslationMeta = {
  status: TranslationSyncStatus;
  sourceHash?: string;
  translatedAt?: string;
  lastRequestedAt?: string;
  lastError?: string;
  provider?: string;
  model?: string;
};

export type LocalizationSettings = {
  defaultLanguage: string;
  enabledLanguages: string[];
  translations: Record<string, Record<string, unknown>>;
  translationMeta: Record<string, LocalizationTranslationMeta>;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const sanitizeStringList = (value: unknown, maxItems: number, maxLength: number) => {
  return sanitizeTextList(value, maxItems, maxLength);
};

const clampGuestCount = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = Math.trunc(parsed);
  if (normalized < 1) {
    return undefined;
  }

  return Math.min(normalized, TECHNICAL_GUEST_COUNT_LIMIT);
};

const normalizeQuestionTranslations = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const translations = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([language, entry]) => [language, sanitizePlainText(entry, { maxLength: 120 })])
      .filter(([, entry]) => entry.length > 0)
  );

  return Object.keys(translations).length > 0 ? translations : undefined;
};

const normalizeCustomQuestions = (value: unknown) => {
  const questions = Array.isArray(value) ? value.slice(0, 6) : [];

  return questions.map((question, index) => {
    const raw = asRecord(question);
    const typeValue = String(raw.type ?? "text");
    const type = ["text", "textarea", "select", "boolean", "number"].includes(typeValue)
      ? (typeValue as CustomRsvpQuestion["type"])
      : "text";

    return {
      id: sanitizePlainText(raw.id ?? `question_${index + 1}`, { maxLength: 50 }) || `question_${index + 1}`,
      label: sanitizePlainText(raw.label ?? `Question ${index + 1}`, { maxLength: 80 }) || `Question ${index + 1}`,
      type,
      required: raw.required === true,
      options: type === "select" ? sanitizeStringList(raw.options, 6, 50) : undefined,
      translations: normalizeQuestionTranslations(raw.translations),
    };
  });
};

export const normalizeRsvpSettings = (data: Record<string, unknown>): NormalizedRsvpSettings => {
  const raw = asRecord(data.rsvpSettings);
  const legacyMealOptions = sanitizeStringList(data.mealOptions, 8, 50);
  const mealOptions = sanitizeStringList(raw.mealOptions, 8, 50);
  const maxGuestCountConfigured = raw.maxGuestCountConfigured === true;
  const normalizedMaxGuestCount = clampGuestCount(raw.maxGuestCount);
  const deadline =
    typeof raw.deadline === "string" && raw.deadline.trim()
      ? raw.deadline.trim()
      : typeof data.rsvpDeadline === "string" && data.rsvpDeadline.trim()
        ? data.rsvpDeadline.trim()
        : undefined;

  return {
    collectEmail: normalizeBoolean(raw.collectEmail, true),
    allowPlusOnes: normalizeBoolean(raw.allowPlusOnes, true),
    maxGuestCount: maxGuestCountConfigured ? normalizedMaxGuestCount : undefined,
    collectAdultsChildrenSplit: raw.collectAdultsChildrenSplit === true,
    collectMealChoice: raw.collectMealChoice === true || mealOptions.length > 0 || legacyMealOptions.length > 0,
    mealOptions: mealOptions.length > 0 ? mealOptions : legacyMealOptions,
    collectDietaryRestrictions: normalizeBoolean(raw.collectDietaryRestrictions, true),
    collectTravelPlans: raw.collectTravelPlans === true,
    collectStayNeeds: raw.collectStayNeeds === true,
    collectHousehold: raw.collectHousehold === true,
    collectPhone: raw.collectPhone === true,
    deadline,
    customQuestions: normalizeCustomQuestions(raw.customQuestions),
  };
};

const normalizeTranslationMeta = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, LocalizationTranslationMeta>;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([language, entry]) => {
      const raw = asRecord(entry);
      const statusValue = String(raw.status ?? "");

      if (!["up_to_date", "stale", "failed"].includes(statusValue)) {
        return [];
      }

      const meta: LocalizationTranslationMeta = {
        status: statusValue as TranslationSyncStatus,
      };

      if (typeof raw.sourceHash === "string" && raw.sourceHash.trim()) meta.sourceHash = raw.sourceHash.trim();
      if (typeof raw.translatedAt === "string" && raw.translatedAt.trim()) meta.translatedAt = raw.translatedAt.trim();
      if (typeof raw.lastRequestedAt === "string" && raw.lastRequestedAt.trim()) meta.lastRequestedAt = raw.lastRequestedAt.trim();
      if (typeof raw.lastError === "string" && raw.lastError.trim()) meta.lastError = raw.lastError.trim();
      if (typeof raw.provider === "string" && raw.provider.trim()) meta.provider = raw.provider.trim();
      if (typeof raw.model === "string" && raw.model.trim()) meta.model = raw.model.trim();

      return [[language, meta]];
    })
  );
};

export const normalizeLocalizationSettings = (data: Record<string, unknown>): LocalizationSettings => {
  const raw = asRecord(data.localization);
  const requestedLanguages = Array.isArray(raw.enabledLanguages)
    ? raw.enabledLanguages
        .map((language) => String(language ?? "").trim())
        .filter((language): language is typeof DEFAULT_LANGUAGE => SUPPORTED_GUEST_LANGUAGES.includes(language as typeof DEFAULT_LANGUAGE))
    : [DEFAULT_LANGUAGE];
  const enabledLanguages = Array.from(new Set(requestedLanguages.length > 0 ? requestedLanguages : [DEFAULT_LANGUAGE])).slice(0, 5);
  const defaultLanguage =
    typeof raw.defaultLanguage === "string" && enabledLanguages.includes(raw.defaultLanguage)
      ? raw.defaultLanguage
      : enabledLanguages[0] ?? DEFAULT_LANGUAGE;
  const translations = raw.translations && typeof raw.translations === "object" && !Array.isArray(raw.translations)
    ? (raw.translations as Record<string, Record<string, unknown>>)
    : {};

  return {
    defaultLanguage,
    enabledLanguages,
    translations,
    translationMeta: normalizeTranslationMeta(raw.translationMeta),
  };
};

const toJsonObject = (value: Prisma.JsonValue | null) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? ({ ...(value as Prisma.JsonObject) } satisfies Prisma.InputJsonObject)
    : ({} satisfies Prisma.InputJsonObject);

const serializeRsvpSettings = (settings: NormalizedRsvpSettings): Prisma.InputJsonObject => ({
  collectEmail: settings.collectEmail,
  allowPlusOnes: settings.allowPlusOnes,
  ...(settings.maxGuestCount !== undefined
    ? { maxGuestCount: settings.maxGuestCount, maxGuestCountConfigured: true }
    : { maxGuestCountConfigured: false }),
  collectAdultsChildrenSplit: settings.collectAdultsChildrenSplit,
  collectMealChoice: settings.collectMealChoice,
  mealOptions: settings.mealOptions,
  collectDietaryRestrictions: settings.collectDietaryRestrictions,
  collectTravelPlans: settings.collectTravelPlans,
  collectStayNeeds: settings.collectStayNeeds,
  collectHousehold: settings.collectHousehold,
  collectPhone: settings.collectPhone,
  ...(settings.deadline ? { deadline: settings.deadline } : {}),
  customQuestions: settings.customQuestions,
});

const serializeLocalizationSettings = (settings: LocalizationSettings): Prisma.InputJsonObject => ({
  defaultLanguage: settings.defaultLanguage,
  enabledLanguages: settings.enabledLanguages,
  translations: settings.translations as Prisma.InputJsonObject,
  translationMeta: settings.translationMeta as Prisma.InputJsonObject,
});

export const mergeInviteData = (
  currentData: Prisma.JsonValue | null,
  patch: Record<string, unknown>
): Prisma.InputJsonValue => {
  const current = toJsonObject(currentData);

  return {
    ...current,
    ...(patch as Prisma.InputJsonObject),
  };
};

export const normalizeInviteDataForPersistence = (data: Record<string, unknown>): Prisma.InputJsonValue => {
  const next = { ...sanitizeJsonRecord(data) };
  delete next.mealOptions;
  delete next.rsvpDeadline;

  const normalized = {
    ...next,
    rsvpSettings: serializeRsvpSettings(normalizeRsvpSettings(next)),
    localization: serializeLocalizationSettings(normalizeLocalizationSettings(next)),
  };

  return normalized as Prisma.InputJsonValue;
};

export const setInviteRsvpSettings = (
  currentData: Prisma.JsonValue | null,
  settings: NormalizedRsvpSettings
): Prisma.InputJsonValue => {
  const current = toJsonObject(currentData);
  delete current.mealOptions;
  delete current.rsvpDeadline;

  return {
    ...current,
    rsvpSettings: serializeRsvpSettings(settings),
  };
};

export const setInviteLocalization = (
  currentData: Prisma.JsonValue | null,
  localization: LocalizationSettings
): Prisma.InputJsonValue => {
  const current = toJsonObject(currentData);

  return {
    ...current,
    localization: serializeLocalizationSettings(localization),
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

export const collaboratorHasPermission = (
  collaborator: { permissions: string[] } | null,
  permission: CollaboratorPermission
) => collaborator?.permissions.includes(permission) ?? false;

export const collaboratorHasAnyPermission = (
  collaborator: { permissions: string[] } | null,
  permissions: CollaboratorPermission[]
) => {
  if (!collaborator) return false;
  return collaborator.permissions.some((permission) => permissions.includes(permission as CollaboratorPermission));
};

export const getMissingCollaboratorPermissions = (
  collaborator: { permissions: string[] } | null,
  permissions: CollaboratorPermission[]
) => permissions.filter((permission) => !collaboratorHasPermission(collaborator, permission));

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
    ...(attending.some((guest) => guest.stayNeeded && guest.roomCount === 0)
      ? ["Assign rooms for guests who requested accommodation."]
      : []),
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
