import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { AyudaListClient } from "./ayuda-list-client";

interface AyudaPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function AyudaPage({ params }: AyudaPageProps) {
  const { tenant } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage =
    role === "tenant_manager" || role === "tenant_superadmin" || role === "tenant_admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayuda Programs"
        description="Manage assistance programs, beneficiary verification, and distribution tracking."
        action={
          canManage ? (
            <Button asChild>
              <Link href={`/${tenant}/ayuda/new`}>
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Link>
            </Button>
          ) : undefined
        }
      />
      <AyudaListClient />
    </div>
  );
}
