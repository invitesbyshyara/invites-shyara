import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { AppError, sendError } from "../utils/http";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error("Request error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    actorUserId: req.user?.id,
    actorAdminId: req.admin?.id,
    error: err instanceof Error ? err : new Error(typeof err === "string" ? err : "Unknown error"),
  });

  if (err instanceof AppError) {
    return sendError(
      res,
      err.message,
      err.statusCode,
      err.fields ?? err.details,
      err.code,
    );
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      "Validation failed",
      400,
      err.errors.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      "VALIDATION_ERROR",
    );
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File exceeds the 5 MB upload limit", 413, undefined, "FILE_TOO_LARGE");
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendError(res, "Only one file can be uploaded at a time", 400, undefined, "INVALID_UPLOAD");
    }

    return sendError(res, "Invalid upload payload", 400, undefined, "INVALID_UPLOAD");
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "Duplicate value violates unique constraint", 409, undefined, "RESOURCE_CONFLICT");
    }
    if (err.code === "P2025") {
      return sendError(res, "Resource not found", 404, undefined, "RESOURCE_NOT_FOUND");
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, "Invalid database input", 400, undefined, "INVALID_DATABASE_INPUT");
  }

  // Razorpay SDK throws plain objects: { statusCode, error: { code, description } }
  if (err && typeof err === "object" && "statusCode" in err && "error" in err) {
    return sendError(res, "Payment provider error", 502, undefined, "UPSTREAM_PAYMENT_ERROR");
  }

  const message = env.NODE_ENV === "production" ? "Internal server error" : err instanceof Error ? err.message : "Internal server error";
  const devDetails = (() => {
    if (env.NODE_ENV === "production") return undefined;
    if (err instanceof Error) return err.stack;
    try { return JSON.stringify(err); } catch { return String(err); }
  })();
  return sendError(res, message, 500, devDetails, "INTERNAL_SERVER_ERROR");
};
