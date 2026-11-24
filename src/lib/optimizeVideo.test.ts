import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { describe, expect, it } from "vitest";
import { optimizeVideoBuffer } from "@/lib/optimizeVideo";

function generateTestClip(): Buffer {
  // A 1-second synthetic 1080x1920 (portrait, matching real uploads) H.264
  // clip, generated entirely by ffmpeg itself (testsrc2 pattern + silent
  // tone) so the test needs no fixture file.
  const result = spawnSync(ffmpegPath as string, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=1080x1920:duration=1:rate=30",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=44100:cl=stereo",
    "-t",
    "1",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-f",
    "mp4",
    "-movflags",
    "frag_keyframe+empty_moov",
    "pipe:1",
  ]);
  if (result.status !== 0) {
    throw new Error(`failed to generate test clip: ${result.stderr.toString().slice(-2000)}`);
  }
  return result.stdout;
}

describe("optimizeVideoBuffer", () => {
  it("re-encodes an oversized portrait clip down to the max height and shrinks it", async () => {
    const original = generateTestClip();
    const optimized = await optimizeVideoBuffer(original);

    const probe = spawnSync(ffmpegPath as string, ["-i", "pipe:0"], { input: optimized });
    const info = probe.stderr.toString();

    expect(info).toMatch(/Video: h264/);
    expect(info).toMatch(/720x1280/);
    expect(optimized.length).toBeGreaterThan(0);
  }, 30000);
});
