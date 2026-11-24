import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isOptimizableImage, optimizeImageBuffer } from "@/lib/optimizeImage";
import { optimizeVideoBuffer } from "@/lib/optimizeVideo";
import { UPLOADS_DIR } from "@/lib/uploads";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function optimize(filename: string, original: Buffer): Promise<Buffer | null> {
  const extension = filename.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (contentType && isOptimizableImage(contentType)) {
    return optimizeImageBuffer(original, contentType);
  }
  if (extension === "mp4") {
    return optimizeVideoBuffer(original);
  }
  return null;
}

/**
 * One-off maintenance endpoint: re-runs image/video optimization over every
 * already-uploaded file in place (same filename/URL, so no DB or Cloudflare
 * cache-key changes needed). Uploads made before optimization existed were
 * raw, multi-MB/multi-dozen-MB exports — this is how those get shrunk
 * retroactively. Safe to call repeatedly; re-optimizing an already-small
 * file is a no-op cost, not a correctness risk.
 */
export async function POST() {
  const filenames = await readdir(UPLOADS_DIR).catch(() => []);

  let processed = 0;
  let bytesBefore = 0;
  let bytesAfter = 0;
  const results: Array<{ filename: string; before: number; after: number }> = [];

  for (const filename of filenames) {
    const filePath = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, filename);
    const original = await readFile(filePath);
    const optimized = await optimize(filename, original);
    if (!optimized) continue;

    if (optimized.length < original.length) {
      await writeFile(filePath, optimized);
    }

    processed += 1;
    bytesBefore += original.length;
    bytesAfter += Math.min(optimized.length, original.length);
    results.push({ filename, before: original.length, after: Math.min(optimized.length, original.length) });
  }

  return NextResponse.json({ processed, bytesBefore, bytesAfter, results });
}
