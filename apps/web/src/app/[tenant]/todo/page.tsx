import { auth } from "@/server/auth";
import { canManage as canManageRole } from "@/lib/rbac/can-manage";
import { PageHeader } from "@/components/shared";
import { TodoBoardClient } from "./todo-board-client";

export default async function TodoPage() {
  const session = await auth();
  const role = session?.user.role;
  const canManage = canManageRole(role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ToDo"
        description="Task management board for tracking registration workflow progress."
      />
      <TodoBoardClient canManage={canManage} />
    </div>
  );
}
