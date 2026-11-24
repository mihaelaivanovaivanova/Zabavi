import sharp from "sharp";

/**
 * A single kit image is shown at most ~800px wide on the landing page, even
 * on a 2x retina display that's ~1600px of actual needed resolution. Admin
 * uploads have been raw camera/screenshot exports several MB each, which is
 * why the site was timing out on mobile — resize before anything is served.
 */
const MAX_DIMENSION_PX = 1600;

const OPTIMIZABLE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isOptimizableImage(contentType: string): boolean {
  return OPTIMIZABLE_CONTENT_TYPES.has(contentType);
}

/**
 * Resizes (never upscales) and recompresses an uploaded image. Keeps the
 * original format so transparency (PNG illustrations) and the existing file
 * extension/URL are preserved — only pixel dimensions and compression change.
 */
export async function optimizeImageBuffer(input: Buffer, contentType: string): Promise<Buffer> {
  const pipeline = sharp(input).resize({
    width: MAX_DIMENSION_PX,
    height: MAX_DIMENSION_PX,
    fit: "inside",
    withoutEnlargement: true,
  });

  switch (contentType) {
    case "image/jpeg":
      return pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    case "image/webp":
      return pipeline.webp({ quality: 82 }).toBuffer();
    case "image/png":
      return pipeline.png({ compressionLevel: 9, effort: 10 }).toBuffer();
    default:
      return input;
  }
}
