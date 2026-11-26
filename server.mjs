// Custom server — see node_modules/next/dist/docs/01-app/02-guides/custom-server.md.
//
// Only exists to serve /api/uploads/kits/<filename> ourselves, with raw
// Node http APIs, instead of letting Next.js's Route Handler pipeline
// handle it. Next.js unconditionally strips the `content-length`,
// `content-encoding` and `transfer-encoding` response headers from every
// Route Handler response (see the FORBIDDEN_HEADERS list in
// node_modules/next/dist/server/send-response.js) and falls back to
// `Transfer-Encoding: chunked`. Without a known Content-Length, Cloudflare
// cannot slice a Range request out of its cache and just re-serves the
// entire file for every request — so an uploaded video can't start playing
// (or be seeked) until the whole thing has downloaded. Writing the response
// directly to the raw `http.ServerResponse` here skips that stripping
// entirely. Every other route is handed to Next.js unchanged.
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.argv.includes("--dev");
const app = next({ dev });
const handle = app.getRequestHandler();

// Mirrors src/lib/uploads.ts — this file isn't compiled by Next, so it can't
// import that module directly.
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "kits");
const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+\.[a-z0-9]+$/;
const CONTENT_TYPE_BY_EXTENSION = {
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

const UPLOADS_PATH_PREFIX = "/api/uploads/kits/";

async function serveUpload(req, res, filename) {
  if (!FILENAME_PATTERN.test(filename)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Невалидно име на файл." }));
    return;
  }

  const extension = filename.split(".").pop() || "";
  const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
  if (!contentType) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Неподдържан тип файл." }));
    return;
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  let fileSize;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Файлът не е намерен." }));
    return;
  }

  const baseHeaders = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  const range = req.headers["range"];
  if (!range) {
    res.writeHead(200, { ...baseHeaders, "Content-Length": fileSize });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match && match[1] ? Number(match[1]) : 0;
  const end = match && match[2] ? Number(match[2]) : fileSize - 1;
  if (!match || start > end || end >= fileSize) {
    res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
    res.end();
    return;
  }

  res.writeHead(206, {
    ...baseHeaders,
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Content-Length": end - start + 1,
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(filePath, { start, end }).pipe(res);
}

app.prepare().then(() => {
  createServer((req, res) => {
    const pathname = (req.url || "").split("?")[0];
    if ((req.method === "GET" || req.method === "HEAD") && pathname.startsWith(UPLOADS_PATH_PREFIX)) {
      const filename = pathname.slice(UPLOADS_PATH_PREFIX.length);
      serveUpload(req, res, filename).catch((error) => {
        console.error("Failed to serve upload:", error);
        if (!res.headersSent) res.writeHead(500);
        res.end();
      });
      return;
    }
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server listening on port ${port} as ${dev ? "development" : "production"}`);
  });
});
