import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/uploads";

/**
 * Admin-only image/video upload (gated by proxy.ts). Written outside
 * `public/` — see `api/uploads/kits/[filename]/route.ts` for why — and
 * served back through that Route Handler.
 *
 * Caveat: this is local disk storage. It works for local dev and any
 * single-instance deploy with a persistent disk, but most serverless/
 * container platforms (including a default Railway service without an
 * attached Volume) wipe the filesystem on every redeploy. Attach a
 * persistent Volume mounted at this directory, or swap this for real
 * object storage (S3/R2/etc.), before relying on this in production.
 */
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const MAX_SIZE_BY_TYPE: Record<string, number> = {
  "image/jpeg": MAX_IMAGE_SIZE_BYTES,
  "image/png": MAX_IMAGE_SIZE_BYTES,
  "image/webp": MAX_IMAGE_SIZE_BYTES,
  "image/avif": MAX_IMAGE_SIZE_BYTES,
  "image/gif": MAX_IMAGE_SIZE_BYTES,
  "video/mp4": MAX_VIDEO_SIZE_BYTES,
  "video/webm": MAX_VIDEO_SIZE_BYTES,
  "video/quicktime": MAX_VIDEO_SIZE_BYTES,
};

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Липсва файл." }, { status: 400 });
  }

  const maxSize = MAX_SIZE_BY_TYPE[file.type];
  if (!maxSize) {
    return NextResponse.json(
      { error: "Разрешени са само изображения (JPEG, PNG, WEBP, AVIF, GIF) или видео (MP4, WEBM, MOV)." },
      { status: 400 },
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Файлът е твърде голям (макс. ${Math.round(maxSize / (1024 * 1024))}MB).` },
      { status: 400 },
    );
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const extension = EXTENSION_BY_TYPE[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  // turbopackIgnore: writing to a runtime upload directory, not a build input to trace/bundle.
  await writeFile(path.join(/* turbopackIgnore: true */ UPLOADS_DIR, filename), bytes);

  return NextResponse.json({ url: `/api/uploads/kits/${filename}` });
}
