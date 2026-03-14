import { NextFunction, Request, Response } from "express";
import { ADMIN_CSRF_COOKIE, CUSTOMER_CSRF_COOKIE } from "../lib/cookies";
import { sendError } from "../utils/http";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const requireCsrfCookie =
  (cookieName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      return next();
    }

    const cookieToken = req.cookies?.[cookieName] as string | undefined;
    const headerToken = req.get("X-CSRF-Token");

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return sendError(res, "Invalid CSRF token", 403);
    }

    return next();
  };

export const requireCustomerCsrf = requireCsrfCookie(CUSTOMER_CSRF_COOKIE);
export const requireAdminCsrf = requireCsrfCookie(ADMIN_CSRF_COOKIE);
