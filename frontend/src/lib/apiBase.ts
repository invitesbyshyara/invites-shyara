const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const normalizeApiOrigin = (value?: string) => {
  const trimmed = trimTrailingSlash(value ?? "http://localhost:3000");
  return trimmed.replace(/\/api(?:\/v1)?$/i, "");
};

export const buildCanonicalApiBase = (value?: string) => {
  const trimmed = trimTrailingSlash(value ?? "http://localhost:3000");

  if (/\/api\/v1$/i.test(trimmed)) {
    return trimmed;
  }

  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/v1`;
  }

  return `${trimmed}/api/v1`;
};
