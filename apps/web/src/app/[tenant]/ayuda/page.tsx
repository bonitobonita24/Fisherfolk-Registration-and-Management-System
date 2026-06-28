import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { AyudaListClient } from "./ayuda-list-client";

interface AyudaPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function AyudaPage({ params }: AyudaPageProps) {
  const { tenant } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage = role === "super_admin" || role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ayuda Programs</h1>
          <p className="text-muted-foreground">
            Manage assistance programs, beneficiary verification, and distribution tracking.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={`/${tenant}/ayuda/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Program
            </Link>
          </Button>
        )}
      </div>
      <AyudaListClient />
    </div>
  );
}
