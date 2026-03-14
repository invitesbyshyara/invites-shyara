import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  clearCustomerSessionCookies,
  CUSTOMER_REFRESH_COOKIE,
  CUSTOMER_REFRESH_TTL_MS,
  setCustomerSessionCookies,
} from "../lib/cookies";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../lib/jwt";
import { sanitizeEmail, sanitizeOptionalText, sanitizePlainText } from "../lib/sanitize";
import { verifyToken } from "../middleware/auth";
import { requireCustomerCsrf } from "../middleware/csrf";
import { validate } from "../middleware/validate";
import { assertCustomerAcquisitionOpen, CUSTOMER_ACQUISITION_LOCK_MESSAGE } from "../services/customerAcquisitionLock";
import { deleteDistributedKey, getDistributedValue, incrementDistributedCounter } from "../lib/distributedStore";
import {
  sendEmailVerificationEmail,
  sendPasswordResetOtpEmail,
  sendWelcomeEmail,
} from "../services/email";
import { activateCollaboratorInvitations } from "../services/inviteOps";
import {
  consumeEmailVerificationChallenge,
  consumeMfaLoginChallenge,
  ensureMfaFactor,
  getRequestIp,
  getUserAgent,
  getVerifiedMfaFactorForUser,
  issueEmailVerificationChallenge,
  issueMfaLoginChallenge,
  issuePasswordResetChallenge,
  recordSecurityEvent,
  replaceRecoveryCodes,
  resolveMfaLoginChallenge,
  verifyMfaSubmission,
  verifyPasswordResetChallenge,
} from "../services/security";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  plan: true,
  status: true,
  emailVerified: true,
  emailPreferences: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  mfaFactor: {
    select: {
      verifiedAt: true,
      recoveryCodes: {
        where: { usedAt: null },
        select: { id: true },
      },
    },
  },
} satisfies Prisma.UserSelect;

const issueSession = async (userId: string) => {
  const accessToken = signAccessToken({ userId });
  const { rawToken, tokenHash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + CUSTOMER_REFRESH_TTL_MS);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: rawToken };
};

const mapUser = (user: Prisma.UserGetPayload<{ select: typeof userProfileSelect }>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  plan: user.plan,
  status: user.status,
  emailVerified: user.emailVerified,
  emailPreferences: user.emailPreferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
  mfaEnabled: Boolean(user.mfaFactor?.verifiedAt),
  recoveryCodesRemaining: user.mfaFactor?.recoveryCodes.length ?? 0,
});

const loadUserProfile = async (userId: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: userProfileSelect,
  });

const issueCustomerSessionResponse = async (res: Parameters<typeof sendSuccess>[0], userId: string) => {
  const { accessToken, refreshToken } = await issueSession(userId);
  setCustomerSessionCookies(res, { accessToken, refreshToken });
};

const activateCollaborationsIfEligible = async (user: { id: string; email: string; name: string; emailVerified: boolean }) => {
  if (!user.emailVerified) {
    return;
  }

  await activateCollaboratorInvitations(user.email, user.id, user.name);
};

const sendVerificationEmail = async (user: { id: string; email: string }, requestedIp?: string) => {
  const token = await issueEmailVerificationChallenge(user, requestedIp);
  await sendEmailVerificationEmail(user.email, token);
};

const loginResponseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const strongPassword = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: strongPassword,
});

const customerMfaSubmissionSchema = z
  .object({
    code: z.string().trim().min(6).max(8).optional(),
    recoveryCode: z.string().trim().min(9).max(32).optional(),
  })
  .refine((value) => Boolean(value.code || value.recoveryCode), {
    message: "Provide an MFA code or a recovery code.",
    path: ["code"],
  });

