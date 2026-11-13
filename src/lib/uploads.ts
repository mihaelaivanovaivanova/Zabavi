import path from "node:path";

/**
 * Deliberately outside `public/` — see the comment in
 * `api/uploads/kits/[filename]/route.ts` for why files written here must be
 * served through a Route Handler rather than Next's static `public/`
 * pipeline.
 */
export const UPLOADS_DIR = path.join(process.cwd(), "uploads", "kits");
