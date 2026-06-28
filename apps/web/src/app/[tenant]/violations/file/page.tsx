import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { ViolationFormClient } from "./violation-form-client";

interface FileViolationPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function FileViolationPage({
  params,
}: FileViolationPageProps) {
  const session = await auth();
  const role = session?.user.role;

  if (role !== "super_admin" && role !== "admin") {
    const { tenant } = await params;
    redirect(`/${tenant}/violations`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">File Violation</h1>
        <p className="text-muted-foreground">
          Record a new fishery violation against a fisherfolk, a vessel, or
          both.
        </p>
      </div>
      <ViolationFormClient />
    </div>
  );
}
