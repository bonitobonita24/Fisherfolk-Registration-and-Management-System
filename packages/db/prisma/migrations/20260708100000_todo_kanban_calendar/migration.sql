-- AlterTable
ALTER TABLE "kanban_tasks" ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "source_entity_type" TEXT,
ADD COLUMN     "source_entity_id" TEXT;

-- CreateIndex
CREATE INDEX "kanban_tasks_tenant_id_due_date_idx" ON "kanban_tasks"("tenant_id", "due_date");