const emailPreferencesSchema = z
  .object({
    rsvpNotifications: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict()
  .optional();

const sanitizeEmailPreferences = (value: z.infer<typeof emailPreferencesSchema>) => ({
  rsvpNotifications: value?.rsvpNotifications ?? true,
  weeklyDigest: value?.weeklyDigest ?? false,
  marketing: value?.marketing ?? true,
});

const requirePasswordFactorVerification = async (
  userId: string,
  submission?: z.infer<typeof customerMfaSubmissionSchema>,
) => {
  const factor = await getVerifiedMfaFactorForUser(userId);
  if (!factor) {
    return;
  }

  if (!submission) {
    throw new AppError("Multi-factor authentication confirmation is required", 403, {
      code: "MFA_REQUIRED",
    });
  }

  await verifyMfaSubmission(factor.id, factor.secret, submission);
};

router.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    assertCustomerAcquisitionOpen(CUSTOMER_ACQUISITION_LOCK_MESSAGE);

    const name = sanitizePlainText(req.body.name, { maxLength: 100 });
    const email = sanitizeEmail(req.body.email);
    const password = req.body.password;
    const requestIp = getRequestIp(req);
    const userAgent = getUserAgent(req);

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new AppError("Email already registered", 409, { code: "EMAIL_ALREADY_REGISTERED" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: userProfileSelect,
    });

    await issueCustomerSessionResponse(res, user.id);
    await Promise.all([
      sendWelcomeEmail(user.name, user.email),
      sendVerificationEmail(user, requestIp),
      recordSecurityEvent({
        userId: user.id,
        eventType: "customer_register",
        outcome: "success",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
      }),
    ]);

    return sendSuccess(res, { user: mapUser(user) }, undefined, 201);
  }),
);

router.post(
  "/login",
  validate({ body: loginResponseSchema }),
  asyncHandler(async (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const password = req.body.password;
    const requestIp = getRequestIp(req);
    const userAgent = getUserAgent(req);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        status: true,
        emailVerified: true,
        mfaFactor: {
          select: {
            id: true,
            verifiedAt: true,
          },
        },
      },
    });

    const LOCKOUT_KEY = `account_lock:${email}`;
    const LOCKOUT_MAX_ATTEMPTS = 5;
    const LOCKOUT_TTL_SECONDS = 15 * 60;

    // Check account lockout before any credential verification
    const lockoutAttempts = await getDistributedValue(LOCKOUT_KEY);
    if (lockoutAttempts !== null && Number(lockoutAttempts) >= LOCKOUT_MAX_ATTEMPTS) {
      await recordSecurityEvent({
        userId: user?.id,
        eventType: "customer_login",
        outcome: "blocked",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
        details: { email, reason: "account_locked" },
      });
      throw new AppError("Account temporarily locked. Try again in 15 minutes.", 423, { code: "ACCOUNT_LOCKED" });
    }

    if (!user?.passwordHash) {
      await recordSecurityEvent({
        eventType: "customer_login",
        outcome: "failed",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
        details: { email, reason: "missing_password_account" },
      });
      throw new AppError("Invalid credentials", 401, { code: "INVALID_CREDENTIALS" });
    }

    if (user.status !== "active") {
      await recordSecurityEvent({
        userId: user.id,
        eventType: "customer_login",
        outcome: "blocked",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
        details: { reason: "suspended" },
      });
      throw new AppError("Account suspended", 403, { code: "ACCOUNT_SUSPENDED" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await Promise.all([
        incrementDistributedCounter(LOCKOUT_KEY, LOCKOUT_TTL_SECONDS),
        recordSecurityEvent({
          userId: user.id,
          eventType: "customer_login",
          outcome: "failed",
          ipAddress: requestIp,
          userAgent,
          requestId: req.requestId,
          details: { reason: "invalid_password" },
        }),
      ]);
      throw new AppError("Invalid credentials", 401, { code: "INVALID_CREDENTIALS" });
    }

    // Successful credential check — clear lockout counter
    await deleteDistributedKey(LOCKOUT_KEY);

    if (user.mfaFactor?.verifiedAt) {
      const challengeId = await issueMfaLoginChallenge({ userId: user.id }, requestIp);
      await recordSecurityEvent({
        userId: user.id,
        eventType: "customer_login_mfa_challenge",
        outcome: "challenge_issued",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        requiresMfa: true,
        challengeId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          mfaEnabled: true,
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await issueCustomerSessionResponse(res, user.id);
    const profile = await loadUserProfile(user.id);
    await Promise.all([
      activateCollaborationsIfEligible(profile),
      recordSecurityEvent({
        userId: user.id,
        eventType: "customer_login",
        outcome: "success",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
      }),
    ]);

    return sendSuccess(res, { user: mapUser(profile) });
  }),
);

const googleSchema = z.object({
  accessToken: z.string().min(1),
});

router.post(
  "/google",
  validate({ body: googleSchema }),
  asyncHandler(async (req, res) => {
    const requestIp = getRequestIp(req);
    const userAgent = getUserAgent(req);
    const { accessToken: googleAccessToken } = req.body;

    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!userinfoRes.ok) {
      throw new AppError("Invalid Google token", 400, { code: "INVALID_GOOGLE_TOKEN" });
    }

    const payload = (await userinfoRes.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };

    if (!payload.sub || !payload.email) {
      throw new AppError("Invalid Google token", 400, { code: "INVALID_GOOGLE_TOKEN" });
    }

    const email = sanitizeEmail(payload.email);
    const googleVerified = payload.email_verified === true;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        googleId: true,
        avatarUrl: true,
        emailVerified: true,
        mfaFactor: {
          select: {
            id: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!user) {
      assertCustomerAcquisitionOpen(CUSTOMER_ACQUISITION_LOCK_MESSAGE);

      user = await prisma.user.create({
        data: {
          name: sanitizePlainText(payload.name ?? email.split("@")[0], { maxLength: 100 }),
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
          emailVerified: googleVerified,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          googleId: true,
          avatarUrl: true,
          emailVerified: true,
          mfaFactor: {
            select: {
              id: true,
              verifiedAt: true,
            },
          },
        },
      });

      await Promise.all([
        sendWelcomeEmail(user.name, user.email),
        recordSecurityEvent({
          userId: user.id,
          eventType: "customer_register_google",
          outcome: "success",
          ipAddress: requestIp,
          userAgent,
          requestId: req.requestId,
        }),
      ]);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? payload.sub,
          avatarUrl: payload.picture ?? user.avatarUrl,
          emailVerified: user.emailVerified || googleVerified,
          lastLoginAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          googleId: true,
          avatarUrl: true,
          emailVerified: true,
          mfaFactor: {
            select: {
              id: true,
              verifiedAt: true,
            },
          },
        },
      });
    }

    if (user.mfaFactor?.verifiedAt) {
      const challengeId = await issueMfaLoginChallenge({ userId: user.id }, requestIp);
      await recordSecurityEvent({
        userId: user.id,
        eventType: "customer_google_login_mfa_challenge",
        outcome: "challenge_issued",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        requiresMfa: true,
        challengeId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          mfaEnabled: true,
        },
      });
    }

    await issueCustomerSessionResponse(res, user.id);
    const profile = await loadUserProfile(user.id);
    await Promise.all([
      activateCollaborationsIfEligible(profile),
      recordSecurityEvent({
        userId: user.id,
        eventType: "customer_google_login",
        outcome: "success",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
      }),
    ]);

    return sendSuccess(res, { user: mapUser(profile) });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.[CUSTOMER_REFRESH_COOKIE] as string | undefined;
    if (!incomingRefreshToken) {
      throw new AppError("Refresh token missing", 401, { code: "REFRESH_TOKEN_MISSING" });
    }

    const incomingTokenHash = hashRefreshToken(incomingRefreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: incomingTokenHash },
      include: {
        user: true,
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { token: incomingTokenHash } }).catch(() => undefined);
      }
      throw new AppError("Refresh token expired", 401, { code: "REFRESH_TOKEN_EXPIRED" });
    }

    if (stored.user.status !== "active") {
      await prisma.refreshToken.delete({ where: { token: incomingTokenHash } }).catch(() => undefined);
      throw new AppError("Account suspended", 403, { code: "ACCOUNT_SUSPENDED" });
    }

    await prisma.refreshToken.delete({ where: { token: incomingTokenHash } });
    await issueCustomerSessionResponse(res, stored.userId);

    return sendSuccess(res, { ok: true });
  }),
);

