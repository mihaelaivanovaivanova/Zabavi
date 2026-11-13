import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/uploads";

/**
 * Admin-only image upload (gated by proxy.ts). Written outside `public/` —
 * see `api/uploads/kits/[filename]/route.ts` for why — and served back
 * through that Route Handler.
 *
 * Caveat: this is local disk storage. It works for local dev and any
 * single-instance deploy with a persistent disk, but most serverless/
 * container platforms (including a default Railway service without an
 * attached Volume) wipe the filesystem on every redeploy. Attach a
 * persistent Volume mounted at this directory, or swap this for real
 * object storage (S3/R2/etc.), before relying on this in production.
 */
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Липсва файл." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Разрешени са само изображения (JPEG, PNG, WEBP, AVIF, GIF)." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Файлът е твърде голям (макс. 8MB)." }, { status: 400 });
  }

  await mkdir(UPLOADS_DIR, { recursive: true });

  const extension = EXTENSION_BY_TYPE[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  // turbopackIgnore: writing to a runtime upload directory, not a build input to trace/bundle.
  await writeFile(path.join(/* turbopackIgnore: true */ UPLOADS_DIR, filename), bytes);

  return NextResponse.json({ url: `/api/uploads/kits/${filename}` });
}
