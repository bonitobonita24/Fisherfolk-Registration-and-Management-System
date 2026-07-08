-- CreateEnum
CREATE TYPE "AyudaDistributionUnit" AS ENUM ('FISHERFOLK', 'HOUSEHOLD');

-- AlterTable
ALTER TABLE "fisherfolk" ADD COLUMN     "household_id" TEXT;

-- AlterTable
ALTER TABLE "ayuda_programs" ADD COLUMN     "distribution_unit" "AyudaDistributionUnit" NOT NULL DEFAULT 'FISHERFOLK';

-- AlterTable
ALTER TABLE "ayuda_beneficiaries" ADD COLUMN     "household_id" TEXT;

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "household_number" TEXT NOT NULL,
    "head_id" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "households_head_id_key" ON "households"("head_id");

-- CreateIndex
CREATE INDEX "households_tenant_id_idx" ON "households"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "households_tenant_id_household_number_key" ON "households"("tenant_id", "household_number");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_household_id_idx" ON "fisherfolk"("tenant_id", "household_id");

-- CreateIndex
CREATE INDEX "ayuda_beneficiaries_household_id_idx" ON "ayuda_beneficiaries"("household_id");

-- AddForeignKey
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
