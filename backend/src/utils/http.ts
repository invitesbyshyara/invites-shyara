import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
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
): Response =>
  res.status(statusCode).json({
    success: false,
    error,
    ...(details ? { details } : {}),
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
