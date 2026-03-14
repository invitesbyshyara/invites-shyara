import winston from "winston";
import { env } from "./env";

const REDACTED_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "passwordhash",
  "otp",
  "otpHash",
  "token",
  "refreshtoken",
  "accesstoken",
  "csrf",
  "email",
  "paymentid",
  "signature",
  "secret",
];

const shouldRedact = (key: string) => {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return REDACTED_KEYS.some((candidate) => normalized.includes(candidate));
};

const serializeError = (error: Error) => ({
  name: error.name,
  message: error.message,
  ...(env.NODE_ENV !== "production" && error.stack ? { stack: error.stack } : {}),
});

const redactValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      shouldRedact(key) ? "[REDACTED]" : redactValue(entry),
    ]),
  );
};

const redactFormat = winston.format((info) => redactValue(info) as winston.Logform.TransformableInfo);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format:
      env.NODE_ENV === "production"
        ? winston.format.combine(
            redactFormat(),
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            redactFormat(),
            winston.format.timestamp(),
            winston.format.printf((info) => {
              const { timestamp, level, message, ...rest } = info;
              const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
              return `${timestamp} ${level}: ${message}${meta}`;
            }),
          ),
  }),
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transports,
});