router.post(
  "/logout",
  verifyToken,
  requireCustomerCsrf,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[CUSTOMER_REFRESH_COOKIE] as string | undefined;
    if (refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { token: tokenHash } });
    }

    clearCustomerSessionCookies(res);
    return sendSuccess(res, { message: "Logged out" });
  }),
);

router.get(
  "/me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await loadUserProfile(req.user!.id);
    return sendSuccess(res, mapUser(user));
  }),
);

const updateMeSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(6).max(20).optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    emailPreferences: emailPreferencesSchema,
  })
  .strict();

router.put(
  "/me",
  verifyToken,
  requireCustomerCsrf,
  validate({ body: updateMeSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(req.body.name !== undefined ? { name: sanitizePlainText(req.body.name, { maxLength: 100 }) } : {}),
        ...(req.body.phone !== undefined ? { phone: sanitizeOptionalText(req.body.phone, { maxLength: 20 }) } : {}),
        ...(req.body.avatarUrl !== undefined ? { avatarUrl: req.body.avatarUrl } : {}),
        ...(req.body.emailPreferences !== undefined
          ? { emailPreferences: sanitizeEmailPreferences(req.body.emailPreferences) }
          : {}),
      },
      select: userProfileSelect,
    });

    return sendSuccess(res, mapUser(updated));
  }),
);

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,
    mfaCode: z.string().trim().min(6).max(8).optional(),
    recoveryCode: z.string().trim().min(9).max(32).optional(),
  })
  .strict();

