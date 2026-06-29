-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "custom_domain" TEXT,
ADD COLUMN     "domain_verified_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");
