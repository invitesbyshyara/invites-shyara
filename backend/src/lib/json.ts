import { AppError } from "../utils/http";
import { sanitizePlainText } from "./sanitize";

export type SanitizedJsonValue =
  | string
  | number
  | boolean
  | null
  | SanitizedJsonValue[]
  | { [key: string]: SanitizedJsonValue };

type JsonSanitizeOptions = {
  maxDepth?: number;
  maxNodes?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
  maxKeyLength?: number;
  maxStringLength?: number;
};

const DEFAULT_OPTIONS: Required<JsonSanitizeOptions> = {
  maxDepth: 10,
  maxNodes: 5_000,
  maxArrayLength: 100,
  maxObjectKeys: 200,
  maxKeyLength: 120,
  maxStringLength: 5_000,
};

const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const sanitizeJsonValue = (
  value: unknown,
  options: Required<JsonSanitizeOptions>,
  depth: number,
  state: { nodes: number }
): SanitizedJsonValue => {
  if (depth > options.maxDepth) {
    throw new AppError(`JSON payload exceeds maximum depth of ${options.maxDepth}`, 400);
  }

  state.nodes += 1;
  if (state.nodes > options.maxNodes) {
    throw new AppError("JSON payload is too large", 400);
  }

  if (value === null || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new AppError("JSON payload contains a non-finite number", 400);
    }
    return value;
  }

  if (typeof value === "string") {
    return sanitizePlainText(value, { maxLength: options.maxStringLength, trim: false });
  }

  if (Array.isArray(value)) {
    if (value.length > options.maxArrayLength) {
      throw new AppError(`JSON arrays may not contain more than ${options.maxArrayLength} items`, 400);
    }

    return value.map((entry) => sanitizeJsonValue(entry, options, depth + 1, state));
  }

  if (!isPlainObject(value)) {
    throw new AppError("JSON payload must contain only plain objects, arrays, strings, numbers, booleans, or null", 400);
  }

  const entries = Object.entries(value);
  if (entries.length > options.maxObjectKeys) {
    throw new AppError(`JSON objects may not contain more than ${options.maxObjectKeys} keys`, 400);
  }

  const result: Record<string, SanitizedJsonValue> = {};
  entries.forEach(([key, entry]) => {
    if (RESERVED_KEYS.has(key)) {
      throw new AppError(`JSON payload contains a reserved key: ${key}`, 400);
    }
    if (key.length > options.maxKeyLength) {
      throw new AppError(`JSON key exceeds maximum length of ${options.maxKeyLength}`, 400);
    }
    result[key] = sanitizeJsonValue(entry, options, depth + 1, state);
  });

  return result;
};

export const sanitizeJsonRecord = (
  value: unknown,
  options: JsonSanitizeOptions = {}
): Record<string, SanitizedJsonValue> => {
  if (!isPlainObject(value)) {
    throw new AppError("JSON payload must be a plain object", 400);
  }

  return sanitizeJsonValue(value, { ...DEFAULT_OPTIONS, ...options }, 0, { nodes: 0 }) as Record<
    string,
    SanitizedJsonValue
  >;
};
