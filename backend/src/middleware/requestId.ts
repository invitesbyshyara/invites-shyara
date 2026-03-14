import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export const assignRequestId = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim().slice(0, 128)
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};
