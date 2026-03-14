import assert from "node:assert/strict";
import test from "node:test";
import { detectUploadedImageType, validateUploadedImage } from "./upload";

const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
const webpBuffer = Buffer.from([
  0x52, 0x49, 0x46, 0x46,
  0x2a, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20,
]);

test("detectUploadedImageType recognizes supported image signatures", () => {
  assert.deepEqual(detectUploadedImageType(pngBuffer), {
    extension: "png",
    mimeType: "image/png",
  });
  assert.deepEqual(detectUploadedImageType(jpegBuffer), {
    extension: "jpg",
    mimeType: "image/jpeg",
  });
  assert.deepEqual(detectUploadedImageType(webpBuffer), {
    extension: "webp",
    mimeType: "image/webp",
  });
});

test("validateUploadedImage rejects mismatched mime types", () => {
  assert.throws(
    () =>
      validateUploadedImage({
        buffer: pngBuffer,
        size: pngBuffer.length,
        mimetype: "image/jpeg",
      } as Express.Multer.File),
    /does not match file contents/,
  );
});

test("validateUploadedImage rejects unsupported file contents", () => {
  assert.throws(
    () =>
      validateUploadedImage({
        buffer: Buffer.from("not-an-image"),
        size: 12,
        mimetype: "image/png",
      } as Express.Multer.File),
    /Invalid file contents/,
  );
});
