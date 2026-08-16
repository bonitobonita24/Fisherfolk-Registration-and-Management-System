/**
 * Per-tenant PUBLIC landing page flag (`/{slug}` root marketing placeholder —
 * the FerryBook-style marketing slot for a tenant that wants one).
 *
 * Default OFF: FRMS keeps its current behaviour — `/{slug}` always redirects
 * to `/{slug}/login` (anonymous) or `/{slug}/dashboard` (authenticated); see
 * `middleware.ts` and `app/[tenant]/page.tsx`. Runs in the edge middleware
 * runtime too, so this stays a tiny standalone read rather than importing the
 * full `env.ts` (`@t3-oss/env-nextjs`) schema into that runtime.
 *
 * Read via this ONE typed helper everywhere — never scatter
 * `process.env.TENANT_LANDING_ENABLED` reads across middleware/page code.
 */
export function isTenantLandingEnabled(): boolean {
  return process.env.TENANT_LANDING_ENABLED === "true";
}
