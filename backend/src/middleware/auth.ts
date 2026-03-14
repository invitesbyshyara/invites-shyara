import { NextFunction, Request, Response } from "express";
import { CUSTOMER_ACCESS_COOKIE } from "../lib/cookies";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../lib/jwt";
import { sendError } from "../utils/http";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[CUSTOMER_ACCESS_COOKIE] as string | undefined;
    if (!token) {
      return sendError(res, "Unauthorized", 401);
    }
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (user.status !== "active") {
      return sendError(res, "Account suspended", 403);
    }

    req.user = user;
    return next();
  } catch {
    return sendError(res, "Unauthorized", 401);
  }
};
