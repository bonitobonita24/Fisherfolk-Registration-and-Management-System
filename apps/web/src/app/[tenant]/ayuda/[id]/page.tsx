import { auth } from "@/server/auth";
import { AyudaDetailClient } from "./ayuda-detail-client";

export default async function AyudaProgramDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user.role;
  const canManage =
    role === "tenant_manager" || role === "tenant_superadmin" || role === "tenant_admin";
  return (
    <div className="space-y-6">
      <AyudaDetailClient id={id} canManage={canManage} />
    </div>
  );
}
