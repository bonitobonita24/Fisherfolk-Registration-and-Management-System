# Multi-Tenancy & Custom Domains (Domain Masking)

> Status: subdirectory tenancy + data isolation are LIVE. Custom-domain masking
> has its data model, a tested routing resolver, and documented wiring ready —
> live middleware wiring is deferred until the first custom domain is onboarded
> (so it can be verified against a real domain). See "Activation" below.

## 1. Tenancy model — shared schema, one codebase

This is a **single-codebase, shared-schema SaaS**. One deployed app serves every
tenant (LGU). Therefore:

- **Code / features / UI** ship to **all tenants at once** — there is no per-tenant
  fork. Test before merging to `main`.
- **Configuration** can still differ per tenant (theme colors, SMTP, barangay
  list, etc.) — stored as columns/rows on the tenant.
- **Data** is **isolated per tenant** — see §2.

Tenants are addressed by **subdirectory**: `https://<app>/<slug>/...`
(e.g. `/calapan-city/dashboard`).

## 2. Data isolation (enforced, tested)

Every business model carries `tenant_id` with per-tenant unique constraints
(`@@unique([tenantId, idNumber])`, etc.). At runtime:

- `protectedProcedure` (tRPC) calls `runWithTenant(ctx.tenantId, …)`, which sets
  an `AsyncLocalStorage` tenant context. (The ALS instance is pinned to
  `globalThis` — do not regress this; a module-local ALS silently breaks every
  tenant-scoped query.)
- The Prisma `tenantGuardExtension` reads that context and forces `tenantId`
  onto every `where` and `data`. Two guarantees, **unit-tested** in
  `apps/web/src/server/__tests__/tenant-isolation.test.ts`:
  1. `tenantId` is spread **last** into `where` → a forged `where.tenantId`
     (a cross-tenant read attempt) is always **overridden** by the active tenant.
  2. writes are always stamped with the active `tenantId`.
- Tenant comes from the **authenticated session** (`session.user.tenantId`), not
  the URL — so the data boundary does not depend on the URL being correct.
- `Tenant` and `AuditLog` are the only un-scoped (system) models; platform-level
  access uses `platformPrisma`.

> ⚠️ Isolation is only as strong as the guard being on every query path. A query
> that bypasses the guarded client could leak across tenants. Keep the isolation
> test green and route all tenant data through `prisma` (guarded), never a raw
> client.

## 3. Custom domains — "domain masking"

Goal: a tenant uses **their own domain** while the app keeps serving from the
existing subdirectory routes. The browser shows the tenant's domain; internally
the request is rewritten to `/<slug>/...`. No iframes (those break auth cookies,
deep links, and SEO).

### Data model (LIVE)
`Tenant.customDomain` (unique, nullable) + `Tenant.domainVerifiedAt`
(migration `20260629140000_tenant_custom_domain`).

### Routing resolver (LIVE, tested)
`apps/web/src/lib/tenant-routing.ts` — pure `resolveTenantRoute({ host, pathname,
customDomainToSlug })` returns `{ slug, source, rewriteTo }`:
- Host matches a custom domain → rewrite `/<path>` to `/<slug>/<path>` (skips
  reserved `/api`, `/_next`, assets; no double-rewrite if already prefixed).
- Otherwise → subdirectory routing, no rewrite.
- **Empty map → always subdirectory** (zero behaviour change today).
Tested in `apps/web/src/lib/__tests__/tenant-routing.test.ts`.

### DNS / infra setup (per tenant)
1. Tenant creates a `CNAME` (or `A`/`ALIAS` at apex) pointing their domain at our
   app host / load balancer.
2. We add the domain to TLS (Caddy/Traefik/Cloudflare auto-cert, or our reverse
   proxy's on-demand TLS).
3. We set `Tenant.customDomain` and `domainVerifiedAt` once DNS+TLS resolve.

### Activation (deferred wiring — drop-in)
When the first custom domain is onboarded, wire the resolver into
`apps/web/src/middleware.ts` BEFORE the auth/route logic:

```ts
import { resolveTenantRoute, parseCustomDomainMap } from "@/lib/tenant-routing";

const customDomains = parseCustomDomainMap(process.env.TENANT_CUSTOM_DOMAINS);

// inside the middleware, before route(req):
const { rewriteTo } = resolveTenantRoute({
  host: req.headers.get("host"),
  pathname: req.nextUrl.pathname,
  customDomainToSlug: customDomains,
});
if (rewriteTo && rewriteTo !== req.nextUrl.pathname) {
  const url = req.nextUrl.clone();
  url.pathname = rewriteTo;
  return withCsp(NextResponse.rewrite(url));
}
```

Provide the map via env (`TENANT_CUSTOM_DOMAINS='{"fisherfolk.calapancity.gov.ph":"calapan-city"}'`)
to avoid a per-request DB lookup in middleware; refresh on deploy or cache from
`Tenant.customDomain`. The login page and session already derive the tenant from
the user account, so masking does not change the data boundary — it only changes
the visible URL.

**Verify on activation:** with one real custom domain, confirm (a) the domain
serves the tenant's content with the domain shown in the URL, (b) login works and
lands the user in their tenant, (c) `/api/*` and `/_next/*` are unaffected, and
(d) a second tenant's domain cannot see the first's data (isolation test stays
green + a manual cross-domain check).
