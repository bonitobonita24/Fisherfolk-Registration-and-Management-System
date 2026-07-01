-- AddColumn: Fisherfolk.id_released_at
ALTER TABLE "fisherfolk" ADD COLUMN "id_released_at" TIMESTAMP(3);

-- AddColumn: Fisherfolk.id_released_by_id
ALTER TABLE "fisherfolk" ADD COLUMN "id_released_by_id" TEXT;

-- AddForeignKey: fisherfolk.id_released_by_id -> users.id
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_id_released_by_id_fkey" FOREIGN KEY ("id_released_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: registration_renewals
CREATE TABLE "registration_renewals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fisherfolk_id" TEXT NOT NULL,
    "renewal_year" INTEGER NOT NULL,
    "renewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewed_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_renewals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registration_renewals_fisherfolk_id_renewal_year_key" UNIQUE ("fisherfolk_id", "renewal_year")
);

-- CreateIndex: registration_renewals.tenant_id
CREATE INDEX "registration_renewals_tenant_id_idx" ON "registration_renewals"("tenant_id");

-- CreateIndex: registration_renewals.fisherfolk_id
CREATE INDEX "registration_renewals_fisherfolk_id_idx" ON "registration_renewals"("fisherfolk_id");

-- AddForeignKey: registration_renewals.tenant_id -> tenants.id
ALTER TABLE "registration_renewals" ADD CONSTRAINT "registration_renewals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: registration_renewals.fisherfolk_id -> fisherfolk.id (CASCADE)
ALTER TABLE "registration_renewals" ADD CONSTRAINT "registration_renewals_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: registration_renewals.renewed_by_id -> users.id
ALTER TABLE "registration_renewals" ADD CONSTRAINT "registration_renewals_renewed_by_id_fkey" FOREIGN KEY ("renewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
