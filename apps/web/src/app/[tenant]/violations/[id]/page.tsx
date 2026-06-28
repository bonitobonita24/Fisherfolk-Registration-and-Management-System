import { auth } from "@/server/auth";
import { ViolationDetailClient } from "./violation-detail-client";

export default async function ViolationDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage = role === "super_admin" || role === "admin";
  return (
    <div className="space-y-6">
      <ViolationDetailClient id={id} canManage={canManage} />
    </div>
  );
}
