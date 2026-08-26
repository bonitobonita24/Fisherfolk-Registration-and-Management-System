import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { tenantHref } from "@/lib/tenant-href.server";
import { DuplicateSearchClient } from "./duplicate-search-client";

interface RegisterPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function FisherfolkRegisterPage({
  params,
}: RegisterPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (
    role !== "tenant_manager" &&
    role !== "tenant_superadmin" &&
    role !== "tenant_admin" &&
    role !== "encoder"
  ) {
    const { tenant } = await params;
    redirect(await tenantHref(tenant, "/fisherfolk"));
  }

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">
            Register Fisherfolk
          </h1>
          <p className="text-xs text-muted-foreground">
            Search for existing records first, then register a new one. The ID
            number is generated automatically; photo, signature, and category
            assignment are added after the basic record is saved.
          </p>
        </div>
      </div>
      <DuplicateSearchClient />
    </div>
  );
}
