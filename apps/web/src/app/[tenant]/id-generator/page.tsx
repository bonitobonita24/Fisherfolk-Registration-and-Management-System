import Link from "next/link";
import { Settings } from "lucide-react";

import { auth } from "@/server/auth";
import { tenantHref } from "@/lib/tenant-href.server";
import { Button } from "@/components/ui/button";
import { IdGeneratorClient } from "./_components/id-generator-client";

export default async function IdGeneratorPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const idTemplateHref = await tenantHref(tenant, "/settings/id-template");
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin =
    role === "tenant_manager" || role === "tenant_superadmin" || role === "tenant_admin";

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 flex-wrap items-start gap-3 pt-4 pb-4">
        <div>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">ID Generator</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Print fisherfolk ID cards using the active template — pick up to 4,
            preview, then confirm.
          </p>
        </div>
        {isAdmin && (
          <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
            <Link href={idTemplateHref}>
              <Settings className="mr-1.5 size-4" aria-hidden="true" />
              Manage ID template
            </Link>
          </Button>
        )}
      </div>
      <IdGeneratorClient />
    </div>
  );
}
