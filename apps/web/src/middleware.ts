import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth/edge";
import {
  buildContentSecurityPolicy,
  storageOriginFromEnv,
} from "@/lib/security-headers";
import { parseCustomDomainMap, resolveTenantRoute } from "@/lib/tenant-routing";
import { canAccessRouteSegment } from "@/lib/route-feature-map";
import type { Actor, FeatureKey } from "@frms/shared/rbac";
import type { UserRole } from "@frms/shared/types";

// `/api/media` self-authenticates in its route handler (requireRouteAuth +
// tenant-scoped MediaObject lookup + rate-limit + egress audit — see
// app/api/media/route.ts), exactly like `/api/trpc`. It must bypass the tenant
// URL-routing below: its path second segment is "media", not a tenant slug, so
// without this an authed request would 307-redirect to /<slug>/dashboard and
// every image/signature/attachment would fail to load.
// `/admin` is the staff/administrator sign-in (relocated from `/login`, which
// is retained as a silent redirect). `/` is the public marketing landing —
// handled explicitly in route() so anonymous visitors see it instead of being
// bounced to sign-in, while authenticated users are still routed to their app.
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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // The root `/` is the PUBLIC marketing landing. Anonymous visitors see it;
  // authenticated users are forwarded into their app (platform or tenant).
  if (pathname === "/") {
    const user = session?.user;
    if (!user) {
      return NextResponse.next();
    }
    if (user.role === "tenant_manager") {
      return NextResponse.redirect(new URL("/platform/tenants", req.url));
    }
    if (user.tenantSlug) {
      return NextResponse.redirect(
        new URL(`/${user.tenantSlug}/dashboard`, req.url),
      );
    }
    // Authenticated but no tenant context — fall through to the landing.
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/admin", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role, tenantSlug, tenantId, customView } = session.user;

  // Platform routes — tenant_manager only
  if (pathname.startsWith("/platform")) {
    if (role !== "tenant_manager") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // Tenant routes — extract slug from URL and cross-check with session
  const tenantSlugFromUrl = pathname.split("/")[1];
  if (tenantSlugFromUrl && tenantId) {
    if (tenantSlug && tenantSlugFromUrl !== tenantSlug) {
      // Session tenant doesn't match URL tenant — redirect to correct tenant
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/dashboard`, req.url),
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
        return NextResponse.next();
      }
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/dashboard`, req.url),
      );
    }

    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin", req.url));
}

export default auth((req: NextRequest & { auth: unknown }) => {
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
    const headers = new Headers(req.headers);
    headers.set("x-tenant-internal-rewrite", "1");
    return withCsp(NextResponse.rewrite(url, { request: { headers } }));
  }

  return withCsp(route(req));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
