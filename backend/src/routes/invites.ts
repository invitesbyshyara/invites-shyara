import { Router } from "express";
import { InviteStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { sanitizeJsonRecord } from "../lib/json";
import { prisma } from "../lib/prisma";
import { createAiWriteRateLimit } from "../middleware/aiRateLimit";
import { verifyToken } from "../middleware/auth";
import { upload, validateUploadedImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { requireVerifiedCustomer } from "../middleware/verifiedCustomer";
import { sendInvitePublishedEmail } from "../services/email";
import {
  collaboratorHasAnyPermission,
  COLLABORATOR_PERMISSIONS,
  getInviteAccess,
  normalizeInviteDataForPersistence,
} from "../services/inviteOps";
import {
  markInviteDataTranslationsStale,
  refreshInviteTranslations,
  scheduleInviteTranslationRefresh,
} from "../services/inviteTranslation";
import { validateSlugFormat, isInviteSlugAvailable } from "../services/slug";
import {
  getUserUploadFolder,
  normalizeUploadedImageBuffer,
  uploadBufferToCloudinary,
} from "../services/storage";
import { env } from "../lib/env";
import { AppError, asyncHandler, sendSuccess } from "../utils/http";

const router = Router();

const statusSchema = z.enum(["draft", "published", "expired"]);

const asDataRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const requireInviteAccess = async (
  userId: string,
  inviteId: string,
  permissions?: Array<"edit_content" | "manage_rsvps" | "send_reminders" | "view_reports" | "handle_guest_support">
) => {
  const access = await getInviteAccess(userId, inviteId);
  if (!access) {
    throw new AppError("Invite not found", 404);
  }

  if (!access.isOwner && permissions && !collaboratorHasAnyPermission(access.collaborator, permissions)) {
    throw new AppError("You do not have permission for this invite", 403);
  }

  return access;
};

router.get(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const invites = await prisma.invite.findMany({
      where: {
        OR: [
          { userId },
          {
            collaborators: {
              some: {
                userId,
                status: "active",
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { rsvps: true },
        },
        collaborators: {
          where: {
            userId,
            status: "active",
          },
          select: {
            roleLabel: true,
            permissions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const enriched = invites.map((invite) => ({
      ...invite,
      rsvpCount: invite._count.rsvps,
      accessRole: invite.userId === userId ? "owner" : invite.collaborators[0]?.roleLabel ?? "collaborator",
      permissions: invite.userId === userId ? [...COLLABORATOR_PERMISSIONS] : invite.collaborators[0]?.permissions ?? [],
    }));

    return sendSuccess(res, enriched);
  }),
);

const createInviteSchema = z.object({
  templateSlug: z.string().min(1),
  slug: z.string().min(3).max(60),
  data: z.unknown().default({}),
}).strict();

router.post(
  "/",
  verifyToken,
  requireVerifiedCustomer,
  createAiWriteRateLimit("invite-create"),
  validate({ body: createInviteSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const { templateSlug, slug, data } = req.body;

    if (!validateSlugFormat(slug)) {
      throw new AppError("Invalid slug format", 400);
    }

    const available = await isInviteSlugAvailable(slug);
    if (!available) {
      throw new AppError("Slug already taken", 409);
    }

    const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
    if (!template) {
      throw new AppError("Template not found", 404);
    }

    if (template.isPremium) {
      const purchase = await prisma.userTemplate.findUnique({
        where: {
          userId_templateSlug: {
            userId: user.id,
            templateSlug,
          },
        },
      });

      if (!purchase) {
        throw new AppError("Template not purchased", 403);
      }
    }

    const normalizedData = asDataRecord(normalizeInviteDataForPersistence(sanitizeJsonRecord(data)));
    const dataWithTranslationState = markInviteDataTranslationsStale(normalizedData) as Prisma.InputJsonValue;

    const invite = await prisma.invite.create({
      data: {
        userId: user.id,
        templateSlug,
        templateCategory: template.category,
        slug,
        data: dataWithTranslationState,
      },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    scheduleInviteTranslationRefresh(invite.id);

    return sendSuccess(
      res,
      {
        ...invite,
        rsvpCount: invite._count.rsvps,
      },
      undefined,
      201,
    );
  }),
);

router.get(
  "/check-slug",
  verifyToken,
  validate({
    query: z.object({
      slug: z.string().min(3).max(60),
      excludeId: z.string().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { slug, excludeId } = req.query as { slug: string; excludeId?: string };

    if (!validateSlugFormat(slug)) {
      throw new AppError("Invalid slug format", 400);
    }

    const available = await isInviteSlugAvailable(slug, excludeId);
    return sendSuccess(res, { available });
  }),
);

router.post(
  "/upload-image",
  verifyToken,
  requireVerifiedCustomer,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("File is required", 400);
    }

    const detectedImage = validateUploadedImage(req.file);
    let normalizedBuffer: Buffer;
    try {
      normalizedBuffer = await normalizeUploadedImageBuffer(req.file.buffer, detectedImage.extension);
    } catch {
      throw new AppError("Invalid image payload", 400, { code: "INVALID_IMAGE_PAYLOAD" });
    }

    const userId = req.user!.id;
    let uploaded: { url: string; publicId: string };

    try {
      uploaded = await uploadBufferToCloudinary(normalizedBuffer, getUserUploadFolder(userId));
    } catch {
      throw new AppError("Upload failed", 502);
    }

    return sendSuccess(res, uploaded, undefined, 201);
  }),
);

router.get(
  "/:id",
  verifyToken,
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const access = await requireInviteAccess(req.user!.id, req.params.id, ["edit_content"]);

    const invite = await prisma.invite.findFirst({
      where: { id: access.invite.id },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (!invite) {
      throw new AppError("Invite not found", 404);
    }

    return sendSuccess(res, {
      ...invite,
      rsvpCount: invite._count.rsvps,
      accessRole: access.isOwner ? "owner" : access.collaborator?.roleLabel ?? "collaborator",
      permissions: access.isOwner ? [...COLLABORATOR_PERMISSIONS] : access.collaborator?.permissions ?? [],
    });
  }),
);

router.get(
  "/:id/rsvps",
  verifyToken,
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const access = await requireInviteAccess(req.user!.id, req.params.id, [
      "manage_rsvps",
      "handle_guest_support",
      "view_reports",
      "edit_content",
    ]);

    const rsvps = await prisma.rsvp.findMany({
      where: { inviteId: access.invite.id },
      orderBy: { submittedAt: "desc" },
    });

    return sendSuccess(res, rsvps);
  }),
);

const updateInviteSchema = z.object({
  slug: z.string().min(3).max(60).optional(),
  data: z.unknown().optional(),
  status: statusSchema.optional(),
}).strict();

router.put(
  "/:id",
  verifyToken,
  requireVerifiedCustomer,
  createAiWriteRateLimit("invite-update", {
    when: (req) => req.body?.data !== undefined || req.body?.status === "published",
  }),
  validate({ params: z.object({ id: z.string().min(1) }), body: updateInviteSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { slug, data, status } = req.body as {
      slug?: string;
      data?: Prisma.JsonObject;
      status?: "draft" | "published" | "expired";
    };

    const access = await requireInviteAccess(req.user!.id, id, ["edit_content"]);
    const existing = access.invite;

    if (slug !== undefined) {
      if (!validateSlugFormat(slug)) {
        throw new AppError("Invalid slug format", 400);
      }

      if (slug !== existing.slug) {
        const available = await isInviteSlugAvailable(slug, id);
        if (!available) {
          throw new AppError("Slug already taken", 409);
        }
      }
    }

    if (status === "published") {
      const draftData = data ?? (existing.data as Prisma.JsonObject);
      if (!draftData || (typeof draftData === "object" && Object.keys(draftData).length === 0)) {
        throw new AppError("Invite data is required before publishing", 400);
      }
    }

    const normalizedData = data !== undefined
      ? asDataRecord(normalizeInviteDataForPersistence(sanitizeJsonRecord(data)))
      : undefined;
    const dataWithTranslationState = normalizedData
      ? (markInviteDataTranslationsStale(normalizedData) as Prisma.InputJsonValue)
      : undefined;

    const updated = await prisma.invite.update({
      where: { id },
      data: {
        ...(slug !== undefined ? { slug } : {}),
        ...(dataWithTranslationState !== undefined ? { data: dataWithTranslationState } : {}),
        ...(status !== undefined ? { status: status as InviteStatus } : {}),
      },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    });

    if (status === "published" && existing.status !== "published") {
      const inviteUrl = `${env.FRONTEND_URL}/i/${updated.slug}`;
      const owner = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { email: true },
      });
      if (owner?.email) {
        await sendInvitePublishedEmail(owner.email, inviteUrl);
      }

      await refreshInviteTranslations(updated.id);
    } else if (dataWithTranslationState !== undefined) {
      scheduleInviteTranslationRefresh(updated.id);
    }

    return sendSuccess(res, {
      ...updated,
      rsvpCount: updated._count.rsvps,
      accessRole: access.isOwner ? "owner" : access.collaborator?.roleLabel ?? "collaborator",
      permissions: access.isOwner ? [...COLLABORATOR_PERMISSIONS] : access.collaborator?.permissions ?? [],
    });
  }),
);

router.delete(
  "/:id",
  verifyToken,
  requireVerifiedCustomer,
  validate({ params: z.object({ id: z.string().min(1) }) }),
  asyncHandler(async (req, res) => {
    const invite = await prisma.invite.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      select: { id: true },
    });

    if (!invite) {
      throw new AppError("Invite not found", 404);
    }

    await prisma.invite.delete({ where: { id: invite.id } });

    return sendSuccess(res, { message: "Invite deleted" });
  }),
);

export default router;
