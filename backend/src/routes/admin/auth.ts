import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ADMIN_ACCESS_COOKIE, clearAdminSessionCookies, setAdminSessionCookies } from "../../lib/cookies";
import { prisma } from "../../lib/prisma";
import { signAdminToken, verifyAdminTokenValue } from "../../lib/jwt";
import { sanitizeEmail } from "../../lib/sanitize";
import { blacklistToken } from "../../lib/tokenBlacklist";
import { verifyAdminToken } from "../../middleware/adminAuth";
import { requireAdminCsrf } from "../../middleware/csrf";
import { validate } from "../../middleware/validate";
import {
  consumeMfaLoginChallenge,
  ensureMfaFactor,
  getRequestIp,
  getUserAgent,
  getVerifiedMfaFactorForAdmin,
  issueMfaLoginChallenge,
  recordSecurityEvent,
  replaceRecoveryCodes,
  resolveMfaLoginChallenge,
  verifyMfaSubmission,
} from "../../services/security";
import { AppError, asyncHandler, sendSuccess } from "../../utils/http";

const router = Router();

const adminProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
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
} satisfies Prisma.AdminUserSelect;

const mapAdmin = (admin: Prisma.AdminUserGetPayload<{ select: typeof adminProfileSelect }>) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  createdAt: admin.createdAt,
  lastLoginAt: admin.lastLoginAt,
  mfaEnabled: Boolean(admin.mfaFactor?.verifiedAt),
  recoveryCodesRemaining: admin.mfaFactor?.recoveryCodes.length ?? 0,
});

const loadAdminProfile = async (adminId: string) =>
  prisma.adminUser.findUniqueOrThrow({
    where: { id: adminId },
    select: adminProfileSelect,
  });

const issueAdminSession = async (res: Parameters<typeof sendSuccess>[0], adminId: string, role: "admin" | "support") => {
  const token = signAdminToken({ adminId, role });
  setAdminSessionCookies(res, token);
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const adminMfaSubmissionSchema = z
  .object({
    code: z.string().trim().min(6).max(8).optional(),
    recoveryCode: z.string().trim().min(9).max(32).optional(),
  })
  .refine((value) => Boolean(value.code || value.recoveryCode), {
    message: "Provide an MFA code or a recovery code.",
    path: ["code"],
  });

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const password = req.body.password;
    const requestIp = getRequestIp(req);
    const userAgent = getUserAgent(req);

    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        lastLoginAt: true,
        createdAt: true,
        mfaFactor: {
          select: {
            id: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!admin) {
      await recordSecurityEvent({
        eventType: "admin_login",
        outcome: "failed",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
        details: { email, reason: "admin_not_found" },
      });
      throw new AppError("Invalid credentials", 401, { code: "INVALID_CREDENTIALS" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      await recordSecurityEvent({
        adminId: admin.id,
        eventType: "admin_login",
        outcome: "failed",
        ipAddress: requestIp,
        userAgent,
        requestId: req.requestId,
        details: { reason: "invalid_password" },
      });
      throw new AppError("Invalid credentials", 401, { code: "INVALID_CREDENTIALS" });
    }

    const challengeId = await issueMfaLoginChallenge({ adminId: admin.id }, requestIp);
    const requiresMfaSetup = !admin.mfaFactor?.verifiedAt;

    await recordSecurityEvent({
      adminId: admin.id,
      eventType: "admin_login_password_verified",
      outcome: requiresMfaSetup ? "setup_required" : "challenge_issued",
      ipAddress: requestIp,
      userAgent,
      requestId: req.requestId,
    });

    return sendSuccess(res, {
      requiresMfa: !requiresMfaSetup,
      requiresMfaSetup,
      challengeId,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  }),
);

router.post(
  "/logout",
  verifyAdminToken,
  requireAdminCsrf,
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[ADMIN_ACCESS_COOKIE] as string | undefined;
    if (!token) {
      throw new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }
    const payload = verifyAdminTokenValue(token);
    await blacklistToken(payload.jti);
    clearAdminSessionCookies(res);

    return sendSuccess(res, { message: "Logged out" });
  }),
);

router.get(
  "/me",
  verifyAdminToken,
  asyncHandler(async (req, res) => {
    const admin = await loadAdminProfile(req.admin!.id);
    return sendSuccess(res, mapAdmin(admin));
  }),
);

router.get(
  "/mfa/status",
  verifyAdminToken,
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForAdmin(req.admin!.id);
    return sendSuccess(res, {
      enabled: Boolean(factor),
      recoveryCodesRemaining: factor?.recoveryCodes.length ?? 0,
    });
  }),
);

const mfaEnrollSchema = z.object({
  challengeId: z.string().min(1),
});

