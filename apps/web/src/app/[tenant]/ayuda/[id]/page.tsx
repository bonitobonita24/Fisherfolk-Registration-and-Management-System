import { auth } from "@/server/auth";
import { canManage as canManageRole } from "@/lib/rbac/can-manage";
import { AyudaDetailClient } from "./ayuda-detail-client";

export default async function AyudaProgramDetailPage({
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
      <AyudaDetailClient id={id} canManage={canManage} />
    </div>
  );
}
