import Link from "next/link";
import { Plus } from "lucide-react";

import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared";
import { ViolationsListClient } from "./violations-list-client";

interface ViolationsPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function ViolationsPage({ params }: ViolationsPageProps) {
  const { tenant } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage = role === "super_admin" || role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Violations"
        description="Track and manage fishery violations, penalties, and resolutions."
        action={
          canManage && (
            <Button asChild>
              <Link href={`/${tenant}/violations/file`}>
                <Plus className="mr-2 h-4 w-4" />
                File Violation
              </Link>
            </Button>
          )
        }
      />
      <ViolationsListClient />
    </div>
  );
}
