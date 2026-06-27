import type React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@frms/db";
import { auth } from "@/server/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
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
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
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
    <div id="tenant-theme-root" className="flex h-screen overflow-hidden" style={themeVars}>
      <Sidebar tenantSlug={tenant} role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={name ?? "User"} role={role} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
