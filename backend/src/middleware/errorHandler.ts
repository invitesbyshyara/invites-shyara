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

  const message = err instanceof Error ? err.message : "Internal server error";
  return sendError(
    res,
    message,
    500,
    env.NODE_ENV === "production" ? undefined : (err instanceof Error ? err.stack : String(err)),
  );
};
