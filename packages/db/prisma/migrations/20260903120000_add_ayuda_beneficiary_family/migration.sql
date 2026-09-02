-- AlterTable
ALTER TABLE "ayuda_beneficiaries" ADD COLUMN     "family_id" TEXT;

-- CreateIndex
CREATE INDEX "ayuda_beneficiaries_family_id_idx" ON "ayuda_beneficiaries"("family_id");

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
