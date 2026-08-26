import { redirect } from "next/navigation";
import { tenantHref } from "@/lib/tenant-href.server";

interface KanbanRedirectPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function KanbanRedirectPage({
  params,
}: KanbanRedirectPageProps) {
  const { tenant } = await params;
  redirect(await tenantHref(tenant, "/todo"));
}