router.post(
  "/mfa/enroll",
  validate({ body: mfaEnrollSchema }),
  asyncHandler(async (req, res) => {
    const challenge = await resolveMfaLoginChallenge(req.body.challengeId);
    if (!challenge.adminId) {
      throw new AppError("Invalid MFA challenge", 400, { code: "INVALID_MFA_CHALLENGE" });
    }

    const admin = await prisma.adminUser.findUniqueOrThrow({
      where: { id: challenge.adminId },
      select: { id: true, email: true },
    });
    const { factor, otpauth, qrCodeDataUrl } = await ensureMfaFactor({
      kind: "admin",
      id: admin.id,
      email: admin.email,
    });

    return sendSuccess(res, {
      secret: factor.secret,
      otpauthUrl: otpauth,
      qrCodeDataUrl,
    });
  }),
);

const verifyEnrollmentSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

router.post(
  "/mfa/verify",
  validate({ body: verifyEnrollmentSchema }),
  asyncHandler(async (req, res) => {
    const challenge = await resolveMfaLoginChallenge(req.body.challengeId);
    if (!challenge.adminId) {
      throw new AppError("Invalid MFA challenge", 400, { code: "INVALID_MFA_CHALLENGE" });
    }

    const factor = await prisma.mfaFactor.findUnique({
      where: { adminId: challenge.adminId },
    });

    if (!factor) {
      throw new AppError("Start MFA enrollment first", 400, { code: "MFA_ENROLLMENT_NOT_STARTED" });
    }

    await verifyMfaSubmission(factor.id, factor.secret, { code: req.body.code });
    await Promise.all([
      prisma.mfaFactor.update({
        where: { id: factor.id },
        data: { verifiedAt: factor.verifiedAt ?? new Date() },
      }),
      prisma.adminUser.update({
        where: { id: challenge.adminId },
        data: { lastLoginAt: new Date() },
      }),
      consumeMfaLoginChallenge(challenge.id),
    ]);

    const recoveryCodes = await replaceRecoveryCodes(factor.id);
    const admin = await loadAdminProfile(challenge.adminId);
    await issueAdminSession(res, admin.id, admin.role);
    await recordSecurityEvent({
      adminId: admin.id,
      eventType: "admin_mfa_setup_complete",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, {
      admin: mapAdmin(admin),
      recoveryCodes,
    });
  }),
);

const completeLoginSchema = z
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
  validate({ body: completeLoginSchema }),
  asyncHandler(async (req, res) => {
    const challenge = await resolveMfaLoginChallenge(req.body.challengeId);
    if (!challenge.adminId) {
      throw new AppError("Invalid MFA challenge", 400, { code: "INVALID_MFA_CHALLENGE" });
    }

    const factor = await getVerifiedMfaFactorForAdmin(challenge.adminId);
    if (!factor) {
      throw new AppError("MFA setup is required before continuing", 403, {
        code: "MFA_SETUP_REQUIRED",
      });
    }

    await verifyMfaSubmission(factor.id, factor.secret, req.body);
    await Promise.all([
      consumeMfaLoginChallenge(challenge.id),
      prisma.adminUser.update({
        where: { id: challenge.adminId },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const admin = await loadAdminProfile(challenge.adminId);
    await issueAdminSession(res, admin.id, admin.role);
    await recordSecurityEvent({
      adminId: admin.id,
      eventType: "admin_mfa_login_complete",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, {
      admin: mapAdmin(admin),
    });
  }),
);

router.post(
  "/mfa/recovery-codes/rotate",
  verifyAdminToken,
  requireAdminCsrf,
  validate({ body: adminMfaSubmissionSchema }),
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForAdmin(req.admin!.id);
    if (!factor) {
      throw new AppError("MFA is not enabled", 400, { code: "MFA_NOT_ENABLED" });
    }

    await verifyMfaSubmission(factor.id, factor.secret, req.body);
    const recoveryCodes = await replaceRecoveryCodes(factor.id);
    await recordSecurityEvent({
      adminId: req.admin!.id,
      eventType: "admin_mfa_recovery_rotate",
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
  verifyAdminToken,
  requireAdminCsrf,
  validate({ body: adminMfaSubmissionSchema }),
  asyncHandler(async (req, res) => {
    const factor = await getVerifiedMfaFactorForAdmin(req.admin!.id);
    if (!factor) {
      throw new AppError("MFA is not enabled", 400, { code: "MFA_NOT_ENABLED" });
    }

    await verifyMfaSubmission(factor.id, factor.secret, req.body);
    await prisma.mfaFactor.delete({
      where: { id: factor.id },
    });

    await recordSecurityEvent({
      adminId: req.admin!.id,
      eventType: "admin_mfa_disable",
      outcome: "success",
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
      requestId: req.requestId,
    });

    return sendSuccess(res, { message: "MFA disabled" });
  }),
);

export default router;
