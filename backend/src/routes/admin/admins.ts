import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { requirePermission, verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { AppError, asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();
router.use(verifyAdminToken);

const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "support"]),
});

router.post(
  "/",
  requirePermission("manage_settings"),
  validate({ body: createAdminSchema }),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    const created = await prisma.adminUser.create({
      data: {
        name: req.body.name,
        email: req.body.email.toLowerCase(),
        passwordHash,
        role: req.body.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return sendSuccess(res, created, undefined, 201);
  }),
);

router.get(
  "/",
  requirePermission("manage_settings"),
  asyncHandler(async (_req, res) => {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return sendSuccess(res, admins);
  }),
);

router.delete(
  "/:id",
  requirePermission("manage_settings"),
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const adminId = req.params.id;

    if (req.admin!.id === adminId) {
      throw new AppError("You cannot delete your own account", 400);
    }

    const target = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!target) {
      throw new AppError("Admin user not found", 404);
    }

    if (target.role === "admin") {
      const adminCount = await prisma.adminUser.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        throw new AppError("Cannot delete the last admin", 400);
      }
    }

    await prisma.adminUser.delete({
      where: { id: adminId },
    });

    return sendSuccess(res, { message: "Admin user deleted" });
  }),
);

export default router;
