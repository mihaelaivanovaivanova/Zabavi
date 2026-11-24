import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { isOptimizableImage, optimizeImageBuffer } from "@/lib/optimizeImage";

describe("isOptimizableImage", () => {
  it("accepts jpeg/png/webp and rejects everything else", () => {
    expect(isOptimizableImage("image/png")).toBe(true);
    expect(isOptimizableImage("image/jpeg")).toBe(true);
    expect(isOptimizableImage("image/webp")).toBe(true);
    expect(isOptimizableImage("image/gif")).toBe(false);
    expect(isOptimizableImage("video/mp4")).toBe(false);
  });
});

describe("optimizeImageBuffer", () => {
  it("downsizes an oversized PNG to the max dimension and shrinks its byte size", async () => {
    const oversized = await sharp({
      create: { width: 3000, height: 2000, channels: 4, background: { r: 200, g: 100, b: 50, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const optimized = await optimizeImageBuffer(oversized, "image/png");
    const metadata = await sharp(optimized).metadata();

    expect(metadata.width).toBeLessThanOrEqual(1600);
    expect(metadata.height).toBeLessThanOrEqual(1600);
    expect(optimized.length).toBeLessThan(oversized.length);
  });

  it("does not upscale an image already smaller than the max dimension", async () => {
    const small = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 10, g: 20, b: 30 } },
    })
      .jpeg()
      .toBuffer();

    const optimized = await optimizeImageBuffer(small, "image/jpeg");
    const metadata = await sharp(optimized).metadata();

    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300);
  });
});
