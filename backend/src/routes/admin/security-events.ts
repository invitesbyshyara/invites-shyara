import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, createPagination, parsePagination, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  requirePermission("manage_settings"),
  validate({
    query: z.object({
      userId: z.string().min(1).optional(),
      eventType: z.string().min(1).optional(),
      outcome: z.string().min(1).optional(),
      ipAddress: z.string().min(1).optional(),
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { userId, eventType, outcome, ipAddress, from, to } = req.query as {
      userId?: string;
      eventType?: string;
      outcome?: string;
      ipAddress?: string;
      from?: string;
      to?: string;
    };
    const { page, limit, skip } = parsePagination(req);

    const where: Prisma.SecurityEventWhereInput = {
      ...(userId ? { userId } : {}),
      ...(eventType ? { eventType } : {}),
      ...(outcome ? { outcome } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [total, events] = await Promise.all([
      prisma.securityEvent.count({ where }),
      prisma.securityEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return sendSuccess(res, events, createPagination(page, limit, total));
  }),
);

export default router;
