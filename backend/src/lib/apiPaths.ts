import { env } from "./env";

export const LEGACY_API_PREFIX = "/api";
export const CANONICAL_API_PREFIX = "/api/v1";
export const API_PREFIXES = [CANONICAL_API_PREFIX, LEGACY_API_PREFIX] as const;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const normalizeRelativePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const joinApiPath = (prefix: string, path: string) => `${prefix}${normalizeRelativePath(path)}`;

export const getPublicApiBaseUrl = () => trimTrailingSlash(env.API_PUBLIC_URL ?? env.FRONTEND_URL);

export const buildCanonicalApiUrl = (path: string) => `${getPublicApiBaseUrl()}${joinApiPath(CANONICAL_API_PREFIX, path)}`;
