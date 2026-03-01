import { Router } from "express";
import { z } from "zod";
import { logAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { sendAnnouncementBulk } from "../../services/email";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const announcements = await prisma.announcement.findMany({
      orderBy: { sentAt: "desc" },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sendSuccess(res, announcements);
  }),
);

const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(150),
  content: z.string().min(2).max(10000),
  sentTo: z.enum(["all", "new_30d", "active_invites"]),
});

router.post(
  "/",
  requirePermission("send_announcement"),
  validate({ body: createAnnouncementSchema }),
  asyncHandler(async (req, res) => {
    const { title, content, sentTo } = req.body;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recipients = await prisma.user.findMany({
      where:
        sentTo === "all"
          ? {}
          : sentTo === "new_30d"
            ? { createdAt: { gte: thirtyDaysAgo } }
            : {
                invites: {
                  some: {
                    status: "published",
                  },
                },
              },
      select: { email: true },
    });

    if (recipients.length > 0) {
      await sendAnnouncementBulk(recipients, title, content);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        sentTo,
        sentByAdminId: req.admin!.id,
        recipientCount: recipients.length,
      },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAudit({
      adminId: req.admin!.id,
      action: "SEND_ANNOUNCEMENT",
      entityType: "announcement",
      entityId: announcement.id,
      details: { sentTo, recipientCount: recipients.length },
    });

    return sendSuccess(res, announcement, undefined, 201);
  }),
);

export default router;
