import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

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

  return (
    <div className="flex h-screen overflow-hidden">
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
