import { Router } from "express";
import { z } from "zod";
import { logAudit } from "../../lib/audit";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

const updateSettingsSchema = z
  .object({
    currency: z.enum(["USD", "EUR"]).optional(),
    maintenance_mode: z.boolean().optional(),
    allow_google_auth: z.boolean().optional(),
    allow_email_auth: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one supported setting to update.",
  });

router.get(
  "/",
  requirePermission("manage_settings"),
  asyncHandler(async (_req, res) => {
    const rows = await prisma.setting.findMany();
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return sendSuccess(res, settings);
  }),
);

router.put(
  "/",
  requirePermission("manage_settings"),
  validate({ body: updateSettingsSchema }),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body as Record<string, string | boolean>);

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: {
            key,
            value: String(value),
          },
          update: {
            value: String(value),
          },
        }),
      ),
    );

    const rows = await prisma.setting.findMany();
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    await logAudit({
      adminId: req.admin!.id,
      action: "UPDATE_SETTINGS",
      entityType: "settings",
      entityId: "global",
      details: { updatedKeys: entries.map(([key]) => key) },
    });

    return sendSuccess(res, settings);
  }),
);

export default router;
