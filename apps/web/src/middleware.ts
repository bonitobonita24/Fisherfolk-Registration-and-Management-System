import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth/edge";
import {
  buildContentSecurityPolicy,
  storageOriginFromEnv,
} from "@/lib/security-headers";
import {
  isReservedTenantSlug,
  normalizeHost,
  parseCustomDomainMap,
  resolveTenantRoute,
} from "@/lib/tenant-routing";
import { canAccessRouteSegment } from "@/lib/route-feature-map";
import { isTenantLandingEnabled } from "@/lib/tenant-landing";
import type { Actor, FeatureKey } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

/**
 * Request headers ONLY middleware may ever set — each is a guard-EXCEPTION
 * marker a downstream layout reads to skip its auth redirect
 * (`x-tenant-login-route`, `x-tenant-public-root-route`) or a loop-guard
 * marker for the custom-domain rewrite (`x-tenant-internal-rewrite`). If a
 * client could forge one of these on an ordinary request, a future layout
 * change could end up trusting it. Middleware already redirects unauth/
 * cross-tenant requests BEFORE any layout runs today (defense in depth), but
 * every response that continues the request onward is built from THIS
 * sanitized base — never raw `req.headers` — so a client-supplied copy of any
 * of these three headers can never reach a downstream layout/page.
 * See docs/SITE_ACCESS_STANDARD.md §3.
 *
 * `x-tenant-internal-rewrite` gets ONE deliberate carve-out: the loop-guard
 * check below (`isInternalRewrite`) reads it straight off the raw incoming
 * `req.headers`, not the sanitized base. That marker is middleware's own
 * signal to ITSELF across the internal re-invocation Next.js performs on a
 * `NextResponse.rewrite()` target (see the GUARD comment lower in this
 * file) — sanitizing it there would erase the very re-invocation it's meant
 * to detect and reopen the custom-domain redirect loop it exists to close.
 * Forging it only skips a cosmetic inverse-masking redirect (documented
 * pre-existing risk, auth untouched) and — per this file — it can never
 * reach a page, since every downstream-facing response still strips it.
 */
const MIDDLEWARE_ONLY_HEADERS = [
  "x-tenant-login-route",
  "x-tenant-public-root-route",
  "x-tenant-internal-rewrite",
] as const;

/**
 * Strip any client-supplied copy of the middleware-only guard headers and
 * return a fresh `Headers` every downstream header-construction path
 * (`passLoginRoute`, `passPublicTenantRoot`, `passthrough`, the rewrite
 * branch) must build FROM — never from raw `req.headers` directly.
 */
function sanitizedHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  for (const name of MIDDLEWARE_ONLY_HEADERS) headers.delete(name);
  return headers;
}

/**
 * The forge-proof replacement for a bare `NextResponse.next()`: continues the
 * request with the client-supplied guard-header copies stripped, so a
 * request that isn't an exact login/public-root match can never carry a
 * forged marker into a downstream layout.
 */
function passthrough(req: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: sanitizedHeaders(req) } });
}

// `/api/media` self-authenticates in its route handler (requireRouteAuth +
// tenant-scoped MediaObject lookup + rate-limit + egress audit — see
// app/api/media/route.ts), exactly like `/api/trpc`. It must bypass the tenant
// URL-routing below: its path second segment is "media", not a tenant slug, so
// without this an authed request would 307-redirect to /<slug>/dashboard and
// every image/signature/attachment would fail to load.
// `/admin` is a legacy global-sign-in bookmark (Milestone 4a — site-access-
// tenancy standard): the global staff login is DROPPED, so it silently
// redirects to `/` (the public marketing landing) — see app/admin/page.tsx.
// `/login` (Milestone 4b) is the PUBLIC tenant picker — the generic answer
// to "how does a visitor reach their org's login" — see app/login/page.tsx;
// it stays public (never wrapped in AppShell) and forwards to the real
// per-tenant form. `/` is handled explicitly in route() so anonymous
// visitors see it instead of being bounced to sign-in, while authenticated
// users are still routed to their app. The REAL sign-in forms live at
// `/{tenant-slug}/login` (per tenant) and `/tm/login` (platform staff) — see
// loginRouteSlug() below.
const PUBLIC_PATHS = [
  "/admin",
  "/login",
  "/api/auth",
  "/api/health",
  "/api/trpc",
  "/api/media",
  // public/ static data files (e.g. barangay boundary geojson). Middleware
  // runs BEFORE public/-file serving, so without this the tenant cross-check
  // reads "data" as a slug and 307s the fetch to the dashboard.
  "/data",
];

