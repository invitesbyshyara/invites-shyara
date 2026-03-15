import { Router } from "express";
import { EventCategory, PackageCode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { sanitizePlainText, sanitizeTextList } from "../../lib/sanitize";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { AppError, asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const templates = await prisma.template.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return sendSuccess(res, templates);
  }),
);

const createTemplateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z
    .string()
    .transform((value) => value.replace(/-/g, "_"))
    .refine((value) => Object.values(EventCategory).includes(value as EventCategory), {
      message: "Invalid category",
    }),
  packageCode: z.nativeEnum(PackageCode),
  tags: z.array(z.string()).default([]),
  isPremium: z.boolean(),
  price: z.coerce.number().int().min(0).optional(),
  priceUsd: z.coerce.number().int().min(0),
  priceEur: z.coerce.number().int().min(0),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
});

router.post(
  "/",
  requirePermission("manage_templates"),
  validate({ body: createTemplateSchema }),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.create({
      data: {
        slug: sanitizePlainText(req.body.slug, { maxLength: 80 }),
        name: sanitizePlainText(req.body.name, { maxLength: 120 }),
        category: req.body.category,
        packageCode: req.body.packageCode,
        tags: sanitizeTextList(req.body.tags, 10, 40),
        isPremium: req.body.isPremium,
        price: req.body.price ?? 0,
        priceUsd: req.body.priceUsd,
        priceEur: req.body.priceEur,
        isVisible: req.body.isVisible,
        isFeatured: req.body.isFeatured,
      },
    });

    return sendSuccess(res, template, undefined, 201);
  }),
);

router.get(
  "/:slug",
  validate({ params: z.object({ slug: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({
      where: { slug: req.params.slug },
    });

    if (!template) {
      throw new AppError("Template not found", 404);
    }

    return sendSuccess(res, template);
  }),
);

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  packageCode: z.nativeEnum(PackageCode).optional(),
  isPremium: z.boolean().optional(),
  price: z.coerce.number().int().min(0).optional(),
  priceUsd: z.coerce.number().int().min(0).optional(),
  priceEur: z.coerce.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

router.put(
  "/:slug",
  requirePermission("manage_templates"),
  validate({ params: z.object({ slug: z.string().min(1) }), body: updateTemplateSchema }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.template.update({
      where: { slug: req.params.slug },
      data: {
        ...(req.body.name !== undefined ? { name: sanitizePlainText(req.body.name, { maxLength: 120 }) } : {}),
        ...(req.body.packageCode !== undefined ? { packageCode: req.body.packageCode } : {}),
        ...(req.body.isPremium !== undefined ? { isPremium: req.body.isPremium } : {}),
        ...(req.body.price !== undefined ? { price: req.body.price } : {}),
        ...(req.body.priceUsd !== undefined ? { priceUsd: req.body.priceUsd } : {}),
        ...(req.body.priceEur !== undefined ? { priceEur: req.body.priceEur } : {}),
        ...(req.body.isVisible !== undefined ? { isVisible: req.body.isVisible } : {}),
        ...(req.body.isFeatured !== undefined ? { isFeatured: req.body.isFeatured } : {}),
        ...(req.body.sortOrder !== undefined ? { sortOrder: req.body.sortOrder } : {}),
      },
    });

    return sendSuccess(res, updated);
  }),
);

router.delete(
  "/:slug",
  requirePermission("manage_templates"),
  validate({ params: z.object({ slug: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({ where: { slug: req.params.slug } });

    if (!template) {
      throw new AppError("Template not found", 404);
    }

    if (template.purchaseCount > 0) {
      throw new AppError("Template cannot be deleted because it has purchases", 409);
    }

    await prisma.template.delete({ where: { slug: req.params.slug } });
    return sendSuccess(res, { message: "Template deleted" });
  }),
);

export default router;
