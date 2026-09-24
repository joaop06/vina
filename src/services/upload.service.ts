import "server-only";
import { AppError } from "@/src/foundation/http/errors";

const ALLOWED = new Set(["image/jpeg", "image/png"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const VIDEO_ALLOWED = new Set(["video/mp4", "video/webm"]);
const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export type UploadDomain = "produtos" | "banners" | "site";

export type PendingBinary = {
  bytes: Buffer;
  mime: string;
};

export type PreparedImage = {
  id: string;
  path: string;
  bytes: Buffer;
};

export function assertValidImageMime(mime: string): void {
  if (!ALLOWED.has(mime)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Tipo de imagem inválido (jpeg, png)",
      400,
    );
  }
}

export function assertValidImageSize(byteLength: number): void {
  if (byteLength > 10 * 1024 * 1024) {
    throw new AppError("VALIDATION_ERROR", "Imagem maior que 10 MB", 400);
  }
}

export function assertValidVideoMime(mime: string): void {
  if (!VIDEO_ALLOWED.has(mime)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Tipo de vídeo inválido (mp4, webm)",
      400,
    );
  }
}

export function assertValidVideoSize(byteLength: number): void {
  if (byteLength > MAX_VIDEO_BYTES) {
    throw new AppError("VALIDATION_ERROR", "Vídeo maior que 20 MB", 400);
  }
}

/** Validate + assign path for a hero video committed with site config. */
export function prepareVideoBinary(
  pending: PendingBinary,
  id = crypto.randomUUID(),
): PreparedImage {
  assertValidVideoMime(pending.mime);
  assertValidVideoSize(pending.bytes.byteLength);
  const ext = VIDEO_EXT[pending.mime] ?? "mp4";
  return {
    id,
    path: `videos/site/${id}.${ext}`,
    bytes: pending.bytes,
  };
}

/** Validate + assign path for an image that will be committed with the entity. */
export function prepareImageBinary(
  pending: PendingBinary,
  dominio: UploadDomain,
  id = crypto.randomUUID(),
): PreparedImage {
  assertValidImageMime(pending.mime);
  assertValidImageSize(pending.bytes.byteLength);
  const ext = EXT[pending.mime] ?? "jpg";
  return {
    id,
    path: `imagens/${dominio}/${id}.${ext}`,
    bytes: pending.bytes,
  };
}

/** @deprecated Prefer deferred upload via entity multipart save. */
export async function uploadImage(
  file: File,
  dominio: UploadDomain,
): Promise<{ id: string; path: string }> {
  const { writeBinary } = await import("@/src/foundation/data");
  const bytes = Buffer.from(await file.arrayBuffer());
  const prepared = prepareImageBinary(
    { bytes, mime: file.type },
    dominio,
  );
  await writeBinary(prepared.path, prepared.bytes, {
    message: `feat(data): upload image ${prepared.path}`,
  });
  return { id: prepared.id, path: prepared.path };
}
