import { auth } from "@/server/auth";
import { NoteDetailClient } from "./note-detail-client";

const ADMIN_ROLES = ["tenant_manager", "tenant_superadmin", "tenant_admin"];

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user.id ?? null;
  const isAdmin = ADMIN_ROLES.includes(session?.user.role ?? "");

  return (
    <div className="space-y-6">
      <NoteDetailClient id={id} currentUserId={currentUserId} isAdmin={isAdmin} />
    </div>
  );
}
