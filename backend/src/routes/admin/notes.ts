import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  validate({
    query: z.object({
      entityId: z.string().min(1),
      entityType: z.enum(["customer", "invite"]),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { entityId, entityType } = req.query as { entityId: string; entityType: "customer" | "invite" };

    const notes = await prisma.adminNote.findMany({
      where: {
        entityId,
        entityType,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, notes);
  }),
);

const createNoteSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(["customer", "invite"]),
  note: z.string().min(2).max(2000),
});

router.post(
  "/",
  validate({ body: createNoteSchema }),
  asyncHandler(async (req, res) => {
    const note = await prisma.adminNote.create({
      data: {
        entityId: req.body.entityId,
        entityType: req.body.entityType,
        note: req.body.note,
        createdById: req.admin!.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, note, undefined, 201);
  }),
);

export default router;
