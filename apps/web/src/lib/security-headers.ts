/**
 * security-headers.ts — single source of truth for the app's security headers.
 *
 * The Content-Security-Policy `img-src` must include the object-storage origin
 * (MinIO/S3) that serves presigned photo/signature URLs. That origin is
 * environment-specific and only known at RUNTIME, but Next.js evaluates
 * `next.config` `headers()` at BUILD time and bakes the result into the routes
 * manifest. Since this app ships ONE image promoted across dev/stage/prod (env
 * injected at runtime), the CSP is applied at runtime in `middleware.ts` using
 * `buildContentSecurityPolicy(storageOriginFromEnv())`.
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

// Dashboard barangay-density map (MapLibre GL + CARTO basemap). MapLibre runs
// its renderer in a blob: web-worker, and the CARTO GL basemap style/glyphs/
// sprite/vector-tiles are fetched from the CARTO CDN. These are scoped to the
// CARTO CDN specifically (NOT a blanket `https:`) so the map works without
// otherwise widening this gov app's egress surface.
const MAP_CDN = "https://*.cartocdn.com";

// Cloudflare Web Analytics ("Insights") is auto-injected by the CF proxy on the
// production zone. Its beacon script loads from static.cloudflareinsights.com and
// POSTs RUM data to cloudflareinsights.com/cdn-cgi/rum. Both origins are scoped
// explicitly (script-src + connect-src) so the beacon works without widening the
// policy to a blanket https:. Inert on non-proxied envs (nothing loads the script).
const CF_INSIGHTS_SCRIPT = "https://static.cloudflareinsights.com";
const CF_INSIGHTS_BEACON = "https://cloudflareinsights.com";

/** Build the CSP string, optionally allowing images from `storageOrigin`. */
export function buildContentSecurityPolicy(storageOrigin: string): string {
  const imgSrc = ["img-src 'self' data: blob:", storageOrigin, MAP_CDN]
    .filter(Boolean)
    .join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com ${CF_INSIGHTS_SCRIPT}`,
    // MapLibre GL spawns its renderer worker from a blob: URL; without an
    // explicit worker-src it falls back to script-src (no blob:) and the map
    // worker is blocked.
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    imgSrc,
    "font-src 'self'",
    `connect-src 'self' ${MAP_CDN} ${CF_INSIGHTS_BEACON}`,
    "frame-src 'self' https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Static (env-independent) security headers, applied everywhere. */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // geolocation=(self): first-party "Use my location" capture (LocationPicker, FIS-25)
  // needs the browser Geolocation API; cross-origin frames stay blocked.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
];
