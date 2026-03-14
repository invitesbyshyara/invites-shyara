import { NextFunction, Request, Response } from "express";
import { env } from "../lib/env";

export type FieldError = {
  field: string;
  message: string;
};

type AppErrorOptions = {
  code?: string;
  details?: unknown;
  fields?: FieldError[];
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly fields?: FieldError[];

  constructor(message: string, statusCode = 400, options?: AppErrorOptions) {
    super(message);
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.fields = options?.fields;
  }
}

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const sendSuccess = (
  res: Response,
  data: unknown,
  pagination?: PaginationMeta,
  statusCode = 200,
): Response => {
  if (pagination) {
    return res.status(statusCode).json({ success: true, data, pagination });
  }
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400,
  details?: unknown,
  code?: string,
): Response =>
  res.status(statusCode).json({
    success: false,
    error,
    ...(code ? { code } : {}),
    ...(res.req.requestId ? { requestId: res.req.requestId } : {}),
    ...(Array.isArray(details) &&
    details.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        "field" in entry &&
        "message" in entry,
    )
      ? { fields: details }
      : {}),
    ...(details !== undefined &&
    (!Array.isArray(details) ||
      !details.every(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          "field" in entry &&
          "message" in entry,
      )) &&
    env.NODE_ENV !== "production"
      ? { details }
      : {}),
  });

export const parsePagination = (req: Request) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const createPagination = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const asyncHandler =
  <T extends Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
