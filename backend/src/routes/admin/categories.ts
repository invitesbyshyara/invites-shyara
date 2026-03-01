import { Router } from "express";
import { EventCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { AppError, asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [categories, templateCounts] = await Promise.all([
      prisma.category.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.template.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map(templateCounts.map((row) => [row.category, row._count._all]));

    const data = categories.map((category) => ({
      ...category,
      templateCount: countMap.get(category.slug) ?? 0,
    }));

    return sendSuccess(res, data);
  }),
);

const createCategorySchema = z.object({
  slug: z
    .string()
    .transform((value) => value.replace(/-/g, "_"))
    .refine((value) => Object.values(EventCategory).includes(value as EventCategory), {
      message: "Invalid category slug",
    }),
  name: z.string().min(1).max(100),
  emoji: z.string().min(1).max(10),
  displayOrder: z.coerce.number().int().optional(),
  isVisible: z.boolean().optional(),
});

router.post(
  "/",
  requirePermission("manage_categories"),
  validate({ body: createCategorySchema }),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: {
        slug: req.body.slug,
        name: req.body.name,
        emoji: req.body.emoji,
        displayOrder: req.body.displayOrder ?? 0,
        isVisible: req.body.isVisible ?? true,
      },
    });

    return sendSuccess(res, category, undefined, 201);
  }),
);

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

router.put(
  "/reorder",
  requirePermission("manage_categories"),
  validate({ body: reorderSchema }),
  asyncHandler(async (req, res) => {
    const { orderedIds } = req.body as { orderedIds: string[] };

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: index + 1 },
        }),
      ),
    );

    const categories = await prisma.category.findMany({ orderBy: { displayOrder: "asc" } });
    return sendSuccess(res, categories);
  }),
);

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  emoji: z.string().min(1).max(10).optional(),
  displayOrder: z.coerce.number().int().optional(),
  isVisible: z.boolean().optional(),
});

router.put(
  "/:id",
  requirePermission("manage_categories"),
  validate({ params: z.object({ id: z.string().min(1) }), body: updateCategorySchema }),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.emoji !== undefined ? { emoji: req.body.emoji } : {}),
        ...(req.body.displayOrder !== undefined ? { displayOrder: req.body.displayOrder } : {}),
        ...(req.body.isVisible !== undefined ? { isVisible: req.body.isVisible } : {}),
      },
    });

    return sendSuccess(res, category);
  }),
);

router.delete(
  "/:id",
  requirePermission("manage_categories"),
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    const templateCount = await prisma.template.count({
      where: { category: category.slug },
    });

    if (templateCount > 0) {
      throw new AppError("Cannot delete category with existing templates", 409);
    }

    await prisma.category.delete({ where: { id: category.id } });

    return sendSuccess(res, { message: "Category deleted" });
  }),
);

export default router;
