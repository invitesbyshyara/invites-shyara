import { NextFunction, Request, Response } from "express";
import { AdminRole } from "@prisma/client";
import { ADMIN_ACCESS_COOKIE } from "../lib/cookies";
import { prisma } from "../lib/prisma";
import { verifyAdminTokenValue } from "../lib/jwt";
import { isBlacklisted } from "../lib/tokenBlacklist";
import { sendError } from "../utils/http";

const restrictedForSupport = new Set([
  "manage_templates",
  "manage_pricing",
  "manage_promo_codes",
  "manage_settings",
  "suspend_customer",
  "delete_customer",
  "refund",
  "manual_unlock",
  "takedown_invite",
  "manage_categories",
  "send_announcement",
]);

export type PermissionAction =
  | "manage_templates"
  | "manage_pricing"
  | "manage_promo_codes"
  | "manage_settings"
  | "suspend_customer"
  | "delete_customer"
  | "refund"
  | "manual_unlock"
  | "takedown_invite"
  | "manage_categories"
  | "send_announcement";

export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[ADMIN_ACCESS_COOKIE] as string | undefined;
    if (!token) {
      return sendError(res, "Unauthorized", 401);
    }
    const payload = verifyAdminTokenValue(token);

    if (await isBlacklisted(payload.jti)) {
      return sendError(res, "Unauthorized", 401);
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: payload.adminId } });

    if (!admin) {
      return sendError(res, "Unauthorized", 401);
    }

    req.admin = admin;
    return next();
  } catch {
    return sendError(res, "Unauthorized", 401);
  }
};

export const requirePermission = (action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role: AdminRole | undefined = req.admin?.role;
    if (!role) {
      return sendError(res, "Unauthorized", 401);
    }

    if (role === "admin") {
      return next();
    }

    if (restrictedForSupport.has(action)) {
      return sendError(res, "Forbidden", 403);
    }

    return next();
  };
};
