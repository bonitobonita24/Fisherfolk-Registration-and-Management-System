import Link from "next/link";
import { Settings } from "lucide-react";

import { auth } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { IdGeneratorClient } from "./_components/id-generator-client";

export default async function IdGeneratorPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin =
    role === "tenant_manager" || role === "tenant_superadmin" || role === "tenant_admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ID Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Print fisherfolk ID cards using the active template — pick up to 4,
            preview, then confirm.
          </p>
        </div>
        {isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/${tenant}/settings/id-template`}>
              <Settings className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Manage ID template
            </Link>
          </Button>
        )}
      </div>
      <IdGeneratorClient />
    </div>
  );
}
