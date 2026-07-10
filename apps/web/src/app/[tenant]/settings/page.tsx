import Link from "next/link";
import { ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { prisma } from "@frms/db";

import { auth } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSettings } from "./theme-settings";
import { BarangayAliases } from "./barangay-aliases";
import { AnnualResetCard } from "./annual-reset-card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
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
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="text-muted-foreground">
        Manage tenant settings including categories, violation types, and email configuration.
      </p>

      {/* ID Card Template — admin design surface (one-time task) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ID Card Template
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Design and activate the ID card template used by the ID Generator.
            The active template is loaded automatically when encoders print IDs.
          </p>
          <Link
            href={`/${tenant}/settings/id-template`}
            className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2"
          >
            Open template designer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>

      {/* Role Builder — data-driven custom-role permission matrix, owner-only */}
      {isAdmin ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Role Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Create custom roles with a per-feature permission matrix and
              assign them to Encoder, Viewer, and Bantay Dagat users.
            </p>
            <Link
              href={`/${tenant}/settings/roles`}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2"
            >
              Open Role Builder
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <ThemeSettings />
      <BarangayAliases />

      {/* Administrative Actions — danger zone, admin-only, placed last */}
      {isAdmin && tenantRecord ? (
        <AnnualResetCard currentYear={tenantRecord.currentRegistrationYear} />
      ) : null}
    </div>
  );
}
