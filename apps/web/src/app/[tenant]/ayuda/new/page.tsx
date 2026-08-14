import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { PageHeader } from "@/components/shared";
import { AyudaFormClient } from "./ayuda-form-client";

interface NewAyudaProgramPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function NewAyudaProgramPage({
  params,
}: NewAyudaProgramPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (role !== "tenant_manager" && role !== "tenant_superadmin" && role !== "tenant_admin") {
    const { tenant } = await params;
    redirect(`/${tenant}/ayuda`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Ayuda Program"
        description="Create an assistance program. It starts as a draft until you publish it."
      />
      <AyudaFormClient />
    </div>
  );
}
