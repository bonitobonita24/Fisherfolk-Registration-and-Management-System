-- AlterTable
ALTER TABLE "ayuda_uploads" ADD COLUMN     "mime_type" TEXT;

-- AlterTable
ALTER TABLE "violations" ADD COLUMN     "violator_name" TEXT;

-- CreateTable
CREATE TABLE "violation_attachments" (
    "id" TEXT NOT NULL,
    "violation_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "violation_attachments_violation_id_idx" ON "violation_attachments"("violation_id");

-- CreateIndex
CREATE INDEX "kanban_attachments_task_id_idx" ON "kanban_attachments"("task_id");

-- AddForeignKey
ALTER TABLE "violation_attachments" ADD CONSTRAINT "violation_attachments_violation_id_fkey" FOREIGN KEY ("violation_id") REFERENCES "violations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_attachments" ADD CONSTRAINT "violation_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_attachments" ADD CONSTRAINT "kanban_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kanban_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_attachments" ADD CONSTRAINT "kanban_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