/** Roles that land on the tenant's `/admin`-tier post-login landing. */
const ADMIN_TIER_ROLES = new Set(["tenant_superadmin", "tenant_admin"]);

function tenantLandingSuffix(role: string | undefined): "/admin" | "/dashboard" {
  return role !== undefined && ADMIN_TIER_ROLES.has(role) ? "/admin" : "/dashboard";
}

/**
 * Matches a per-tenant or platform-staff sign-in FORM route: `/{slug}/login`
 * or `/tm/login`. Both share the same 2-segment shape, so one regex covers
 * both — the second path segment distinguishes tenant vs platform, and the
 * response header set below (`x-tenant-login-route`) tells the downstream
 * layout ([tenant]/layout.tsx or tm/layout.tsx) to render the form instead
 * of bouncing an unauthenticated visitor away.
 */
const LOGIN_ROUTE_RE = /^\/([^/]+)\/login$/;

function loginRouteSlug(pathname: string): string | null {
  const m = LOGIN_ROUTE_RE.exec(pathname);
  return m ? (m[1] ?? null) : null;
}

/**
 * Pass the request through, marking it as a login-route hit so the tenant/tm
 * layout can skip its normal auth-redirect guard for exactly this path
 * (GUARD EXCEPTION — see docs/SITE_ACCESS_STANDARD.md §3, §5).
 */
function passLoginRoute(req: NextRequest): NextResponse {
  const headers = sanitizedHeaders(req);
  headers.set("x-tenant-login-route", "1");
  return NextResponse.next({ request: { headers } });
}

/**
 * Matches the bare tenant-root path `/{slug}` — an EXACT single-segment
 * match, never a prefix (same discipline as `loginRouteSlug`), and never a
 * reserved/app-level slug (`tm`, `platform`, `admin`, `login`, `api`,
 * `demo` — see `isReservedTenantSlug`). Only consulted when
 * `TENANT_LANDING_ENABLED` is on; the caller is responsible for that check.
 */
const TENANT_ROOT_RE = /^\/([^/]+)$/;

function tenantRootSlug(pathname: string): string | null {
  const m = TENANT_ROOT_RE.exec(pathname);
  const slug = m?.[1];
  if (!slug || isReservedTenantSlug(slug)) return null;
  return slug;
}

/**
 * Pass the request through, marking it as the public per-tenant landing root
 * so the tenant layout can skip its normal auth-redirect guard for exactly
 * this path (GUARD EXCEPTION, same pattern as `passLoginRoute`). Only ever
 * reached when `TENANT_LANDING_ENABLED` is on.
 */
function passPublicTenantRoot(req: NextRequest): NextResponse {
  const headers = sanitizedHeaders(req);
  headers.set("x-tenant-public-root-route", "1");
  return NextResponse.next({ request: { headers } });
}

/**
 * Custom-domain "masking" map, parsed once per runtime from
 * `TENANT_CUSTOM_DOMAINS` (JSON: `{"domain":"slug"}`). Empty (the default)
 * means the resolver always falls through to subdirectory routing — zero
 * behaviour change until the first custom domain is onboarded. See
 * docs/MULTITENANCY.md §Activation.
 */
const customDomainToSlug = parseCustomDomainMap(
  process.env.TENANT_CUSTOM_DOMAINS,
);

function isPublicPath(pathname: string): boolean {
  // Match a public prefix only on a path boundary: the pathname must equal the
  // prefix or continue with "/". Guards against a future sibling route (e.g.
  // `/api/media-admin`) being silently treated as public by a loose startsWith.
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function withCsp(res: NextResponse): NextResponse {
  res.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(storageOriginFromEnv()),
  );
  return res;
}

