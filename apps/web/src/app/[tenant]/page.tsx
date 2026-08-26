import { notFound, redirect } from "next/navigation";
import { prisma } from "@frms/db";
import { auth } from "@/server/auth";
import { isTenantLandingEnabled } from "@/lib/tenant-landing";
import { tenantHref } from "@/lib/tenant-href.server";
import { TenantLandingPlaceholder } from "@/components/tenant-landing-placeholder";

interface TenantRootPageProps {
  params: Promise<{ tenant: string }>;
}

/**
 * Bare tenant root (`/<slug>`).
 *
 * FLAG OFF (default — FRMS): nothing renders here; the workspace lives at
 * `/<slug>/dashboard`. Reached via custom-domain masking (the domain root
 * rewrites to `/<slug>`), a hand-typed bare-slug URL, or an authenticated
 * visit (middleware already sent an anonymous visitor to `/<slug>/login`
 * before this page ever runs) — current behaviour, unchanged.
 *
 * FLAG ON (opt-in per-tenant public landing — see lib/tenant-landing.ts):
 * middleware treats this EXACT path as public for an anonymous visitor and
 * marks the request so `[tenant]/layout.tsx` skips its auth guard; an
 * already-authenticated visitor is redirected straight to their own tenant
 * dashboard by middleware and never reaches this component at all. The
 * session re-check below is defense in depth only (mirrors the `/{slug}/login`
 * page's own pattern), not the primary gate.
 */
export default async function TenantRootPage({ params }: TenantRootPageProps) {
  const { tenant } = await params;

  if (!isTenantLandingEnabled()) {
    redirect(await tenantHref(tenant, "/dashboard"));
  }

  const session = await auth();
  if (session?.user) {
    redirect(await tenantHref(session.user.tenantSlug ?? tenant, "/dashboard"));
  }

  const t = await prisma.tenant.findUnique({
    where: { slug: tenant },
    select: { name: true },
  });
  if (!t) notFound();

  return <TenantLandingPlaceholder tenantName={t.name} tenantSlug={tenant} />;
}
