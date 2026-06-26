-- CreateEnum
CREATE TYPE "ImportBatchMode" AS ENUM ('FULL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'VALIDATING', 'READY', 'IMPORTING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "barangay_aliases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_label" TEXT NOT NULL,
    "to_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barangay_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mode" "ImportBatchMode" NOT NULL DEFAULT 'FULL',
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "warning_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "photos_matched" INTEGER NOT NULL DEFAULT 0,
    "signatures_matched" INTEGER NOT NULL DEFAULT 0,
    "last_processed_row" INTEGER NOT NULL DEFAULT 0,
    "report" JSONB,
    "error_log" JSONB,
    "backup_path" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barangay_aliases_tenant_id_idx" ON "barangay_aliases"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "barangay_aliases_tenant_id_from_label_key" ON "barangay_aliases"("tenant_id", "from_label");

-- CreateIndex
CREATE INDEX "import_batches_tenant_id_idx" ON "import_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "import_batches_tenant_id_status_idx" ON "import_batches"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "barangay_aliases" ADD CONSTRAINT "barangay_aliases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
