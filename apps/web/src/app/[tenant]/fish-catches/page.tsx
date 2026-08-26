import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/server/auth";
import { tenantHref } from "@/lib/tenant-href.server";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { FishCatchesListClient } from "./fish-catches-list-client";

interface FishCatchesPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function FishCatchesPage({
  params,
}: FishCatchesPageProps) {
  const { tenant } = await params;
  const fishCatchesRegisterHref = await tenantHref(tenant, "/fish-catches/register");
  const session = await auth();
  const role = session?.user.role;
  const canRegister =
    role === "tenant_manager" ||
    role === "tenant_superadmin" ||
    role === "tenant_admin" ||
    role === "encoder";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fish Catches"
        description="Record and monitor fish catch landings by fisherfolk, vessel, and gear type."
        action={
          canRegister ? (
            <Button asChild>
              <Link href={fishCatchesRegisterHref}>
                <Plus className="mr-2 h-4 w-4" />
                Record Catch
              </Link>
            </Button>
          ) : undefined
        }
      />
      <FishCatchesListClient />
    </div>
  );
}
