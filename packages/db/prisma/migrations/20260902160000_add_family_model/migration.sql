-- AlterTable
ALTER TABLE "fisherfolk" ADD COLUMN     "family_id" TEXT;

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "family_number" TEXT NOT NULL,
    "head_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "families_head_id_key" ON "families"("head_id");

-- CreateIndex
CREATE INDEX "families_tenant_id_idx" ON "families"("tenant_id");

-- CreateIndex
CREATE INDEX "families_household_id_idx" ON "families"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "families_household_id_family_number_key" ON "families"("household_id", "family_number");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_family_id_idx" ON "fisherfolk"("tenant_id", "family_id");

-- AddForeignKey
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one Family per existing household (single-family), head = current household head
INSERT INTO "families" (id, tenant_id, household_id, family_number, head_id, created_at, updated_at)
SELECT md5(random()::text || clock_timestamp()::text), h.tenant_id, h.id, h.household_number || '-1', h.head_id, now(), now()
FROM "households" h;

-- Link every member (incl. head) to its household's family
UPDATE "fisherfolk" f SET family_id = fam.id
FROM "families" fam WHERE f.household_id = fam.household_id;
