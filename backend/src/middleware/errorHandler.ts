import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../lib/env";
import { logger } from "../lib/logger";
import { AppError, sendError } from "../utils/http";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error("Request error", { error: err });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
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
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(res, "Duplicate value violates unique constraint", 409, err.meta);
    }
    if (err.code === "P2025") {
      return sendError(res, "Resource not found", 404);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, "Invalid database input", 400);
  }

  // Razorpay SDK throws plain objects: { statusCode, error: { code, description } }
  if (err && typeof err === "object" && "statusCode" in err && "error" in err) {
    const rzErr = err as { statusCode: number; error: { description?: string } };
    const description = rzErr.error?.description ?? "Payment provider error";
    return sendError(res, description, 502);
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  const devDetails = (() => {
    if (env.NODE_ENV === "production") return undefined;
    if (err instanceof Error) return err.stack;
    try { return JSON.stringify(err); } catch { return String(err); }
  })();
  return sendError(res, message, 500, devDetails);
};
