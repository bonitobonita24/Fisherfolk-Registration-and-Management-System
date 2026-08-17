import { auth } from "@/server/auth";
import { canManage as canManageRole } from "@/lib/rbac/can-manage";
import { TodoBoardClient } from "./todo-board-client";

export default async function TodoPage() {
  const session = await auth();
  const role = session?.user.role;
  const canManage = canManageRole(role);

  return (
    <div className="space-y-6">
      <div className="flex shrink-0 flex-col gap-1 pt-4 pb-4">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground">ToDo</h1>
        <p className="text-xs text-muted-foreground">
          Task management board for tracking registration workflow progress.
        </p>
      </div>
      <TodoBoardClient canManage={canManage} />
    </div>
  );
}
