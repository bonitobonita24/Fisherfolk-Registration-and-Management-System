/**
 * Tenant route resolution — the mechanism behind custom-domain "masking".
 *
 * Tenants are addressed by subdirectory: `https://<app>/<slug>/...`. A tenant
 * may also point their OWN domain (CNAME) at our app; we then resolve the Host
 * header to that tenant and rewrite the request INTERNALLY to `/<slug>/...`.
 * The browser keeps the custom domain in the URL bar (masking) while the
 * existing `[tenant]` subdirectory routes serve the content — no iframes.
 *
 * This module is PURE so the routing decision is unit-testable without a server.
 * Wiring (read Host + custom-domain map in middleware, NextResponse.rewrite to
 * `rewriteTo`) is documented in docs/MULTITENANCY.md and kept out of the auth
 * middleware until a real custom domain is onboarded and can be verified.
 */

/** Path prefixes that must NEVER be rewritten under a tenant slug. */
export const RESERVED_PREFIXES = [
  "/api",
  "/_next",
  "/static",
  "/data", // public/ static assets (e.g. barangay geojson) — never tenant-scoped
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

/**
 * App-level (tenant-agnostic) top-level routes. On a custom-domain host these
 * must be served as-is — rewriting them under the tenant slug would 404 the
 * login page (`/admin` → `/<slug>/admin`).
 */
export const APP_LEVEL_PREFIXES = ["/admin", "/login", "/platform"] as const;

export interface TenantRouteResolution {
  /** Resolved tenant slug, or null when none could be determined. */
  slug: string | null;
  /** How the tenant was identified. */
  source: "host" | "path" | "none";
  /**
   * Internal path to rewrite to (custom-domain masking), or null when the URL
   * is already in the correct internal form and no rewrite is needed.
   */
  rewriteTo: string | null;
  /**
   * Visible-URL redirect (inverse masking): on a custom-domain host a
   * slug-prefixed path (`/<slug>/dashboard`) redirects to its clean form
   * (`/dashboard`) so the slug never shows in the address bar. Null otherwise.
   */
  redirectTo: string | null;
}

/** Lowercase a Host header and drop any `:port` suffix. */
export function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return null;
  // IPv6 hosts are bracketed (e.g. [::1]:3000) — leave the bracketed part.
  const withoutPort = trimmed.startsWith("[")
    ? trimmed.replace(/\](:\d+)$/, "]")
    : trimmed.replace(/:\d+$/, "");
  return withoutPort;
}

function isReserved(pathname: string): boolean {
  return RESERVED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAppLevel(pathname: string): boolean {
  return APP_LEVEL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function firstSegment(pathname: string): string | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg ?? null;
}

export interface ResolveTenantRouteOptions {
  /** Raw Host header (may include a port). */
  host: string | null | undefined;
  /** Request pathname, e.g. "/calapan-city/dashboard" or "/dashboard". */
  pathname: string;
  /**
   * Verified custom domains → tenant slug. Empty (the default today) means the
   * resolver always falls through to subdirectory routing — zero behaviour
   * change until the first custom domain is added.
   */
  customDomainToSlug?: Record<string, string>;
}

/**
 * Decide the tenant for a request and whether the URL must be rewritten.
 *
 * - Host matches a custom domain → that tenant; rewrite `/<path>` to
 *   `/<slug>/<path>` unless it's already prefixed or a reserved path.
 * - Otherwise → subdirectory routing; slug is the first path segment, no
 *   rewrite.
 */
export function resolveTenantRoute(
  opts: ResolveTenantRouteOptions,
): TenantRouteResolution {
  const { pathname } = opts;
  const map = opts.customDomainToSlug ?? {};
  const host = normalizeHost(opts.host);

  const slugFromHost = host ? map[host] : undefined;

  if (slugFromHost) {
    // Reserved paths (api, _next, assets) are tenant-agnostic — never rewrite.
    if (isReserved(pathname)) {
      return { slug: slugFromHost, source: "host", rewriteTo: null, redirectTo: null };
    }
    // App-level routes (login, platform) are served as-is on any host —
    // rewriting them under the slug would 404 the login page.
    if (isAppLevel(pathname)) {
      return { slug: slugFromHost, source: "host", rewriteTo: null, redirectTo: null };
    }
    // The domain root is app-level too: anonymous visitors get the public
    // marketing landing; signed-in users are forwarded by the auth handler.
    if (pathname === "/") {
      return { slug: slugFromHost, source: "host", rewriteTo: null, redirectTo: null };
    }
    // Slug-prefixed URL on the custom domain → redirect to the clean form
    // (inverse masking) so the slug never shows in the address bar.
    if (
      pathname === `/${slugFromHost}` ||
      pathname.startsWith(`/${slugFromHost}/`)
    ) {
      const stripped = pathname.slice(`/${slugFromHost}`.length) || "/";
      return {
        slug: slugFromHost,
        source: "host",
        rewriteTo: null,
        redirectTo: stripped,
      };
    }
    const suffix = pathname === "/" ? "" : pathname;
    return {
      slug: slugFromHost,
      source: "host",
      rewriteTo: `/${slugFromHost}${suffix}`,
      redirectTo: null,
    };
  }

  // Subdirectory routing (primary app host or unknown host).
  if (isReserved(pathname)) {
    return { slug: null, source: "none", rewriteTo: null, redirectTo: null };
  }
  const seg = firstSegment(pathname);
  if (seg) {
    return { slug: seg, source: "path", rewriteTo: null, redirectTo: null };
  }
  return { slug: null, source: "none", rewriteTo: null, redirectTo: null };
}

/**
 * Parse the optional `TENANT_CUSTOM_DOMAINS` env var (a JSON object mapping
 * `"domain": "slug"`). Returns `{}` when unset or malformed — fail safe to
 * subdirectory routing rather than throwing in the request path.
 */
export function parseCustomDomainMap(
  raw: string | undefined,
): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [domain, slug] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        const h = normalizeHost(domain);
        if (h && typeof slug === "string" && slug) out[h] = slug;
      }
      return out;
    }
  } catch {
    // fall through to empty map
  }
  return {};
}
