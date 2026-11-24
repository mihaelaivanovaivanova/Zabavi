import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegStaticPath from "ffmpeg-static";

/**
 * The box-contents video plays in a 9:16 player at most ~400px wide on
 * screen (see WhatsInTheBox.tsx) — admin-uploaded source clips have been raw
 * phone recordings, 1080p+ at a bitrate far beyond what that display needs,
 * which is why a single video was ~100MB and unusable on mobile data even
 * with Range support. `min(ih,1280)` caps height without upscaling a
 * smaller source. `+faststart` moves the moov atom to the front of the file
 * so playback can start from the first bytes instead of requiring the tail
 * of the file first.
 */
const MAX_HEIGHT_PX = 1280;

/**
 * `ffmpeg-static`'s postinstall download doesn't survive Railway's build
 * (the binary isn't present at runtime there — see railpack.json, which
 * installs the real `ffmpeg` apt package instead). Prefer the downloaded
 * binary when it actually exists (local dev, where there's no system
 * ffmpeg), otherwise fall back to whatever `ffmpeg` is on PATH.
 */
function resolveFfmpegBinary(): string {
  if (ffmpegStaticPath && existsSync(ffmpegStaticPath)) return ffmpegStaticPath;
  return "ffmpeg";
}

export async function optimizeVideoBuffer(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "zabavi-video-"));
  const inputPath = path.join(dir, "input");
  const outputPath = path.join(dir, "output.mp4");
  try {
    await writeFile(inputPath, input);
    await runFfmpeg(resolveFfmpegBinary(), inputPath, outputPath);
    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function runFfmpeg(binaryPath: string, inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      inputPath,
      "-vf",
      `scale=-2:min(ih\\,${MAX_HEIGHT_PX})`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "fast",
      "-crf",
      "26",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputPath,
    ];
    const ffmpeg = spawn(binaryPath, args);
    let stderr = "";
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-2000)}`));
      }
    });
  });
}
