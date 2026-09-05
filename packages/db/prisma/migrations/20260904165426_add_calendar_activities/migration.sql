-- CreateEnum
CREATE TYPE "KanbanTaskKind" AS ENUM ('TASK', 'EVENT');

-- CreateEnum
CREATE TYPE "TaskAudience" AS ENUM ('PERSONAL', 'SHARED', 'ANNOUNCED');

-- AlterTable
ALTER TABLE "kanban_tasks"
  ADD COLUMN "created_by_id" TEXT,
  ADD COLUMN "start_at" TIMESTAMP(3),
  ADD COLUMN "end_at" TIMESTAMP(3),
  ADD COLUMN "all_day" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "kind" "KanbanTaskKind" NOT NULL DEFAULT 'TASK',
  ADD COLUMN "audience" "TaskAudience" NOT NULL DEFAULT 'PERSONAL';

-- CreateTable
CREATE TABLE "kanban_task_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_task_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kanban_task_shares_task_id_user_id_key" ON "kanban_task_shares"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "kanban_task_shares_tenant_id_user_id_idx" ON "kanban_task_shares"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_tenant_id_start_at_idx" ON "kanban_tasks"("tenant_id", "start_at");

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_task_shares" ADD CONSTRAINT "kanban_task_shares_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_task_shares" ADD CONSTRAINT "kanban_task_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_task_shares" ADD CONSTRAINT "kanban_task_shares_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
