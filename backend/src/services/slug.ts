import { prisma } from "../lib/prisma";

export const SLUG_REGEX = /^[a-z0-9-]+$/;

export const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const validateSlugFormat = (slug: string) =>
  SLUG_REGEX.test(slug) && slug.length >= 3 && slug.length <= 60;

export const isInviteSlugAvailable = async (slug: string, excludeId?: string) => {
  const invite = await prisma.invite.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return !invite;
};

export const generateUniqueSlug = async (base: string) => {
  const normalized = normalizeSlug(base);
  let candidate = normalized;
  let counter = 1;

  while (!(await isInviteSlugAvailable(candidate))) {
    candidate = `${normalized}-${counter++}`;
  }

  return candidate;
};
