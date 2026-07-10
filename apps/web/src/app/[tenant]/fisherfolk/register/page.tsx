import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
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
    redirect(`/${tenant}/fisherfolk`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Register Fisherfolk
        </h1>
        <p className="text-muted-foreground">
          Search for existing records first, then register a new one. The ID
          number is generated automatically; photo, signature, and category
          assignment are added after the basic record is saved.
        </p>
      </div>
      <DuplicateSearchClient />
    </div>
  );
}
