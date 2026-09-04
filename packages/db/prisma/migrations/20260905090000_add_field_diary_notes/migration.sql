-- AlterEnum
-- ADD VALUE is safe outside an explicit transaction block, and this
-- migration never USES the new FeatureKey values in the same migration
-- (Postgres forbids using a freshly-added enum value in the same
-- transaction that added it).
ALTER TYPE "FeatureKey" ADD VALUE IF NOT EXISTS 'notes';
ALTER TYPE "FeatureKey" ADD VALUE IF NOT EXISTS 'projects';

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('private', 'shared');

-- CreateEnum
CREATE TYPE "NoteRefType" AS ENUM ('fisherfolk', 'vessel', 'violation', 'ayuda_program', 'ayuda_beneficiary', 'household', 'family', 'kanban_task', 'fish_catch');

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "title" TEXT,
    "body" JSONB NOT NULL,
    "body_text" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location_label" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_media" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "block_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_entity_refs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "ref_type" "NoteRefType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "label_snapshot" TEXT NOT NULL,
    "block_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_entity_refs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_tenant_id_idx" ON "notes"("tenant_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_author_id_idx" ON "notes"("tenant_id", "author_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_captured_at_idx" ON "notes"("tenant_id", "captured_at");

-- CreateIndex
CREATE INDEX "note_media_note_id_idx" ON "note_media"("note_id");

-- CreateIndex
CREATE INDEX "note_entity_refs_note_id_idx" ON "note_entity_refs"("note_id");

-- CreateIndex
CREATE INDEX "note_entity_refs_tenant_id_ref_type_entity_id_idx" ON "note_entity_refs"("tenant_id", "ref_type", "entity_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_media" ADD CONSTRAINT "note_media_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_entity_refs" ADD CONSTRAINT "note_entity_refs_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_entity_refs" ADD CONSTRAINT "note_entity_refs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
