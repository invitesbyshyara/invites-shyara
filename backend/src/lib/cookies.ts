import crypto from "crypto";
import type { Response } from "express";
import { env } from "./env";

export const CUSTOMER_ACCESS_COOKIE = "accessToken";
export const CUSTOMER_REFRESH_COOKIE = "refreshToken";
export const CUSTOMER_CSRF_COOKIE = "csrfToken";
export const ADMIN_ACCESS_COOKIE = "adminAccessToken";
export const ADMIN_CSRF_COOKIE = "adminCsrfToken";

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const parseDurationToMs = (value: string, fallback: number) => {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier =
    unit === "ms"
      ? 1
      : unit === "s"
        ? 1_000
        : unit === "m"
          ? 60_000
          : unit === "h"
            ? 3_600_000
            : 86_400_000;

  return amount * multiplier;
};

const getCookieRootDomain = () => {
  const candidates = [env.FRONTEND_URL, env.ADMIN_PORTAL_URL ?? env.FRONTEND_URL]
    .map((value) => {
      try {
        return new URL(value).hostname;
      } catch {
        return undefined;
      }
    })
    .filter((value): value is string => Boolean(value))
    .map((hostname) => hostname.toLowerCase())
    .filter((hostname) => !LOCALHOST_HOSTS.has(hostname) && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname));

  const roots = Array.from(
    new Set(
      candidates
        .map((hostname) => hostname.split("."))
        .filter((parts) => parts.length >= 2)
        .map((parts) => `.${parts.slice(-2).join(".")}`)
    )
  );

  if (roots.length !== 1) {
    return undefined;
  }

  return roots[0];
};

const cookieDomain = getCookieRootDomain();
const accessCookieAge = parseDurationToMs(env.JWT_EXPIRES_IN, 15 * 60 * 1000);
const refreshCookieAge = parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);
const adminAccessCookieAge = parseDurationToMs(env.ADMIN_JWT_EXPIRES_IN, 8 * 60 * 60 * 1000);

export const CUSTOMER_REFRESH_TTL_MS = refreshCookieAge;

const baseOptions = {
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  ...(cookieDomain ? { domain: cookieDomain } : {}),
};

const createCsrfToken = () => crypto.randomBytes(24).toString("hex");

export const setCustomerSessionCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) => {
  const csrfToken = createCsrfToken();

  res.cookie(CUSTOMER_ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions,
    httpOnly: true,
    maxAge: accessCookieAge,
    path: "/api",
  });
  res.cookie(CUSTOMER_REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions,
    httpOnly: true,
    maxAge: refreshCookieAge,
    path: "/api",
  });
  res.cookie(CUSTOMER_CSRF_COOKIE, csrfToken, {
    ...baseOptions,
    httpOnly: false,
    maxAge: refreshCookieAge,
    path: "/",
  });

  return csrfToken;
};

export const clearCustomerSessionCookies = (res: Response) => {
  res.clearCookie(CUSTOMER_ACCESS_COOKIE, {
    ...baseOptions,
    httpOnly: true,
    path: "/api",
  });
  res.clearCookie(CUSTOMER_REFRESH_COOKIE, {
    ...baseOptions,
    httpOnly: true,
    path: "/api",
  });
  res.clearCookie(CUSTOMER_CSRF_COOKIE, {
    ...baseOptions,
    httpOnly: false,
    path: "/",
  });
};

export const setAdminSessionCookies = (res: Response, accessToken: string) => {
  const csrfToken = createCsrfToken();

  res.cookie(ADMIN_ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    httpOnly: true,
    maxAge: adminAccessCookieAge,
    path: "/api",
  });
  res.cookie(ADMIN_CSRF_COOKIE, csrfToken, {
    ...baseOptions,
    httpOnly: false,
    maxAge: adminAccessCookieAge,
    path: "/",
  });

  return csrfToken;
};

export const clearAdminSessionCookies = (res: Response) => {
  res.clearCookie(ADMIN_ACCESS_COOKIE, {
    ...baseOptions,
    httpOnly: true,
    path: "/api",
  });
  res.clearCookie(ADMIN_CSRF_COOKIE, {
    ...baseOptions,
    httpOnly: false,
    path: "/",
  });
};
