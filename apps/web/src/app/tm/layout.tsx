import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { resolvePlatformRoleLabel } from "@/server/rbac/platform-access";
import { PlatformHeaderActions } from "./platform-header-actions";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default async function PlatformLayout({
  children,
}: PlatformLayoutProps) {
  // GUARD EXCEPTION (Milestone 4a — site-access-tenancy standard §2):
  // `/tm/login` must render pre-auth — same mechanism as `[tenant]/layout.tsx`.
  const hdrs = await headers();
  if (hdrs.get("x-tenant-login-route") === "1") {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/tm/login");
  }

  if (session.user.role !== "tenant_manager") {
    redirect(`/${session.user.tenantSlug}/dashboard`);
  }

  // Label the header badge with the account's actual platform tier (BILLING /
  // TECH SUPPORT / Admin) instead of a hardcoded "super admin" — shares the
  // request-cached platform-actor resolve, no extra DB round trip.
  const roleLabel = await resolvePlatformRoleLabel(session.user.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <span className="text-base font-semibold tracking-tight text-foreground">FRMS Platform</span>
        <PlatformHeaderActions username={session.user.username} roleLabel={roleLabel} />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
