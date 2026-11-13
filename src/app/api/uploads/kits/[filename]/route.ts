import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/uploads";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/**
 * Serves admin-uploaded kit images. Not a route under `public/`: in this
 * Next.js version, `public/` is compiled into a build-time static-asset
 * manifest, so files written there after the build (as uploads are) 404 in
 * production. A Route Handler always runs live, so it can read a file the
 * upload endpoint wrote moments ago.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  // Reject path traversal / anything that isn't a plain generated filename.
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(filename)) {
    return NextResponse.json({ error: "Невалидно име на файл." }, { status: 400 });
  }

  const extension = filename.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    return NextResponse.json({ error: "Неподдържан тип файл." }, { status: 400 });
  }

  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ UPLOADS_DIR, filename));
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "Файлът не е намерен." }, { status: 404 });
  }
}
