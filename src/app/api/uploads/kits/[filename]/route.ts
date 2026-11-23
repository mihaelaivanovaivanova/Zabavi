import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/uploads";

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
 * Streams the file and honors Range requests instead of buffering the whole
 * thing in memory — required for video: without Range support, the browser
 * can't start playback (or seek) until the entire file has downloaded, which
 * makes anything above a few MB feel like it's hanging.
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
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new NextResponse(stream, { headers: { ...baseHeaders, "Content-Length": String(fileSize) } });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : 0;
  const end = match?.[2] ? Number(match[2]) : fileSize - 1;
  if (!match || start > end || end >= fileSize) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileSize}` } });
  }

  const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;
  return new NextResponse(stream, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(end - start + 1),
    },
  });
}