function route(req: NextRequest & { auth: unknown }): NextResponse {
  const { pathname } = req.nextUrl;
  const session = req.auth as {
    user?: {
      role?: string;
      tenantSlug?: string | null;
      tenantId?: string | null;
      customView?: FeatureKey[] | null;
    };
  } | null;

  // A sign-in FORM route (`/{slug}/login` or `/tm/login`) is always reachable
  // pre-auth — grant it as an EXACT 2-segment match, never startsWith, so it
  // can never accidentally widen to a whole tenant subtree. An unauthenticated
  // visitor renders the form (marked via the response header so the layout's
  // auth guard skips it); an ALREADY-authenticated visitor is routed straight
  // to their real landing instead of seeing a redundant sign-in screen.
  const loginSlug = loginRouteSlug(pathname);
  if (loginSlug) {
    const user = session?.user;
    if (!user) {
      return passLoginRoute(req);
    }
    if (user.role === "tenant_manager") {
      return NextResponse.redirect(new URL("/tm/tenants", req.url));
    }
    if (user.tenantSlug) {
      return NextResponse.redirect(
        new URL(`/${user.tenantSlug}${tenantLandingSuffix(user.role)}`, req.url),
      );
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Bare per-tenant root (`/{slug}`, EXACT match) — only public when the
  // per-tenant landing flag is on (V32/Rule-34 addendum: optional per-tenant
  // marketing slot, default OFF). Flag off → falls through unchanged to the
  // normal tenant-route handling below (current FRMS behaviour preserved).
  const rootSlug = isTenantLandingEnabled() ? tenantRootSlug(pathname) : null;
  if (rootSlug) {
    const user = session?.user;
    if (!user) {
      return passPublicTenantRoot(req);
    }
    if (user.role === "tenant_manager") {
      return NextResponse.redirect(new URL("/tm/tenants", req.url));
    }
    const landingSlug = user.tenantSlug ?? rootSlug;
    return NextResponse.redirect(
      new URL(`/${landingSlug}${tenantLandingSuffix(user.role)}`, req.url),
    );
  }

  if (isPublicPath(pathname)) {
    return passthrough(req);
  }

  // The root `/` is the PUBLIC marketing landing. Anonymous visitors see it;
  // authenticated users are forwarded into their app (platform or tenant).
  if (pathname === "/") {
    const user = session?.user;
    if (!user) {
      return passthrough(req);
    }
    if (user.role === "tenant_manager") {
      return NextResponse.redirect(new URL("/tm/tenants", req.url));
    }
    if (user.tenantSlug) {
      // On a custom-domain host matching the session's tenant, redirect to
      // the CLEAN path — a slug-prefixed target would immediately 308 back
      // through the inverse mask (extra hop, and client RSC navs stall on it).
      const rootHostSlug =
        customDomainToSlug[normalizeHost(req.headers.get("host")) ?? ""];
      const landingSuffix = tenantLandingSuffix(user.role);
      const dashboardPath =
        rootHostSlug !== undefined && rootHostSlug === user.tenantSlug
          ? landingSuffix
          : `/${user.tenantSlug}${landingSuffix}`;
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    // Authenticated but no tenant context — fall through to the landing.
    return passthrough(req);
  }

  if (!session?.user) {
    // Route the unauthenticated deep-link to the RIGHT sign-in form: platform
    // paths go to /tm/login, everything else to the tenant's own
    // /{slug}/login — never the dropped global /admin (Rule 34 / site-access
    // standard §3). On a custom-domain host `pathname` is already the
    // internally REWRITTEN `/<slug>/...` form (see resolveTenantRoute), so
    // the first path segment is reliably the real tenant slug either way.
    if (pathname.startsWith("/tm")) {
      const loginUrl = new URL("/tm/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const tenantSlugFromUrl = pathname.split("/")[1] ?? "";
    const loginUrl = new URL(`/${tenantSlugFromUrl}/login`, req.url);
    // Hand the login page the CLEAN callback path: the post-login
    // `router.push(callbackUrl)` must not hit the inverse-mask 308
    // (client-side RSC navigation stalls on it) — the clean path rewrites
    // straight to the tenant route. Bare tenant root → /dashboard directly.
    const hostSlug =
      customDomainToSlug[normalizeHost(req.headers.get("host")) ?? ""];
    let callbackPath = pathname;
    if (
      hostSlug !== undefined &&
      (pathname === `/${hostSlug}` || pathname.startsWith(`/${hostSlug}/`))
    ) {
      callbackPath = pathname.slice(`/${hostSlug}`.length) || "/dashboard";
      if (callbackPath === "/") callbackPath = "/dashboard";
    }
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  const { role, tenantSlug, tenantId, customView } = session.user;

  // Management-site routes — tenant_manager only
  if (pathname.startsWith("/tm")) {
    if (role !== "tenant_manager") {
      if (tenantSlug) {
        return NextResponse.redirect(
          new URL(`/${tenantSlug}${tenantLandingSuffix(role)}`, req.url),
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
    return passthrough(req);
  }

  // Tenant routes — extract slug from URL and cross-check with session
  const tenantSlugFromUrl = pathname.split("/")[1];
  if (tenantSlugFromUrl && tenantId) {
    if (tenantSlug && tenantSlugFromUrl !== tenantSlug) {
      // On a custom-domain host, a session for a DIFFERENT tenant is invalid
      // here: redirecting to the session's tenant would immediately be
      // re-prefixed with the host's slug and loop forever (e.g. a stale
      // session from a re-seeded demo). Clear the session, go to login.
      const hostSlug =
        customDomainToSlug[normalizeHost(req.headers.get("host")) ?? ""];
      if (hostSlug !== undefined && hostSlug !== tenantSlug) {
        const res = NextResponse.redirect(
          new URL(`/${hostSlug}/login`, req.url),
        );
        res.cookies.delete("authjs.session-token");
        res.cookies.delete("__Secure-authjs.session-token");
        return res;
      }
      // Session tenant doesn't match URL tenant — redirect to correct tenant
      return NextResponse.redirect(
        new URL(`/${tenantSlug}${tenantLandingSuffix(role)}`, req.url),
      );
    }

    // Feature-level deny-by-default gate (surface #2 — see route-feature-map.ts).
    // A custom-role actor's `matrix` is built from the JWT-minted `customView`
    // (view-only, matches how sidebar nav filtering already treats it). A
    // fixed-tier/plain-domain-role actor carries no `matrix` — hasPermission()
    // falls back to that role's DOMAIN_ROLE_PRESETS, so legacy sessions with no
    // `customView` claim are never locked out by this gate.
    const actor: Actor = {
      role: role as UserRole,
      ...(customView && customView.length > 0
        ? {
            matrix: Object.fromEntries(
              customView.map((feature) => [
                feature,
                { view: true, write: false, update: false, delete: false },
              ]),
            ),
          }
        : {}),
    };

    if (!canAccessRouteSegment(actor, pathname)) {
      if (!tenantSlug) {
        // No tenant to redirect to — fall through rather than risk a loop.
        return passthrough(req);
      }
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/dashboard`, req.url),
      );
    }

    return passthrough(req);
  }

  // Signed-in but no tenant context on a tenant-shaped path (e.g. a
  // tenant_manager hitting `/{slug}/...` directly) — send platform staff
  // home, everyone else to the public landing (safe, never the dropped
  // global /admin).
  if (role === "tenant_manager") {
    return NextResponse.redirect(new URL("/tm/tenants", req.url));
  }
  return NextResponse.redirect(new URL("/", req.url));
}

export default auth((req: NextRequest & { auth: unknown }) => {
  // Legacy `/platform` → `/tm` redirect shim (Milestone 3 site-access-tenancy
  // rename). Fires BEFORE the custom-domain masking dance and the auth guard
  // in `route()` so an old bookmark, OAuth callbackUrl, or a stale reverse-proxy
  // path lands on the new `/tm` login/app flow instead of a 404 — anonymous
  // visitors still get bounced to `/tm/login` by `route()` afterwards, same as
  // a direct `/tm` hit today.
  const { pathname: legacyPathname } = req.nextUrl;
  if (legacyPathname === "/platform" || legacyPathname.startsWith("/platform/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/tm" + legacyPathname.slice("/platform".length);
    return NextResponse.redirect(url, 308);
  }

  // Custom-domain masking: if the Host matches a verified custom domain, rewrite
  // INTERNALLY to the tenant's `/<slug>/...` route before auth/route runs. The
  // browser keeps the custom domain in the URL bar. Inert while the map is empty
  // (rewriteTo is always null) — zero behaviour change until a domain is added.
  const { rewriteTo, redirectTo } = resolveTenantRoute({
    host: req.headers.get("host"),
    pathname: req.nextUrl.pathname,
    customDomainToSlug,
  });
  // Inverse masking: a slug-prefixed URL on a custom domain redirects to its
  // clean form (e.g. /demo/dashboard → /dashboard) so the slug never shows.
  // GUARD: Next re-runs middleware on the rewritten URL, so a masking rewrite
  // below would loop back here as a slug-prefixed path — the internal-rewrite
  // marker header distinguishes that second pass from a real browser request
  // (spoofing it only skips a cosmetic redirect; auth is untouched).
  const isInternalRewrite =
    req.headers.get("x-tenant-internal-rewrite") === "1";
  if (redirectTo && !isInternalRewrite && redirectTo !== req.nextUrl.pathname) {
    const url = req.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url, 308);
  }
  if (rewriteTo && rewriteTo !== req.nextUrl.pathname) {
    const url = req.nextUrl.clone();
    url.pathname = rewriteTo;
    const headers = sanitizedHeaders(req);
    headers.set("x-tenant-internal-rewrite", "1");
    return withCsp(NextResponse.rewrite(url, { request: { headers } }));
  }

  return withCsp(route(req));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
