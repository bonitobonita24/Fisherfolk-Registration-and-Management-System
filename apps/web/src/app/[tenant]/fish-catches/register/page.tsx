import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { FishCatchFormClient } from "./fish-catch-form-client";

interface FishCatchRegisterPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function FishCatchRegisterPage({
  params,
}: FishCatchRegisterPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (
    role !== "tenant_manager" &&
    role !== "tenant_superadmin" &&
    role !== "tenant_admin" &&
    role !== "encoder"
  ) {
    const { tenant } = await params;
    redirect(`/${tenant}/fish-catches`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Record Fish Catch</h1>
        <p className="text-muted-foreground">
          Log a fish catch landing — fisherfolk, gear, effort, and species
          composition.
        </p>
      </div>
      <FishCatchFormClient />
    </div>
  );
}
