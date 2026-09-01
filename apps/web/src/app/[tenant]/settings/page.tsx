import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@frms/db";

import { auth } from "@/server/auth";
import { tenantHref } from "@/lib/tenant-href.server";
import { FormSection, PageHeader } from "@/components/shared";
import { ThemeSettings } from "./theme-settings";
import { BarangayAliases } from "./barangay-aliases";
import { AnnualResetCard } from "./annual-reset-card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const idTemplateHref = await tenantHref(tenant, "/settings/id-template");
  const rolesHref = await tenantHref(tenant, "/settings/roles");
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = role === "tenant_manager" || role === "tenant_superadmin";

  const tenantRecord = isAdmin
    ? await prisma.tenant.findUnique({
        where: { slug: tenant },
        select: { currentRegistrationYear: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage tenant settings including categories, violation types, and email configuration."
      />

      {/* ID Card Template — admin design surface (one-time task) */}
      <FormSection title="ID Card Template">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Design and activate the ID card template used by the ID Generator.
            The active template is loaded automatically when encoders print IDs.
          </p>
          <Link
            href={idTemplateHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2"
          >
            Open template designer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </FormSection>

      {/* Role Builder — data-driven custom-role permission matrix, owner-only */}
      {isAdmin ? (
        <FormSection title="Role Builder">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Create custom roles with a per-feature permission matrix and
              assign them to Encoder, Viewer, and Bantay Dagat users.
            </p>
            <Link
              href={rolesHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2"
            >
              Open Role Builder
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </FormSection>
      ) : null}

      <ThemeSettings />
      <BarangayAliases />

      {/* Administrative Actions — danger zone, admin-only, placed last */}
      {isAdmin && tenantRecord ? (
        <AnnualResetCard />
      ) : null}
    </div>
  );
}
