import type { NextConfig } from "next";
import path from "path";

// Object-storage origin (MinIO/S3) that serves presigned photo/signature URLs.
// Derived from STORAGE_ENDPOINT so CSP allows images in dev (localhost:port) and prod alike.
const storageOrigin = (() => {
  const endpoint = process.env["STORAGE_ENDPOINT"];
  if (!endpoint) return "";
  try {
    return new URL(endpoint).origin;
  } catch {
    return "";
  }
})();

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      ["img-src 'self' data: blob:", storageOrigin].filter(Boolean).join(" "),
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@frms/shared", "@frms/db", "@frms/ui"],
  serverExternalPackages: ["isomorphic-dompurify", "@prisma/client", "bcryptjs"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
