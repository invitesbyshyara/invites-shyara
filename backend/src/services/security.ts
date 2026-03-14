import crypto from "crypto";
import bcrypt from "bcrypt";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { AppError } from "../utils/http";

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const MFA_LOGIN_CHALLENGE_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const RECOVERY_CODE_COUNT = 8;

authenticator.options = {
  window: 1,
  step: 30,
};

const OTP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const hashToken = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const createCode = (length: number) => {
  let output = "";
  while (output.length < length) {
    const index = crypto.randomInt(0, OTP_ALPHABET.length);
    output += OTP_ALPHABET[index];
  }
  return output;
};

export const getRequestIp = (req: Request) => req.ip || req.socket.remoteAddress || undefined;

export const getUserAgent = (req: Request) => {
  const userAgent = req.headers["user-agent"];
  return typeof userAgent === "string" ? userAgent.slice(0, 512) : undefined;
};

export const recordSecurityEvent = async (input: {
  userId?: string;
  adminId?: string;
  eventType: string;
  outcome: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  details?: Record<string, unknown>;
}) => {
  await prisma.securityEvent.create({
    data: {
      userId: input.userId,
      adminId: input.adminId,
      eventType: input.eventType,
      outcome: input.outcome,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      requestId: input.requestId,
      details: input.details as Prisma.InputJsonValue | undefined,
    },
  });
};

export const issuePasswordResetChallenge = async (user: { id: string; email: string }, requestedIp?: string) => {
  const otp = createCode(6);
  const otpHash = await bcrypt.hash(otp, 10);

  await prisma.$transaction([
    prisma.passwordResetChallenge.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    }),
    prisma.passwordResetChallenge.create({
      data: {
        userId: user.id,
        email: user.email,
        otpHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        requestedIp,
      },
    }),
  ]);

  return otp;
};

export const verifyPasswordResetChallenge = async (email: string, otp: string) => {
  const challenge = await prisma.passwordResetChallenge.findFirst({
    where: {
      email,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  });

  if (!challenge) {
    throw new AppError("Invalid OTP", 400, { code: "INVALID_OTP" });
  }

  if (challenge.expiresAt < new Date()) {
    throw new AppError("OTP expired", 400, { code: "OTP_EXPIRED" });
  }

  if (challenge.attemptCount >= PASSWORD_RESET_MAX_ATTEMPTS) {
    throw new AppError("OTP expired", 400, { code: "OTP_EXPIRED" });
  }

  const valid = await bcrypt.compare(otp.toUpperCase(), challenge.otpHash);
  if (!valid) {
    await prisma.passwordResetChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw new AppError("Invalid OTP", 400, { code: "INVALID_OTP" });
  }

  return challenge;
};

export const consumePasswordResetChallenge = async (challengeId: string) => {
  await prisma.passwordResetChallenge.update({
    where: { id: challengeId },
    data: { usedAt: new Date() },
  });
};

export const issueEmailVerificationChallenge = async (
  user: { id: string; email: string },
  requestedIp?: string,
) => {
  const rawToken = randomToken();
  const tokenHash = hashToken(rawToken);

  await prisma.$transaction([
    prisma.emailVerificationChallenge.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    }),
    prisma.emailVerificationChallenge.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        requestedIp,
      },
    }),
  ]);

  return rawToken;
};

export const consumeEmailVerificationChallenge = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const challenge = await prisma.emailVerificationChallenge.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) {
    throw new AppError("Verification link is invalid or expired", 400, {
      code: "INVALID_VERIFICATION_TOKEN",
    });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: challenge.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationChallenge.update({
      where: { id: challenge.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return challenge.user;
};

export const generateRecoveryCodes = () =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => `${createCode(4)}-${createCode(4)}`);

export const replaceRecoveryCodes = async (factorId: string) => {
  const codes = generateRecoveryCodes();
  const codeHashes = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));

  await prisma.$transaction([
    prisma.mfaRecoveryCode.deleteMany({
      where: { factorId },
    }),
    ...codeHashes.map((codeHash) =>
      prisma.mfaRecoveryCode.create({
        data: {
          factorId,
          codeHash,
        },
      }),
    ),
  ]);

  return codes;
};

