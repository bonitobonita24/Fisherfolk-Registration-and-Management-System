/**
 * Tenant-aware in-app link path construction.
 *
 * FRMS serves each tenant two ways:
 *  - SUBDIRECTORY (default, e.g. frms.powerbyte.app/{slug}/...) — the browser
 *    URL includes the tenant slug, so in-app links must keep the `/${slug}`
 *    prefix. This is the canonical form and MUST stay byte-identical to the
 *    historical behaviour.
 *  - MASKED CUSTOM DOMAIN (e.g. frms-demo.powerbyte.app -> slug "demo") — the
 *    middleware internally rewrites the clean root path to `/{slug}/...`, but
 *    the browser URL stays clean. A slug-prefixed link on this host would be
 *    308-inverse-masked back to the clean path on every click (extra hop; RSC
 *    client navs can stall on it). So links here must use NO slug prefix.
 *
 * The visible pathname is the reliable discriminator: on a subdirectory host
 * it starts with `/${slug}`; on a masked host it is already clean (the slug is
 * stripped), so it never does. See src/middleware.ts + src/lib/tenant-routing.ts
 * (inverse masking) and docs/MULTITENANCY.md.
 */

/**
 * Prefix to prepend to in-app links, derived from the tenant slug and the
 * browser-visible pathname. `/${slug}` on a subdirectory host (unchanged prod
 * behaviour); `""` on a masked custom-domain host.
 */
export function computeTenantPrefix(slug: string, visiblePathname: string): string {
  if (!slug) return "";
  const onSubdirectory =
    visiblePathname === `/${slug}` || visiblePathname.startsWith(`/${slug}/`);
  return onSubdirectory ? `/${slug}` : "";
}

/** Join a tenant prefix and an app-relative path (leading slash normalised). */
export function joinTenantPath(prefix: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${clean}`;
}
