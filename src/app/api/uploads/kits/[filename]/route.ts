import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/uploads";

/**
 * Reads a byte range into a Buffer instead of returning the stream directly.
 * A streamed Response body loses its Content-Length in this environment
 * (the response falls back to `Transfer-Encoding: chunked`), and without a
 * known Content-Length Cloudflare cannot slice Range requests out of its
 * cache — it just re-serves the full object for every request, forcing
 * mobile clients to download the entire file before video can start
 * playing. A Buffer body has a definite length, so Content-Length survives.
 */
async function readFileRange(filePath: string, start: number, end: number): Promise<ArrayBuffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of createReadStream(filePath, { start, end })) {
    chunks.push(chunk as Buffer);
  }
  const bytes = Buffer.concat(chunks);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

/**
 * Serves admin-uploaded kit images. Not a route under `public/`: in this
 * Next.js version, `public/` is compiled into a build-time static-asset
 * manifest, so files written there after the build (as uploads are) 404 in
 * production. A Route Handler always runs live, so it can read a file the
 * upload endpoint wrote moments ago.
 *
 * Honors Range requests — required for video: without Range support, the
 * browser can't start playback (or seek) until the entire file has
 * downloaded, which makes anything above a few MB feel like it's hanging.
 * Reads only the requested range into memory (see `readFileRange`), so a
 * seek or a Cloudflare range-cache fill doesn't buffer the whole file.
 */
export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
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

  const filePath = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, filename);
  let fileSize: number;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    return NextResponse.json({ error: "Файлът не е намерен." }, { status: 404 });
  }

  const baseHeaders = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  const range = request.headers.get("range");
  if (!range) {
    const body = await readFileRange(filePath, 0, fileSize - 1);
    return new NextResponse(body, { headers: { ...baseHeaders, "Content-Length": String(fileSize) } });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : 0;
  const end = match?.[2] ? Number(match[2]) : fileSize - 1;
  if (!match || start > end || end >= fileSize) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileSize}` } });
  }

  const body = await readFileRange(filePath, start, end);
  return new NextResponse(body, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
