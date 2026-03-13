import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../lib/jwt";
import { verifyToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { assertCustomerAcquisitionOpen, CUSTOMER_ACQUISITION_LOCK_MESSAGE } from "../services/customerAcquisitionLock";
import { sendPasswordResetOtpEmail, sendWelcomeEmail } from "../services/email";
import { activateCollaboratorInvitations } from "../services/inviteOps";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const REFRESH_COOKIE = "refreshToken";
const REFRESH_COOKIE_AGE = 7 * 24 * 60 * 60 * 1000;

const setRefreshCookie = (res: Parameters<typeof sendSuccess>[0], token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: REFRESH_COOKIE_AGE,
    path: "/",
  });
};

const clearRefreshCookie = (res: Parameters<typeof sendSuccess>[0]) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
};

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  plan: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}) => user;

const issueSession = async (userId: string) => {
  const accessToken = signAccessToken({ userId });
  const { rawToken, tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_AGE);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: rawToken };
};

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

router.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    assertCustomerAcquisitionOpen(CUSTOMER_ACQUISITION_LOCK_MESSAGE);

    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    const { accessToken, refreshToken } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken);
    await activateCollaboratorInvitations(user.email, user.id, user.name);
    await sendWelcomeEmail(user.name, user.email);

    return sendSuccess(res, { user: sanitizeUser(user), accessToken }, undefined, 201);
  }),
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid credentials", 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken);
    await activateCollaboratorInvitations(user.email, user.id, user.name);

    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return sendSuccess(res, { user: sanitizeUser(profile), accessToken });
  }),
);

const googleSchema = z.object({
  accessToken: z.string().min(1),
});

router.post(
  "/google",
  validate({ body: googleSchema }),
  asyncHandler(async (req, res) => {
    const { accessToken: googleAccessToken } = req.body;

    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!userinfoRes.ok) {
      throw new AppError("Invalid Google token", 400);
    }

    const payload = (await userinfoRes.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    };

    if (!payload.sub || !payload.email) {
      throw new AppError("Invalid Google token", 400);
    }

    const email = payload.email.toLowerCase();

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email }],
      },
    });

    if (!user) {
      assertCustomerAcquisitionOpen(CUSTOMER_ACQUISITION_LOCK_MESSAGE);

      user = await prisma.user.create({
        data: {
          name: payload.name ?? email.split("@")[0],
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? payload.sub,
          avatarUrl: payload.picture ?? user.avatarUrl,
          lastLoginAt: new Date(),
        },
      });
    }

    const { accessToken, refreshToken } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken);
    await activateCollaboratorInvitations(user.email, user.id, user.name);

    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return sendSuccess(res, { user: sanitizeUser(profile), accessToken });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!incomingRefreshToken) {
      throw new AppError("Refresh token missing", 401);
    }

    const incomingTokenHash = hashRefreshToken(incomingRefreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: incomingTokenHash },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { token: incomingTokenHash } }).catch(() => undefined);
      }
      throw new AppError("Refresh token expired", 401);
    }

    await prisma.refreshToken.delete({ where: { token: incomingTokenHash } });

    const newAccessToken = signAccessToken({ userId: stored.userId });
    const { rawToken, tokenHash } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE_AGE),
      },
    });

    setRefreshCookie(res, rawToken);

    return sendSuccess(res, { accessToken: newAccessToken });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
    }

    clearRefreshCookie(res);
    return sendSuccess(res, { message: "Logged out" });
  }),
);

router.get(
  "/me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user!;

    return sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    });
  }),
);

const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(6).max(20).optional(),
});

router.put(
  "/me",
  verifyToken,
  validate({ body: updateMeSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.phone !== undefined ? { phone: req.body.phone } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return sendSuccess(res, updated);
  }),
);

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.put(
  "/password",
  verifyToken,
  validate({ body: updatePasswordSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    if (!user.passwordHash) {
      throw new AppError("Password login is not enabled for this account", 400);
    }

    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) {
      throw new AppError("Current password is incorrect", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return sendSuccess(res, { message: "Password updated" });
  }),
);

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const otpKey = `otp_${email}`;
      const expiryKey = `otp_expiry_${email}`;

      await prisma.$transaction([
        prisma.setting.upsert({
          where: { key: otpKey },
          create: {
            key: otpKey,
            value: otpHash,
          },
          update: {
            value: otpHash,
          },
        }),
        prisma.setting.upsert({
          where: { key: expiryKey },
          create: {
            key: expiryKey,
            value: expiresAt,
          },
          update: {
            value: expiresAt,
          },
        }),
      ]);

      await sendPasswordResetOtpEmail(email, otp);
    }

    return sendSuccess(res, { message: "If this email exists, an OTP has been sent." });
  }),
);

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});

router.delete(
  "/me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = req.user!;

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      prisma.userTemplate.deleteMany({ where: { userId: user.id } }),
      prisma.transaction.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    clearRefreshCookie(res);
    return sendSuccess(res, { message: "Account deleted" });
  }),
);

router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const otpKey = `otp_${email}`;
    const expiryKey = `otp_expiry_${email}`;

    const [otpSetting, expirySetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: otpKey } }),
      prisma.setting.findUnique({ where: { key: expiryKey } }),
    ]);

    if (!otpSetting || !expirySetting) {
      throw new AppError("Invalid OTP", 400);
    }

    const submittedOtp = req.body.otp.toUpperCase();
    const validOtp = await bcrypt.compare(submittedOtp, otpSetting.value);
    if (!validOtp) {
      throw new AppError("Invalid OTP", 400);
    }

    const expiryDate = new Date(expirySetting.value);
    if (Number.isNaN(expiryDate.getTime())) {
      throw new AppError("Invalid OTP", 400);
    }
    if (expiryDate < new Date()) {
      throw new AppError("OTP expired", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid OTP", 400);
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.setting.deleteMany({
        where: {
          key: {
            in: [otpKey, expiryKey],
          },
        },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return sendSuccess(res, { message: "Password reset successful" });
  }),
);

export default router;




