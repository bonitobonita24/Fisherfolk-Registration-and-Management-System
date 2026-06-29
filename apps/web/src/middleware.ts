import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/server/auth/edge";
import {
  buildContentSecurityPolicy,
  storageOriginFromEnv,
} from "@/lib/security-headers";
import { parseCustomDomainMap, resolveTenantRoute } from "@/lib/tenant-routing";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/api/trpc"];

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
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
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
    };
  } | null;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role, tenantSlug, tenantId } = session.user;

  if (pathname === "/") {
    if (role === "super_admin") {
      return NextResponse.redirect(new URL("/platform/tenants", req.url));
    }
    if (tenantSlug) {
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/dashboard`, req.url),
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Platform routes — super_admin only
  if (pathname.startsWith("/platform")) {
    if (role !== "super_admin") {
      return NextResponse.redirect(new URL("/login", req.url));
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
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export default auth((req: NextRequest & { auth: unknown }) => {
  // Custom-domain masking: if the Host matches a verified custom domain, rewrite
  // INTERNALLY to the tenant's `/<slug>/...` route before auth/route runs. The
  // browser keeps the custom domain in the URL bar. Inert while the map is empty
  // (rewriteTo is always null) — zero behaviour change until a domain is added.
  const { rewriteTo } = resolveTenantRoute({
    host: req.headers.get("host"),
    pathname: req.nextUrl.pathname,
    customDomainToSlug,
  });
  if (rewriteTo && rewriteTo !== req.nextUrl.pathname) {
    const url = req.nextUrl.clone();
    url.pathname = rewriteTo;
    return withCsp(NextResponse.rewrite(url));
  }

  return withCsp(route(req));
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
