import { redirect } from "next/navigation";

interface KanbanRedirectPageProps {
  params: Promise<{ tenant: string }>;
}

export default async function KanbanRedirectPage({
  params,
}: KanbanRedirectPageProps) {
  const { tenant } = await params;
  redirect(`/${tenant}/todo`);
}
