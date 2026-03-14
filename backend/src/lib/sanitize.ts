import DOMPurify from "isomorphic-dompurify";

type SanitizeTextOptions = {
  maxLength?: number;
  trim?: boolean;
};

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const sanitizePlainText = (value: unknown, options: SanitizeTextOptions = {}) => {
  const { maxLength, trim = true } = options;
  const input = String(value ?? "");
  const normalized = input.replace(/\r\n/g, "\n").replace(CONTROL_CHARACTERS, "");
  const sanitized = DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  const collapsed = trim ? sanitized.trim() : sanitized;
  return maxLength !== undefined ? collapsed.slice(0, maxLength) : collapsed;
};

export const sanitizeOptionalText = (value: unknown, options: SanitizeTextOptions = {}) => {
  const sanitized = sanitizePlainText(value, options);
  return sanitized.length > 0 ? sanitized : undefined;
};

export const sanitizeEmail = (value: string) =>
  sanitizePlainText(value, { maxLength: 320 }).toLowerCase();

export const sanitizeTextList = (value: unknown, maxItems: number, maxLength: number) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  value.forEach((entry) => {
    const candidate = sanitizePlainText(entry, { maxLength });
    if (!candidate) return;
    const key = candidate.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(candidate);
  });

  return result.slice(0, maxItems);
};
