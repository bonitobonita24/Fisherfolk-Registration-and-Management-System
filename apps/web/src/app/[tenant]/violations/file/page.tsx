import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { PageHeader } from "@/components/shared";
import { tenantHref } from "@/lib/tenant-href.server";
import { ViolationFormClient } from "./violation-form-client";

interface FileViolationPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function FileViolationPage({
  params,
}: FileViolationPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (
    role !== "tenant_manager" &&
    role !== "tenant_superadmin" &&
    role !== "tenant_admin"
  ) {
    const { tenant } = await params;
    redirect(await tenantHref(tenant, "/violations"));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Violation"
        description="Record a new fishery violation against a fisherfolk, a vessel, or both."
      />
      <ViolationFormClient />
    </div>
  );
}
