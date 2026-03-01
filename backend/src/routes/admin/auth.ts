import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { signAdminToken, verifyAdminTokenValue } from "../../lib/jwt";
import { blacklistToken } from "../../lib/tokenBlacklist";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { validate } from "../../middleware/validate";
import { AppError, asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      throw new AppError("Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new AppError("Invalid credentials", 401);
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAdminToken({ adminId: admin.id, role: admin.role });

    return sendSuccess(res, {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: new Date(),
      },
    });
  }),
);

router.post(
  "/logout",
  verifyAdminToken,
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.slice(7);
    const payload = verifyAdminTokenValue(token);
    blacklistToken(payload.jti);

    return sendSuccess(res, { message: "Logged out" });
  }),
);

router.get(
  "/me",
  verifyAdminToken,
  asyncHandler(async (req, res) => {
    const admin = req.admin!;
    return sendSuccess(res, {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    });
  }),
);

export default router;
