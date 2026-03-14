import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";
import {
  DEFAULT_LANGUAGE,
  LocalizationSettings,
  LocalizationTranslationMeta,
  NormalizedRsvpSettings,
  normalizeLocalizationSettings,
  normalizeRsvpSettings,
  setInviteLocalization,
  setInviteRsvpSettings,
} from "./inviteOps";

type TranslationEntry = {
  path: string;
  text: string;
};

type QuestionTranslationEntry = {
  id: string;
  label: string;
};

type TranslationSource = {
  entries: TranslationEntry[];
  questions: QuestionTranslationEntry[];
  sourceHash: string;
};

type GeminiTranslationResponse = {
  entries: TranslationEntry[];
  questions: QuestionTranslationEntry[];
};

const MODEL_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const TRANSLATION_PROVIDER = "gemini";
const refreshTimers = new Map<string, NodeJS.Timeout>();

const languageLabels: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};

const topLevelTranslatableKeys = [
  "loveStory",
  "ourStory",
  "ourJourney",
  "welcomeMessage",
  "description",
  "thankYouMessage",
] as const;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

const extractInviteTranslationSource = (data: Record<string, unknown>): TranslationSource => {
  const entries: TranslationEntry[] = [];

  topLevelTranslatableKeys.forEach((key) => {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      entries.push({ path: key, text: value.trim() });
    }
  });

  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  schedule.forEach((entry, index) => {
    const value = asRecord(entry);
    if (typeof value.title === "string" && value.title.trim()) {
      entries.push({ path: `schedule.${index}.title`, text: value.title.trim() });
    }
    if (typeof value.description === "string" && value.description.trim()) {
      entries.push({ path: `schedule.${index}.description`, text: value.description.trim() });
    }
  });

  const registryLinks = Array.isArray(data.registryLinks) ? data.registryLinks : [];
  registryLinks.forEach((entry, index) => {
    const value = asRecord(entry);
    if (typeof value.title === "string" && value.title.trim()) {
      entries.push({ path: `registryLinks.${index}.title`, text: value.title.trim() });
    }
  });

  const accommodations = Array.isArray(data.accommodations) ? data.accommodations : [];
  accommodations.forEach((entry, index) => {
    const value = asRecord(entry);
    if (typeof value.description === "string" && value.description.trim()) {
      entries.push({ path: `accommodations.${index}.description`, text: value.description.trim() });
    }
  });

  const rsvpSettings = normalizeRsvpSettings(data);
  const questions = rsvpSettings.customQuestions
    .filter((question) => question.label.trim().length > 0)
    .map((question) => ({
      id: question.id,
      label: question.label.trim(),
    }));

  const sourceHash = createHash("sha256")
    .update(stableStringify({ entries, questions }))
    .digest("hex");

  return { entries, questions, sourceHash };
};

const trimQuestionTranslations = (
  rsvpSettings: NormalizedRsvpSettings,
  enabledLanguages: string[]
) => {
  const secondaryLanguages = new Set(enabledLanguages.filter((language) => language !== DEFAULT_LANGUAGE));

  return {
    ...rsvpSettings,
    customQuestions: rsvpSettings.customQuestions.map((question) => ({
      ...question,
      translations: question.translations
        ? Object.fromEntries(
            Object.entries(question.translations).filter(([language, value]) =>
              secondaryLanguages.has(language) && value.trim().length > 0
            )
          )
        : undefined,
    })),
  };
};

const pruneLocalizationState = (
  localization: LocalizationSettings
): LocalizationSettings => {
  const enabledSecondaryLanguages = new Set(
    localization.enabledLanguages.filter((language) => language !== localization.defaultLanguage)
  );

  return {
    ...localization,
    translations: Object.fromEntries(
      Object.entries(localization.translations).filter(([language]) => enabledSecondaryLanguages.has(language))
    ),
    translationMeta: Object.fromEntries(
      Object.entries(localization.translationMeta).filter(([language]) => enabledSecondaryLanguages.has(language))
    ),
  };
};

