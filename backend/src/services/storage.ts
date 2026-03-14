import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { env } from "../lib/env";

const CLOUDINARY_ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;
const CLOUDINARY_UPLOAD_ROOT = "shyara/users";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const sanitizeCloudinarySegment = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

export const getUserUploadFolder = (userId: string) => {
  const safeUserId = sanitizeCloudinarySegment(userId);
  if (!safeUserId) {
    throw new Error("Invalid upload path");
  }

  return `${CLOUDINARY_UPLOAD_ROOT}/${safeUserId}`;
};

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: [...CLOUDINARY_ALLOWED_FORMATS],
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        discard_original_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });

export const deleteCloudinaryAsset = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};

export const normalizeUploadedImageBuffer = async (
  buffer: Buffer,
  format: "jpg" | "png" | "webp",
) => {
  const pipeline = sharp(buffer, {
    sequentialRead: true,
    limitInputPixels: 40_000_000,
  }).rotate();

  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image");
  }

  if (format === "png") {
    return pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
  }

  if (format === "webp") {
    return pipeline.webp({ quality: 90 }).toBuffer();
  }

  return pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
};
