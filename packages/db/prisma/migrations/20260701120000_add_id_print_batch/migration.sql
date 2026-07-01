-- AddValue: AuditAction.PRINT
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRINT';

-- CreateTable: id_print_batches
CREATE TABLE "id_print_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_type" "IDTemplateType" NOT NULL,
    "printed_by_id" TEXT NOT NULL,
    "printed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_count" INTEGER NOT NULL,
    "summary_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "id_print_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: id_print_batches.tenant_id
CREATE INDEX "id_print_batches_tenant_id_idx" ON "id_print_batches"("tenant_id");

-- CreateIndex: id_print_batches.(tenant_id, printed_at)
CREATE INDEX "id_print_batches_tenant_id_printed_at_idx" ON "id_print_batches"("tenant_id", "printed_at");

-- AddForeignKey: id_print_batches.tenant_id -> tenants.id
ALTER TABLE "id_print_batches" ADD CONSTRAINT "id_print_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: id_print_batches.template_id -> id_templates.id
ALTER TABLE "id_print_batches" ADD CONSTRAINT "id_print_batches_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "id_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: id_print_batches.printed_by_id -> users.id
ALTER TABLE "id_print_batches" ADD CONSTRAINT "id_print_batches_printed_by_id_fkey" FOREIGN KEY ("printed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
