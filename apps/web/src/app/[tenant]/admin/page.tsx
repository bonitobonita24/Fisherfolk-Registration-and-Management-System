import { redirect } from "next/navigation";
import { tenantHref } from "@/lib/tenant-href.server";

interface TenantAdminPageProps {
  params: Promise<{ tenant: string }>;
}

/**
 * Admin-tier post-login landing (Milestone 4a — site-access-tenancy standard
 * §3): `tenant_superadmin`/`tenant_admin` land here after sign-in
 * (middleware.ts `tenantLandingSuffix`). The URL contract exists now so only
 * admin-tier roles ever reach `/{slug}/admin` — the real dashboard stays the
 * actual home for every tier; a dedicated admin-only landing view is a
 * follow-up (M4b+), not part of this milestone.
 */
export default async function TenantAdminPage({ params }: TenantAdminPageProps) {
  const { tenant } = await params;
  redirect(await tenantHref(tenant, "/dashboard"));
}
