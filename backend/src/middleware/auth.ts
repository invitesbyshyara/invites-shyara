import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../lib/jwt";
import { sendError } from "../utils/http";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized", 401);
    }

    const token = authHeader.slice(7);
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