router.put(
  "/password",
  verifyToken,
  requireCustomerCsrf,
  validate({ body: updatePasswordSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;

    if (!user.passwordHash) {
      throw new AppError("Password login is not enabled for this account", 400, {
        code: "PASSWORD_LOGIN_DISABLED",
      });
    }

    const { currentPassword, newPassword, mfaCode, recoveryCode } = req.body;
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) {
      throw new AppError("Current password is incorrect", 400, {
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    await requirePasswordFactorVerification(user.id, {
      code: mfaCode,
      recoveryCode,
    });

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    await recordSecurityEvent({
      userId: user.id,
      eventType: "customer_password_change",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    clearCustomerSessionCookies(res);
    return sendSuccess(res, { message: "Password updated. Please sign in again." });
  }),
);

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post(
  "/forgot-password",
  validate({ body: forgotPasswordSchema }),
  asyncHandler(async (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const requestIp = getRequestIp(req);
    const userAgent = getUserAgent(req);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = await issuePasswordResetChallenge(user, requestIp);
      await Promise.all([
        sendPasswordResetOtpEmail(email, otp),
        recordSecurityEvent({
          userId: user.id,
          eventType: "customer_password_reset_request",
          outcome: "issued",
          ipAddress: requestIp,
          userAgent,
          requestId: req.requestId,
        }),
      ]);
    }

    return sendSuccess(res, { message: "If this email exists, an OTP has been sent." });
  }),
);

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: strongPassword,
});

router.post(
  "/reset-password",
  validate({ body: resetPasswordSchema }),
  asyncHandler(async (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const challenge = await verifyPasswordResetChallenge(email, req.body.otp);
    const passwordHash = await bcrypt.hash(req.body.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: challenge.user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.deleteMany({ where: { userId: challenge.user.id } }),
      prisma.passwordResetChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await recordSecurityEvent({
      userId: challenge.user.id,
      eventType: "customer_password_reset_complete",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { message: "Password reset successful" });
  }),
);

router.delete(
  "/me",
  verifyToken,
  requireCustomerCsrf,
  asyncHandler(async (req, res) => {
    const user = req.user!;

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      prisma.userTemplate.deleteMany({ where: { userId: user.id } }),
      prisma.transaction.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    clearCustomerSessionCookies(res);
    return sendSuccess(res, { message: "Account deleted" });
  }),
);

router.post(
  "/verify-email/request",
  verifyToken,
  requireCustomerCsrf,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    if (user.emailVerified) {
      return sendSuccess(res, { message: "Email already verified" });
    }

    await sendVerificationEmail(user, getRequestIp(req));
    await recordSecurityEvent({
      userId: user.id,
      eventType: "customer_email_verification_request",
      outcome: "issued",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { message: "Verification email sent" });
  }),
);

const verifyEmailConfirmSchema = z.object({
  token: z.string().min(1),
});

router.post(
  "/verify-email/confirm",
  validate({ body: verifyEmailConfirmSchema }),
  asyncHandler(async (req, res) => {
    const user = await consumeEmailVerificationChallenge(req.body.token);
    await activateCollaboratorInvitations(user.email, user.id, user.name);
    await recordSecurityEvent({
      userId: user.id,
      eventType: "customer_email_verification_complete",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { message: "Email verified" });
  }),
);

router.get(
  "/mfa/status",
  verifyToken,
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForUser(req.user!.id);
    return sendSuccess(res, {
      enabled: Boolean(factor),
      recoveryCodesRemaining: factor?.recoveryCodes.length ?? 0,
    });
  }),
);

router.post(
  "/mfa/enroll",
  verifyToken,
  requireCustomerCsrf,
  asyncHandler(async (req, res) => {
    const existing = await getVerifiedMfaFactorForUser(req.user!.id);
    if (existing) {
      throw new AppError("MFA is already enabled", 409, { code: "MFA_ALREADY_ENABLED" });
    }

    const { factor, otpauth, qrCodeDataUrl } = await ensureMfaFactor({
      kind: "user",
      id: req.user!.id,
      email: req.user!.email,
    });

    return sendSuccess(res, {
      secret: factor.secret,
      otpauthUrl: otpauth,
      qrCodeDataUrl,
    });
  }),
);

const verifyEnrollMfaSchema = z.object({
  code: z.string().trim().min(6).max(8),
});

router.post(
  "/mfa/verify",
  verifyToken,
  requireCustomerCsrf,
  validate({ body: verifyEnrollMfaSchema }),
  asyncHandler(async (req, res) => {
    const factor = await prisma.mfaFactor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!factor) {
      throw new AppError("Start MFA enrollment first", 400, { code: "MFA_ENROLLMENT_NOT_STARTED" });
    }

    const valid = await verifyMfaSubmission(factor.id, factor.secret, { code: req.body.code });
    if (!valid) {
      throw new AppError("Invalid MFA code", 400, { code: "INVALID_MFA_CODE" });
    }

    await prisma.mfaFactor.update({
      where: { id: factor.id },
      data: { verifiedAt: factor.verifiedAt ?? new Date() },
    });

    const recoveryCodes = await replaceRecoveryCodes(factor.id);
    await recordSecurityEvent({
      userId: req.user!.id,
      eventType: "customer_mfa_enable",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, {
      enabled: true,
      recoveryCodes,
    });
  }),
);

const completeLoginMfaSchema = z
  .object({
    challengeId: z.string().min(1),
    code: z.string().trim().min(6).max(8).optional(),
    recoveryCode: z.string().trim().min(9).max(32).optional(),
  })
  .refine((value) => Boolean(value.code || value.recoveryCode), {
    message: "Provide an MFA code or a recovery code.",
    path: ["code"],
  });

router.post(
  "/mfa/complete-login",
  validate({ body: completeLoginMfaSchema }),
  asyncHandler(async (req, res) => {
    const challenge = await resolveMfaLoginChallenge(req.body.challengeId);
    if (!challenge.userId) {
      throw new AppError("Invalid MFA challenge", 400, { code: "INVALID_MFA_CHALLENGE" });
    }

    const factor = await getVerifiedMfaFactorForUser(challenge.userId);
    if (!factor) {
      throw new AppError("MFA is not configured for this account", 400, {
        code: "MFA_NOT_CONFIGURED",
      });
    }

    await verifyMfaSubmission(factor.id, factor.secret, {
      code: req.body.code,
      recoveryCode: req.body.recoveryCode,
    });

    await Promise.all([
      consumeMfaLoginChallenge(challenge.id),
      prisma.user.update({
        where: { id: challenge.userId },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    await issueCustomerSessionResponse(res, challenge.userId);
    const profile = await loadUserProfile(challenge.userId);
    await Promise.all([
      activateCollaborationsIfEligible(profile),
      recordSecurityEvent({
        userId: challenge.userId,
        eventType: "customer_mfa_login_complete",
        outcome: "success",
        ipAddress: getRequestIp(req),
        userAgent: getUserAgent(req),
        requestId: req.requestId,
      }),
    ]);

    return sendSuccess(res, { user: mapUser(profile) });
  }),
);

router.post(
  "/mfa/recovery-codes/rotate",
  verifyToken,
  requireCustomerCsrf,
  validate({ body: customerMfaSubmissionSchema }),
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForUser(req.user!.id);
    if (!factor) {
      throw new AppError("MFA is not enabled", 400, { code: "MFA_NOT_ENABLED" });
    }

    await verifyMfaSubmission(factor.id, factor.secret, req.body);
    const recoveryCodes = await replaceRecoveryCodes(factor.id);
    await recordSecurityEvent({
      userId: req.user!.id,
      eventType: "customer_mfa_recovery_rotate",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { recoveryCodes });
  }),
);

router.post(
  "/mfa/disable",
  verifyToken,
  requireCustomerCsrf,
  validate({ body: customerMfaSubmissionSchema }),
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForUser(req.user!.id);
    if (!factor) {
      throw new AppError("MFA is not enabled", 400, { code: "MFA_NOT_ENABLED" });
    }

    await verifyMfaSubmission(factor.id, factor.secret, req.body);
    await prisma.mfaFactor.delete({
      where: { id: factor.id },
    });

    await recordSecurityEvent({
      userId: req.user!.id,
      eventType: "customer_mfa_disable",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { message: "MFA disabled" });
  }),
);

export default router;
