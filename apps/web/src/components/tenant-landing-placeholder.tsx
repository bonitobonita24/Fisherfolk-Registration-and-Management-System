import Link from "next/link";
import { tenantHref } from "@/lib/tenant-href.server";
import { Button } from "@/components/ui/button";

export interface TenantLandingPlaceholderProps {
  tenantName: string;
  tenantSlug: string;
}

/**
 * Minimal public per-tenant landing placeholder (`/{slug}` root, flag-gated
 * — see lib/tenant-landing.ts). Deliberately NOT a full marketing page: just
 * enough themed content (via [tenant]/layout.tsx's CSS variables) to prove
 * out the routing contract for a future FerryBook-style marketing slot.
 * Reached ONLY when TENANT_LANDING_ENABLED is on AND the visitor is
 * anonymous — see app/[tenant]/page.tsx.
 */
export async function TenantLandingPlaceholder({
  tenantName,
  tenantSlug,
}: TenantLandingPlaceholderProps) {
  const loginHref = await tenantHref(tenantSlug, "/login");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {tenantName}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This is {tenantName}&apos;s public page.
      </p>
      <Button asChild>
        <Link href={loginHref}>Sign in</Link>
      </Button>
    </div>
  );
}
