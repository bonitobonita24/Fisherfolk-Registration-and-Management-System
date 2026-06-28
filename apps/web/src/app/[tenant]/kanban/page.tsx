import { KanbanBoardClient } from "./kanban-board-client";

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kanban</h1>
        <p className="text-muted-foreground">
          Task management board for tracking registration workflow progress.
        </p>
      </div>
      <KanbanBoardClient />
    </div>
  );
}
