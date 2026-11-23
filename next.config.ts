import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Our admin proxy (proxy.ts) gates /api/admin/uploads, so Next.js
    // buffers the whole request body (default cap 10MB) to let the route
    // handler re-read it. Admin video uploads allow up to 100MB — raise the
    // buffer so proxy doesn't silently truncate them before formData parses.
    proxyClientMaxBodySize: "110mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Railway (and most managed hosts) terminate TLS at their edge and forward
  // requests over plain HTTP internally, signaling the client's original
  // scheme via this header. A request that arrived over plain HTTP gets
  // redirected to HTTPS; one that already arrived over HTTPS (the normal
  // case, since Railway auto-provisions the certificate) never matches this
  // rule. Local `next dev`/`next start` have no such header, so this never
  // fires there either.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          { type: "header", key: "x-forwarded-proto", value: "http" },
          { type: "host", value: "(?<host>.*)" },
        ],
        destination: "https://:host/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Tells browsers to always use HTTPS for this domain from now on,
          // even if a link or bookmark points at plain http://. Browsers only
          // honor this when it's received over an actual HTTPS connection, so
          // it's a no-op for local http://localhost development.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