const buildStaleLocalizationState = (data: Record<string, unknown>): LocalizationSettings => {
  const localization = pruneLocalizationState(normalizeLocalizationSettings(data));
  const { entries, questions, sourceHash } = extractInviteTranslationSource(data);
  const timestamp = new Date().toISOString();
  const hasContent = entries.length > 0 || questions.length > 0;

  const translationMeta: Record<string, LocalizationTranslationMeta> = {};

  localization.enabledLanguages
    .filter((language) => language !== localization.defaultLanguage)
    .forEach((language) => {
      const existingMeta = localization.translationMeta[language];
      const existingTranslations = asRecord(localization.translations[language]);
      const hasExistingTranslations = Object.keys(existingTranslations).length > 0;
      const isCurrent = hasContent && existingMeta?.sourceHash === sourceHash && existingMeta.status === "up_to_date";

      translationMeta[language] = isCurrent
        ? {
            ...existingMeta,
            provider: TRANSLATION_PROVIDER,
            model: env.GEMINI_TRANSLATION_MODEL,
          }
        : {
            status: hasContent ? "stale" : "up_to_date",
            sourceHash,
            translatedAt: hasContent ? existingMeta?.translatedAt : timestamp,
            lastRequestedAt: timestamp,
            provider: TRANSLATION_PROVIDER,
            model: env.GEMINI_TRANSLATION_MODEL,
            ...(hasContent || hasExistingTranslations ? {} : { lastError: undefined }),
          };
    });

  return {
    ...localization,
    translationMeta,
  };
};

const setNestedValue = (target: Record<string, unknown>, path: string, value: string) => {
  const segments = path.split(".");
  let current: Record<string, unknown> | unknown[] = target;

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const nextSegment = segments[index + 1];
    const isArrayIndex = /^\d+$/.test(segment);

    if (Array.isArray(current)) {
      const currentIndex = Number(segment);
      if (isLast) {
        current[currentIndex] = value;
        return;
      }

      const shouldCreateArray = nextSegment !== undefined && /^\d+$/.test(nextSegment);
      const existing = current[currentIndex];
      if (!existing || typeof existing !== "object") {
        current[currentIndex] = shouldCreateArray ? [] : {};
      }
      current = current[currentIndex] as Record<string, unknown> | unknown[];
      return;
    }

    if (isLast) {
      current[segment] = value;
      return;
    }

    const shouldCreateArray = nextSegment !== undefined && /^\d+$/.test(nextSegment);
    const existing = current[segment];
    if (!existing || typeof existing !== "object") {
      current[segment] = shouldCreateArray ? [] : {};
    } else if (shouldCreateArray && !Array.isArray(existing)) {
      current[segment] = [];
    } else if (!shouldCreateArray && Array.isArray(existing)) {
      current[segment] = {};
    }

    current = current[segment] as Record<string, unknown> | unknown[];

    if (isArrayIndex) {
      return;
    }
  });
};

const buildInviteTranslationPatch = (entries: TranslationEntry[]) => {
  const patch: Record<string, unknown> = {};
  entries.forEach((entry) => {
    setNestedValue(patch, entry.path, entry.text);
  });
  return patch;
};

const buildTranslationPrompt = (
  language: string,
  entries: TranslationEntry[],
  questions: QuestionTranslationEntry[]
) => {
  const payload = {
    targetLanguageCode: language,
    targetLanguageLabel: languageLabels[language] ?? language,
    inviteEntries: entries,
    customQuestionLabels: questions,
  };

  return [
    "Translate invitation content for event guests.",
    "Return only valid JSON matching the response schema.",
    "Translate naturally and clearly for guests.",
    "Preserve names, venue addresses, dates, times, URLs, emails, invite slugs, booking codes, tokens, and brand names exactly.",
    "Do not add explanations, notes, or extra fields.",
    JSON.stringify(payload),
  ].join("\n\n");
};

const responseSchema = {
  type: "OBJECT",
  properties: {
    entries: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          path: { type: "STRING" },
          text: { type: "STRING" },
        },
        required: ["path", "text"],
      },
    },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
        },
        required: ["id", "label"],
      },
    },
  },
  required: ["entries", "questions"],
} as const;

const parseGeminiResponse = (response: unknown): GeminiTranslationResponse => {
  const payload = asRecord(response);
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const firstCandidate = candidates[0] ? asRecord(candidates[0]) : {};
  const content = asRecord(firstCandidate.content);
  const parts = Array.isArray(content.parts) ? content.parts : [];
  const text = parts
    .map((part) => {
      const value = asRecord(part);
      return typeof value.text === "string" ? value.text : "";
    })
    .join("");

  if (!text.trim()) {
    throw new Error("Gemini did not return translation content.");
  }

  const parsed = JSON.parse(text) as {
    entries?: Array<{ path?: string; text?: string }>;
    questions?: Array<{ id?: string; label?: string }>;
  };

  return {
    entries: Array.isArray(parsed.entries)
      ? parsed.entries
          .map((entry) => ({
            path: String(entry.path ?? "").trim(),
            text: String(entry.text ?? "").trim(),
          }))
          .filter((entry) => entry.path.length > 0 && entry.text.length > 0)
      : [],
    questions: Array.isArray(parsed.questions)
      ? parsed.questions
          .map((question) => ({
            id: String(question.id ?? "").trim(),
            label: String(question.label ?? "").trim(),
          }))
          .filter((question) => question.id.length > 0 && question.label.length > 0)
      : [],
  };
};

