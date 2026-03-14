import { logger } from "./logger";
import { env } from "./env";

type MemoryEntry = {
  value: string;
  expiresAt?: number;
};

const memoryStore = new Map<string, MemoryEntry>();

const isSharedStoreConfigured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
const isDevelopmentFallback = !isSharedStoreConfigured && env.NODE_ENV !== "production";

if (!isSharedStoreConfigured && env.NODE_ENV === "production") {
  throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.");
}

const cleanupMemoryKey = (key: string) => {
  const current = memoryStore.get(key);
  if (!current) {
    return undefined;
  }

  if (current.expiresAt && current.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return undefined;
  }

  return current;
};

const memoryGet = async (key: string) => cleanupMemoryKey(key)?.value ?? null;

const memorySet = async (key: string, value: string, options?: { exSeconds?: number; nx?: boolean }) => {
  const current = cleanupMemoryKey(key);
  if (options?.nx && current) {
    return null;
  }

  memoryStore.set(key, {
    value,
    ...(options?.exSeconds ? { expiresAt: Date.now() + options.exSeconds * 1_000 } : {}),
  });

  return "OK";
};

const memoryDel = async (key: string) => {
  memoryStore.delete(key);
  return 1;
};

const memoryIncr = async (key: string, exSeconds: number) => {
  const current = cleanupMemoryKey(key);
  const nextValue = current ? Number(current.value) + 1 : 1;
  memoryStore.set(key, {
    value: String(nextValue),
    expiresAt: current?.expiresAt ?? Date.now() + exSeconds * 1_000,
  });
  return nextValue;
};

const memoryTtl = async (key: string) => {
  const current = cleanupMemoryKey(key);
  if (!current) {
    return -2;
  }
  if (!current.expiresAt) {
    return -1;
  }
  return Math.max(0, Math.ceil((current.expiresAt - Date.now()) / 1_000));
};

const upstashCommand = async <T>(...parts: Array<string | number>) => {
  const response = await fetch(
    `${env.UPSTASH_REDIS_REST_URL}/${parts.map((part) => encodeURIComponent(String(part))).join("/")}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    }
  );

  const payload = (await response.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!response.ok || payload.error) {
    throw new Error(payload.error || "Upstash command failed");
  }

  return payload.result as T;
};

const withStore = async <T>(operation: string, fallback: () => Promise<T>, primary: () => Promise<T>) => {
  if (isDevelopmentFallback) {
    return fallback();
  }

  try {
    return await primary();
  } catch (error) {
    logger.error("Shared store operation failed", {
      operation,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

export const getDistributedValue = async (key: string) =>
  withStore("get", () => memoryGet(key), () => upstashCommand<string | null>("GET", key));

export const setDistributedValue = async (
  key: string,
  value: string,
  options?: { exSeconds?: number; nx?: boolean }
) =>
  withStore(
    "set",
    () => memorySet(key, value, options),
    () => {
      const command = ["SET", key, value] as Array<string | number>;
      if (options?.exSeconds) {
        command.push("EX", options.exSeconds);
      }
      if (options?.nx) {
        command.push("NX");
      }
      return upstashCommand<string | null>(...command);
    }
  );

export const deleteDistributedKey = async (key: string) =>
  withStore("del", () => memoryDel(key), () => upstashCommand<number>("DEL", key));

export const incrementDistributedCounter = async (key: string, exSeconds: number) =>
  withStore(
    "incr",
    () => memoryIncr(key, exSeconds),
    async () => {
      const nextValue = await upstashCommand<number>("INCR", key);
      if (nextValue === 1) {
        await upstashCommand<number>("EXPIRE", key, exSeconds);
      }
      return nextValue;
    }
  );

export const getDistributedTtl = async (key: string) =>
  withStore("ttl", () => memoryTtl(key), () => upstashCommand<number>("TTL", key));
