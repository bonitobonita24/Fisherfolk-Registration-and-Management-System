"use client";

import { useParams, usePathname } from "next/navigation";

import { computeTenantPrefix, joinTenantPath } from "./tenant-href";

/**
 * Client hook returning a tenant-aware href builder. Pass an app-relative path
 * (e.g. "/fisherfolk", "/fisherfolk/${id}") and get the correct in-app link for
 * the current host: `/${slug}/...` on a subdirectory host (unchanged prod
 * behaviour), or a clean `/...` on a masked custom-domain host (no 308 hop).
 *
 * Self-derives the slug from the route params and the mode from the visible
 * pathname, so it works in any client component regardless of how that
 * component currently obtains the tenant slug.
 */
export function useTenantHref(): (path: string) => string {
  const params = useParams<{ tenant?: string | string[] }>();
  const pathname = usePathname();
  const raw = params?.tenant;
  const slug = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";
  const prefix = computeTenantPrefix(slug, pathname ?? "");
  return (path: string) => joinTenantPath(prefix, path);
}
