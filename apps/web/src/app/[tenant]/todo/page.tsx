import { auth } from "@/server/auth";
import { TodoBoardClient } from "./todo-board-client";

export default async function TodoPage() {
  const session = await auth();
  const role = session?.user.role;
  const canManage = role === "super_admin" || role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ToDo</h1>
          <p className="text-muted-foreground">
            Task management board for tracking registration workflow progress.
          </p>
        </div>
      </div>
      <TodoBoardClient canManage={canManage} />
    </div>
  );
}