const translateWithGemini = async (
  language: string,
  entries: TranslationEntry[],
  questions: QuestionTranslationEntry[]
) => {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini translation is not configured.");
  }

  const response = await fetch(
    `${MODEL_ENDPOINT}/${env.GEMINI_TRANSLATION_MODEL}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildTranslationPrompt(language, entries, questions),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = asRecord(payload.error);
    throw new Error(
      typeof errorPayload.message === "string" && errorPayload.message.trim()
        ? errorPayload.message
        : "Gemini translation failed."
    );
  }

  return parseGeminiResponse(payload);
};

export const markInviteDataTranslationsStale = (data: Record<string, unknown>): Prisma.InputJsonValue =>
  setInviteLocalization(
    data as unknown as Prisma.JsonValue,
    buildStaleLocalizationState(data)
  );

export const refreshInviteTranslations = async (inviteId: string) => {
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      data: true,
    },
  });

  if (!invite) {
    return;
  }

  const data = asRecord(invite.data);
  const localization = buildStaleLocalizationState(data);
  const secondaryLanguages = localization.enabledLanguages.filter(
    (language) => language !== localization.defaultLanguage
  );

  const normalizedRsvpSettings = trimQuestionTranslations(
    normalizeRsvpSettings(data),
    localization.enabledLanguages
  );

  if (secondaryLanguages.length === 0) {
    const nextData = setInviteRsvpSettings(
      setInviteLocalization(invite.data, localization) as Prisma.JsonValue,
      normalizedRsvpSettings
    );

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        data: nextData,
      },
    });
    return;
  }

  const { entries, questions, sourceHash } = extractInviteTranslationSource(data);
  const timestamp = new Date().toISOString();
  const nextLocalization: LocalizationSettings = {
    ...localization,
    translations: { ...localization.translations },
    translationMeta: { ...localization.translationMeta },
  };
  let nextRsvpSettings = normalizedRsvpSettings;

  for (const language of secondaryLanguages) {
    try {
      const translated = entries.length > 0 || questions.length > 0
        ? await translateWithGemini(language, entries, questions)
        : { entries: [] as TranslationEntry[], questions: [] as QuestionTranslationEntry[] };

      nextLocalization.translations[language] = buildInviteTranslationPatch(translated.entries);
      nextLocalization.translationMeta[language] = {
        status: "up_to_date",
        sourceHash,
        translatedAt: timestamp,
        lastRequestedAt: timestamp,
        provider: TRANSLATION_PROVIDER,
        model: env.GEMINI_TRANSLATION_MODEL,
      };

      const translatedQuestions = new Map(translated.questions.map((question) => [question.id, question.label]));
      nextRsvpSettings = {
        ...nextRsvpSettings,
        customQuestions: nextRsvpSettings.customQuestions.map((question) => ({
          ...question,
          translations: translatedQuestions.has(question.id)
            ? {
                ...(question.translations ?? {}),
                [language]: translatedQuestions.get(question.id)!,
              }
            : question.translations,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gemini translation failed.";
      logger.error("Invite translation failed", { inviteId, language, message });
      nextLocalization.translationMeta[language] = {
        status: "failed",
        sourceHash,
        translatedAt: nextLocalization.translationMeta[language]?.translatedAt,
        lastRequestedAt: timestamp,
        lastError: message,
        provider: TRANSLATION_PROVIDER,
        model: env.GEMINI_TRANSLATION_MODEL,
      };
    }
  }

  const nextData = setInviteRsvpSettings(
    setInviteLocalization(invite.data, nextLocalization) as Prisma.JsonValue,
    nextRsvpSettings
  );

  await prisma.invite.update({
    where: { id: invite.id },
    data: {
      data: nextData,
    },
  });
};

export const scheduleInviteTranslationRefresh = (inviteId: string, delayMs = 1_500) => {
  const existing = refreshTimers.get(inviteId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    refreshTimers.delete(inviteId);
    void refreshInviteTranslations(inviteId).catch((error) => {
      logger.error("Scheduled invite translation refresh failed", {
        inviteId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, delayMs);

  refreshTimers.set(inviteId, timer);
};
