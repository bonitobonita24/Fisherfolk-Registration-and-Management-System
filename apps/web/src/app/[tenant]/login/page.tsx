import type React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@frms/db";
import { LoginForm } from "@/components/login-form";
import { hexToHslTriplet, readableForeground } from "@/lib/theme/color";

interface TenantLoginPageProps {
  params: Promise<{ tenant: string }>;
}

/**
 * Per-tenant sign-in FORM (Milestone 4a — site-access-tenancy standard §3).
 * Reachable pre-auth as a GUARD EXCEPTION in both middleware.ts
 * (`loginRouteSlug`) and `[tenant]/layout.tsx` (the `x-tenant-login-route`
 * header check), so it renders standalone — NOT wrapped in the authenticated
 * `AppShell`. Themed with the tenant's own primary/secondary colors, same as
 * the authenticated tenant layout, so the sign-in page already looks like
 * the tenant's app before the user is even signed in.
 */
export default async function TenantLoginPage({ params }: TenantLoginPageProps) {
  const { tenant } = await params;

  const t = await prisma.tenant.findUnique({
    where: { slug: tenant },
    select: { name: true, primaryColor: true, secondaryColor: true },
  });

  if (!t) notFound();

  const themeVars = {
    "--primary": hexToHslTriplet(t.primaryColor),
    "--primary-foreground": readableForeground(t.primaryColor),
    "--ring": hexToHslTriplet(t.primaryColor),
    "--secondary": hexToHslTriplet(t.secondaryColor),
    "--secondary-foreground": readableForeground(t.secondaryColor),
  } as React.CSSProperties;

  return (
    <div style={themeVars}>
      <LoginForm title={t.name} subtitle="Sign in" />
    </div>
  );
}
