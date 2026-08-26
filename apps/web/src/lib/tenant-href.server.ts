import "server-only";

import { headers } from "next/headers";

import { normalizeHost, parseCustomDomainMap } from "./tenant-routing";

// Parsed once per runtime (same source the middleware reads). Empty by default
// -> no host is ever masked -> tenantHref always returns the slug-prefixed form
// (unchanged behaviour until a custom domain is onboarded).
const customDomainToSlug = parseCustomDomainMap(process.env.TENANT_CUSTOM_DOMAINS);

/**
 * Server-side counterpart to {@link useTenantHref} for RSC `redirect()` targets.
 * Returns a clean `/...` path when the current request arrives on a masked
 * custom-domain host whose slug matches, or `/${slug}/...` otherwise. Using the
 * clean form on a masked host avoids the middleware's 308 inverse-mask hop.
 */
export async function tenantHref(slug: string, path: string): Promise<string> {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const hdrs = await headers();
  const hostSlug = customDomainToSlug[normalizeHost(hdrs.get("host")) ?? ""];
  const masked = hostSlug !== undefined && hostSlug === slug;
  return masked ? clean : `/${slug}${clean}`;
}
