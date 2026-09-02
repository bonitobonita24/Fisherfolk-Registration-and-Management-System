-- FIS-11: employment type (full-time/part-time) + primary source of income
-- Additive, backfill-safe: new nullable columns + new enum; existing rows unaffected.

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- AlterTable
ALTER TABLE "fisherfolk" ADD COLUMN     "employment_type" "EmploymentType",
ADD COLUMN     "primary_source_of_income" TEXT;
