import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "./env";

export type AccessTokenPayload = { userId: string };
export type AdminTokenPayload = { adminId: string; role: "admin" | "support"; jti: string };

const signWithExpiry = (payload: object, secret: string, expiresIn: string) =>
  jwt.sign(payload, secret, { expiresIn: expiresIn as SignOptions["expiresIn"] });

export const signAccessToken = (payload: AccessTokenPayload) =>
  signWithExpiry(payload, env.JWT_SECRET, env.JWT_EXPIRES_IN);

export const hashRefreshToken = (rawToken: string) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

export const generateRefreshToken = () => {
  const rawToken = crypto.randomBytes(40).toString("hex");
  return {
    rawToken,
    tokenHash: hashRefreshToken(rawToken),
  };
};

export const signAdminToken = (payload: Omit<AdminTokenPayload, "jti">) =>
  signWithExpiry({ ...payload, jti: crypto.randomUUID() }, env.ADMIN_JWT_SECRET, env.ADMIN_JWT_EXPIRES_IN);

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
export const verifyAdminTokenValue = (token: string) => jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
