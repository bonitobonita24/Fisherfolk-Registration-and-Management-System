import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { auth } from "@/server/auth";
import { TemplateEditor } from "./_components/template-editor";

/**
 * Settings → ID Card Template (admin only).
 *
 * One-time admin task: design the ID card template and activate it. The
 * active template is auto-loaded by the ID Generator print flow — encoders
 * never pick a template. One ACTIVE template per tenant per template type
 * (enforced server-side by idTemplate.create/update/setActive).
 */
export default async function IdTemplateSettingsPage({
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
          <h1 className="truncate text-base font-semibold tracking-tight">ID Card Template</h1>
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
              Only administrators can design and activate ID card templates.
              If you need to print IDs, use the{" "}
              <Link
                href={`/${tenant}/id-generator`}
                className="font-medium underline underline-offset-2"
              >
                ID Generator
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 items-center gap-3 pt-4 pb-4">
        <div>
          <h1 className="truncate text-base font-semibold tracking-tight">ID Card Template</h1>
          <p className="text-xs text-muted-foreground">
            Design the ID card template once — the <strong>active</strong>{" "}
            template is automatically used by the{" "}
            <Link
              href={`/${tenant}/id-generator`}
              className="font-medium underline underline-offset-2"
            >
              ID Generator
            </Link>{" "}
            when encoders print IDs. Only one template per type can be active at
            a time.
          </p>
        </div>
      </div>
      <TemplateEditor canManage />
    </div>
  );
}
