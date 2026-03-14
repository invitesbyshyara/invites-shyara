import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/http";

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
type AllowedImageExtension = "jpg" | "png" | "webp";

export type DetectedImageType = {
  extension: AllowedImageExtension;
  mimeType: AllowedImageMimeType;
};

const allowedMimeTypes = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE_PREFIX = Buffer.from([0xff, 0xd8, 0xff]);
const WEBP_RIFF_SIGNATURE = Buffer.from("RIFF");
const WEBP_FORMAT_SIGNATURE = Buffer.from("WEBP");

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new AppError("Invalid file type. Allowed types: jpeg, png, webp", 400));
    return;
  }

  cb(null, true);
};

const isPng = (buffer: Buffer) => buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);

const isJpeg = (buffer: Buffer) =>
  buffer.length >= JPEG_SIGNATURE_PREFIX.length && buffer.subarray(0, JPEG_SIGNATURE_PREFIX.length).equals(JPEG_SIGNATURE_PREFIX);

const isWebp = (buffer: Buffer) =>
  buffer.length >= 12 &&
  buffer.subarray(0, 4).equals(WEBP_RIFF_SIGNATURE) &&
  buffer.subarray(8, 12).equals(WEBP_FORMAT_SIGNATURE);

export const detectUploadedImageType = (buffer: Buffer): DetectedImageType | null => {
  if (isJpeg(buffer)) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  if (isPng(buffer)) {
    return { extension: "png", mimeType: "image/png" };
  }

  if (isWebp(buffer)) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  return null;
};

export const validateUploadedImage = (file: Express.Multer.File) => {
  if (!file.buffer || file.buffer.length === 0 || file.size <= 0) {
    throw new AppError("File is required", 400);
  }

  const detectedType = detectUploadedImageType(file.buffer);
  if (!detectedType) {
    throw new AppError("Invalid file contents. Allowed types: jpeg, png, webp", 400);
  }

  if (file.mimetype !== detectedType.mimeType) {
    throw new AppError("File type does not match file contents", 400);
  }

  return detectedType;
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_UPLOAD_BYTES,
    files: 1,
  },
});
