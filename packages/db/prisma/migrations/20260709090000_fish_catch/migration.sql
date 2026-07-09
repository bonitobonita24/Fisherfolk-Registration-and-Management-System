-- CreateEnum
CREATE TYPE "GearType" AS ENUM ('GILL_NET', 'HOOK_AND_LINE', 'HANDLINE', 'LONGLINE', 'FISH_CORRAL', 'FISH_TRAP', 'BEACH_SEINE', 'RING_NET', 'CAST_NET', 'LIFT_NET', 'SCOOP_NET', 'SPEAR_GUN', 'FISH_POT', 'CRAB_LIFT_NET', 'SQUID_JIG', 'GLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "CatchDisposition" AS ENUM ('SOLD', 'HOME_CONSUMED', 'BARTERED', 'DRIED_PROCESSED', 'SHARED_GIVEN', 'DISCARDED', 'MIXED');

-- CreateEnum
CREATE TYPE "FishCatchSource" AS ENUM ('FMO_ENUMERATOR', 'SELF_REPORT', 'NSAP_SAMPLING', 'IMPORT');

-- CreateTable
CREATE TABLE "fish_catches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reference_no" TEXT NOT NULL,
    "fisherfolk_id" TEXT NOT NULL,
    "vessel_id" TEXT,
    "landing_date" DATE NOT NULL,
    "landing_time" TEXT,
    "departure_at" TIMESTAMP(3),
    "return_at" TIMESTAMP(3),
    "fishing_ground_barangay" TEXT,
    "fishing_ground_label" TEXT,
    "fma_code" TEXT,
    "gear_type" "GearType" NOT NULL,
    "gear_detail" TEXT,
    "gear_units" INTEGER,
    "fishing_hours" DECIMAL(8,2),
    "num_trips" INTEGER NOT NULL DEFAULT 1,
    "num_fishers" INTEGER,
    "total_catch_kg" DECIMAL(10,2) NOT NULL,
    "estimated_value_php" DECIMAL(12,2),
    "disposition" "CatchDisposition",
    "remarks" TEXT,
    "source" "FishCatchSource" NOT NULL DEFAULT 'FMO_ENUMERATOR',
    "recorded_by_id" TEXT,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fish_catches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fish_catch_species" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fish_catch_id" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "scientific_name" TEXT,
    "weight_kg" DECIMAL(10,2) NOT NULL,
    "quantity_pcs" INTEGER,
    "price_per_kg_php" DECIMAL(10,2),
    "value_php" DECIMAL(12,2),
    "disposition" "CatchDisposition",
    "avg_length_cm" DECIMAL(6,2),
    "size_class" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fish_catch_species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fish_catches_tenant_id_reference_no_key" ON "fish_catches"("tenant_id", "reference_no");

-- CreateIndex
CREATE INDEX "fish_catches_tenant_id_idx" ON "fish_catches"("tenant_id");

-- CreateIndex
CREATE INDEX "fish_catches_tenant_id_landing_date_idx" ON "fish_catches"("tenant_id", "landing_date");

-- CreateIndex
CREATE INDEX "fish_catches_tenant_id_fisherfolk_id_idx" ON "fish_catches"("tenant_id", "fisherfolk_id");

-- CreateIndex
CREATE INDEX "fish_catches_tenant_id_gear_type_idx" ON "fish_catches"("tenant_id", "gear_type");

-- CreateIndex
CREATE INDEX "fish_catch_species_tenant_id_idx" ON "fish_catch_species"("tenant_id");

-- CreateIndex
CREATE INDEX "fish_catch_species_fish_catch_id_idx" ON "fish_catch_species"("fish_catch_id");

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catches" ADD CONSTRAINT "fish_catches_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catch_species" ADD CONSTRAINT "fish_catch_species_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish_catch_species" ADD CONSTRAINT "fish_catch_species_fish_catch_id_fkey" FOREIGN KEY ("fish_catch_id") REFERENCES "fish_catches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
