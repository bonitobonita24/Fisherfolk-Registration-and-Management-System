import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { PageHeader } from "@/components/shared";
import { VesselRegistrationFormClient } from "./registration-form-client";

interface VesselRegisterPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function VesselRegisterPage({
  params,
}: VesselRegisterPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (
    role !== "tenant_manager" &&
    role !== "tenant_superadmin" &&
    role !== "tenant_admin" &&
    role !== "encoder"
  ) {
    const { tenant } = await params;
    redirect(`/${tenant}/vessels`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Register Vessel"
        description="Fill in the vessel details. The MFVR number must be unique within this tenant. Link fisherfolk owners after completing the basic record, or select them below."
      />
      <VesselRegistrationFormClient />
    </div>
  );
}
