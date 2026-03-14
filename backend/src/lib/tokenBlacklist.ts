import { getDistributedValue, setDistributedValue } from "./distributedStore";

const ADMIN_TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours — matches ADMIN_JWT_EXPIRES_IN

export async function blacklistToken(jti: string): Promise<void> {
  await setDistributedValue(`blacklist:jti:${jti}`, "1", { exSeconds: ADMIN_TOKEN_TTL_SECONDS });
}

export async function isBlacklisted(jti: string): Promise<boolean> {
  const value = await getDistributedValue(`blacklist:jti:${jti}`);
  return value !== null;
}
