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
      adminId: z.string().min(1).optional(),
      entityType: z.string().min(1).optional(),
      entityId: z.string().min(1).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { adminId, entityType, entityId } = req.query as {
      adminId?: string;
      entityType?: string;
      entityId?: string;
    };
    const { page, limit, skip } = parsePagination(req);

    const where: Prisma.AuditLogWhereInput = {
      ...(adminId ? { adminId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
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

    return sendSuccess(res, logs, createPagination(page, limit, total));
  }),
);

export default router;
