import type { NextConfig } from "next";
import path from "path";

// NOTE: Content-Security-Policy is intentionally NOT set here. Next.js bakes
// `headers()` at BUILD time, but the CSP `img-src` needs the object-storage
// origin (MinIO/S3) which is only known at RUNTIME (this app ships one image
// promoted across dev/stage/prod). The CSP is therefore applied at runtime in
// `src/middleware.ts`. These remaining headers are environment-independent.
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
