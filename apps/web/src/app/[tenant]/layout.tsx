import type React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@frms/db";
import { auth } from "@/server/auth";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { hexToHslTriplet, readableForeground } from "@/lib/theme/color";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  // GUARD EXCEPTION (Milestone 4a — site-access-tenancy standard §3):
  // `/{tenant}/login` must render pre-auth. middleware.ts marks a request
  // that matched its `loginRouteSlug` check with this header — an
  // unauthenticated visitor never reaches this layout's auth redirect below,
  // and the login page renders standalone (no AppShell, which needs a real
  // session's name/role/tenantSlug).
  const hdrs = await headers();
  if (hdrs.get("x-tenant-login-route") === "1") {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    const { tenant: tenantForRedirect } = await params;
    redirect(`/${tenantForRedirect}/login`);
  }

  const { tenant } = await params;
  const { name, role, tenantSlug } = session.user;

  if (tenantSlug !== tenant) {
    redirect(`/${tenantSlug}/dashboard`);
  }

  const t = await prisma.tenant.findUnique({
    where: { slug: tenant },
    select: { primaryColor: true, secondaryColor: true },
  });

  const themeVars = t
    ? ({
        "--primary": hexToHslTriplet(t.primaryColor),
        "--primary-foreground": readableForeground(t.primaryColor),
        "--ring": hexToHslTriplet(t.primaryColor),
        "--secondary": hexToHslTriplet(t.secondaryColor),
        "--secondary-foreground": readableForeground(t.secondaryColor),
      } as React.CSSProperties)
    : undefined;

  return (
    <div id="tenant-theme-root" className="h-screen overflow-hidden" style={themeVars}>
      <AppShell tenantSlug={tenant} role={role} userName={name ?? "User"}>
        {children}
      </AppShell>
      <Toaster />
    </div>
  );
}
