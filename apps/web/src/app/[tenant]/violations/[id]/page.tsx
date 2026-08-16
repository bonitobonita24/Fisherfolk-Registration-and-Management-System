import { auth } from "@/server/auth";
import { canManage as canManageRole } from "@/lib/rbac/can-manage";
import { ViolationDetailClient } from "./violation-detail-client";

export default async function ViolationDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage = canManageRole(role);
  return (
    <div className="space-y-6">
      <ViolationDetailClient id={id} canManage={canManage} />
    </div>
  );
}
