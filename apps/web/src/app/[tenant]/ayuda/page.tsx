import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/server/auth";
import { canManage as canManageRole } from "@/lib/rbac/can-manage";
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
  const canManage = canManageRole(role);

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
