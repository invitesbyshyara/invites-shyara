import { Router } from "express";
import { DiscountType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken, requirePermission("manage_promo_codes"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, promoCodes);
  }),
);

const promoSchema = z.object({
  code: z.string().min(2).max(50),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().int().min(1),
  isActive: z.boolean(),
  appliesTo: z.string().min(1),
  usageLimit: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

router.post(
  "/",
  validate({ body: promoSchema }),
  asyncHandler(async (req, res) => {
    const promo = await prisma.promoCode.create({
      data: {
        code: req.body.code.toUpperCase(),
        discountType: req.body.discountType,
        discountValue: req.body.discountValue,
        isActive: req.body.isActive,
        appliesTo: req.body.appliesTo,
        usageLimit: req.body.usageLimit,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      },
    });

    return sendSuccess(res, promo, undefined, 201);
  }),
);

const updatePromoSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  appliesTo: z.string().min(1).optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

router.put(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }), body: updatePromoSchema }),
  asyncHandler(async (req, res) => {
    const promo = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.code !== undefined ? { code: req.body.code.toUpperCase() } : {}),
        ...(req.body.discountType !== undefined ? { discountType: req.body.discountType } : {}),
        ...(req.body.discountValue !== undefined ? { discountValue: req.body.discountValue } : {}),
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
        ...(req.body.appliesTo !== undefined ? { appliesTo: req.body.appliesTo } : {}),
        ...(req.body.usageLimit !== undefined ? { usageLimit: req.body.usageLimit } : {}),
        ...(req.body.expiresAt !== undefined
          ? { expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null }
          : {}),
      },
    });

    return sendSuccess(res, promo);
  }),
);

router.delete(
  "/:id",
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { message: "Promo code deleted" });
  }),
);

export default router;
