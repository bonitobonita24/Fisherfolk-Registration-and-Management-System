import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { prisma } from "@frms/db";
import { auth } from "@/server/auth";

import { RoleBuilderClient } from "./role-builder-client";

/**
 * Settings → Role Builder (tenant_superadmin / tenant_manager only).
 *
 * PD-005 Chunk 7 — the data-driven custom-role permission-matrix UI
 * (tenant-rbac-standard.md §4). Guarded per the same pattern as the ID
 * Template settings page: unauthorized visitors see an in-page notice
 * instead of the tool, rather than a redirect.
 */
export default async function RoleBuilderPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "tenant_manager" || role === "tenant_superadmin";

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
          <h1 className="truncate text-base font-semibold tracking-tight">Role Builder</h1>
        </div>
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm"
        >
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-destructive">
              Administrator access required
            </p>
            <p className="mt-1 text-muted-foreground">
              Only the tenant owner (Tenant Superadmin) can build and assign
              custom roles. Return to{" "}
              <Link
                href={`/${tenant}/settings`}
                className="font-medium underline underline-offset-2"
              >
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tenantRecord = await prisma.tenant.findUnique({
    where: { slug: tenant },
    select: { id: true },
  });

  if (!tenantRecord) {
    return (
      <div className="space-y-6">
        <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
          <h1 className="truncate text-base font-semibold tracking-tight">Role Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tenant not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
        <div>
          <h1 className="truncate text-base font-semibold tracking-tight">Role Builder</h1>
          <p className="text-xs text-muted-foreground">
            Create custom roles with a per-feature permission matrix, and
            assign them to Encoder, Viewer, and Bantay Dagat users.
          </p>
        </div>
      </div>
      <RoleBuilderClient tenantId={tenantRecord.id} />
    </div>
  );
}