const verifyRecoveryCode = async (factorId: string, recoveryCode: string) => {
  const codes = await prisma.mfaRecoveryCode.findMany({
    where: {
      factorId,
      usedAt: null,
    },
  });

  for (const code of codes) {
    const matches = await bcrypt.compare(recoveryCode.toUpperCase(), code.codeHash);
    if (matches) {
      await prisma.mfaRecoveryCode.update({
        where: { id: code.id },
        data: { usedAt: new Date() },
      });
      return true;
    }
  }

  return false;
};

type FactorOwner = { kind: "user"; id: string; email: string } | { kind: "admin"; id: string; email: string };

export const getFactorOwnerLabel = (owner: FactorOwner) =>
  `${env.NODE_ENV === "production" ? "Shyara" : "Shyara Dev"}:${owner.kind}:${owner.email}`;

export const ensureMfaFactor = async (owner: FactorOwner) => {
  const factor = await prisma.mfaFactor.upsert({
    where: owner.kind === "user" ? { userId: owner.id } : { adminId: owner.id },
    update: {
      secret: authenticator.generateSecret(),
      verifiedAt: null,
      lastUsedAt: null,
    },
    create: {
      secret: authenticator.generateSecret(),
      ...(owner.kind === "user" ? { userId: owner.id } : { adminId: owner.id }),
    },
  });

  const otpauth = authenticator.keyuri(owner.email, "Shyara", factor.secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });

  return {
    factor,
    otpauth,
    qrCodeDataUrl,
  };
};

export const issueMfaLoginChallenge = async (owner: { userId?: string; adminId?: string }, requestedIp?: string) => {
  const challenge = await prisma.mfaLoginChallenge.create({
    data: {
      userId: owner.userId,
      adminId: owner.adminId,
      requestedIp,
      expiresAt: new Date(Date.now() + MFA_LOGIN_CHALLENGE_TTL_MS),
    },
  });

  return challenge.id;
};

export const resolveMfaLoginChallenge = async (challengeId: string) => {
  const challenge = await prisma.mfaLoginChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    throw new AppError("MFA challenge expired", 401, { code: "MFA_CHALLENGE_EXPIRED" });
  }

  return challenge;
};

export const consumeMfaLoginChallenge = async (challengeId: string) => {
  await prisma.mfaLoginChallenge.update({
    where: { id: challengeId },
    data: { consumedAt: new Date() },
  });
};

export const verifyMfaSubmission = async (factorId: string, secret: string, input: { code?: string; recoveryCode?: string }) => {
  if (input.code) {
    const valid = authenticator.check(input.code, secret);
    if (valid) {
      await prisma.mfaFactor.update({
        where: { id: factorId },
        data: { lastUsedAt: new Date() },
      });
      return { method: "code" as const };
    }
  }

  if (input.recoveryCode) {
    const validRecovery = await verifyRecoveryCode(factorId, input.recoveryCode.toUpperCase());
    if (validRecovery) {
      await prisma.mfaFactor.update({
        where: { id: factorId },
        data: { lastUsedAt: new Date() },
      });
      return { method: "recovery_code" as const };
    }
  }

  throw new AppError("Invalid MFA code", 401, { code: "INVALID_MFA_CODE" });
};

export const getVerifiedMfaFactorForUser = async (userId: string) =>
  prisma.mfaFactor.findFirst({
    where: {
      userId,
      verifiedAt: {
        not: null,
      },
    },
    include: {
      recoveryCodes: {
        where: { usedAt: null },
      },
    },
  });

export const getVerifiedMfaFactorForAdmin = async (adminId: string) =>
  prisma.mfaFactor.findFirst({
    where: {
      adminId,
      verifiedAt: {
        not: null,
      },
    },
    include: {
      recoveryCodes: {
        where: { usedAt: null },
      },
    },
  });
