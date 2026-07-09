import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { PlatformHeaderActions } from "./platform-header-actions";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default async function PlatformLayout({
  children,
}: PlatformLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "super_admin") {
    redirect(`/${session.user.tenantSlug}/dashboard`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <span className="text-lg font-bold text-foreground">FRMS Platform</span>
        <PlatformHeaderActions username={session.user.username} />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
