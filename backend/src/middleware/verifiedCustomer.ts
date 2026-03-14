import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/http";

export const requireVerifiedCustomer = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, "Unauthorized", 401, undefined, "UNAUTHORIZED");
  }

  if (!req.user.emailVerified) {
    return sendError(
      res,
      "Verify your email before continuing",
      403,
      undefined,
      "EMAIL_VERIFICATION_REQUIRED",
    );
  }

  return next();
};
