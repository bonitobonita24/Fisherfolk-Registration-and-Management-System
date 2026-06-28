/**
 * security-headers.ts — single source of truth for the app's security headers.
 *
 * The Content-Security-Policy `img-src` must include the object-storage origin
 * (MinIO/S3) that serves presigned photo/signature URLs. That origin is
 * environment-specific and only known at RUNTIME, but Next.js evaluates
 * `next.config` `headers()` at BUILD time and bakes the result into the routes
 * manifest. Since this app ships ONE image promoted across dev/stage/prod (env
 * injected at runtime), the CSP is applied at runtime in `middleware.ts` using
 * `buildContentSecurityPolicy(storageOriginFromEnv())`. The `next.config` copy
 * acts as a static fallback for any response the middleware does not cover.
 */

/** Derive the object-storage origin (scheme://host:port) from STORAGE_ENDPOINT. */
export function storageOriginFromEnv(): string {
  const endpoint = process.env["STORAGE_ENDPOINT"];
  if (!endpoint) return "";
  try {
    return new URL(endpoint).origin;
  } catch {
    return "";
  }
}

/** Build the CSP string, optionally allowing images from `storageOrigin`. */
export function buildContentSecurityPolicy(storageOrigin: string): string {
  const imgSrc = ["img-src 'self' data: blob:", storageOrigin]
    .filter(Boolean)
    .join(" ");
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    imgSrc,
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Static (env-independent) security headers, applied everywhere. */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
];
