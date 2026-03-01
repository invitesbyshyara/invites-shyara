import { Router } from "express";
import { z } from "zod";
import { EventCategory } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { validate } from "../middleware/validate";
import { asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const querySchema = z.object({
  category: z
    .string()
    .optional()
    .transform((value) => (value ? value.replace(/-/g, "_") : undefined))
    .refine((value) => !value || Object.values(EventCategory).includes(value as EventCategory), {
      message: "Invalid category",
    }),
  sort: z.enum(["popular", "newest", "price_asc"]).optional(),
});

router.get(
  "/",
  validate({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const { category, sort } = req.query as unknown as {
      category?: EventCategory;
      sort?: "popular" | "newest" | "price_asc";
    };

    const templates = await prisma.template.findMany({
      where: {
        isVisible: true,
        ...(category ? { category } : {}),
      },
      orderBy:
        sort === "popular"
          ? { purchaseCount: "desc" }
          : sort === "price_asc"
            ? { priceUsd: "asc" }
            : { createdAt: "desc" },
    });

    return sendSuccess(res, templates);
  }),
);

router.get(
  "/:slug",
  validate({ params: z.object({ slug: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findFirst({
      where: {
        slug: req.params.slug,
        isVisible: true,
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    return sendSuccess(res, template);
  }),
);

export default router;
