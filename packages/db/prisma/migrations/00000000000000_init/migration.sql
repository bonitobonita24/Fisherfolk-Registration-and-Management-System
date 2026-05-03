-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FisherfolkStatus" AS ENUM ('NEW', 'ACTIVE', 'RENEWED', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('ACTIVE', 'IMPOUNDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ViolationStatus" AS ENUM ('ACTIVE', 'LIFTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EditRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'REQUEST', 'APPROVE', 'REJECT', 'RENEW', 'VIOLATION_FILED', 'VIOLATION_LIFTED', 'LOGIN', 'EXPORT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'encoder', 'viewer', 'bantay_dagat');

-- CreateEnum
CREATE TYPE "KanbanTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "KanbanTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- CreateEnum
CREATE TYPE "AyudaProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AyudaBeneficiaryStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED', 'DIVORCED');

-- CreateEnum
CREATE TYPE "ViolationTargetType" AS ENUM ('FISHERFOLK', 'VESSEL', 'BOTH');

-- CreateEnum
CREATE TYPE "CategoryIconType" AS ENUM ('EMOJI', 'IMAGE');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IDTemplateType" AS ENUM ('FISHERFOLK', 'VESSEL');

-- CreateEnum
CREATE TYPE "IDTemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AyudaUploadType" AS ENUM ('SIGNED_SHEET', 'EVENT_PHOTO');

-- CreateEnum
CREATE TYPE "CommentTicketStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "mayor_name" TEXT,
    "mayor_signature_url" TEXT,
    "accent_color" TEXT NOT NULL DEFAULT '#4F8EF7',
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_user" TEXT,
    "smtp_password" TEXT,
    "smtp_from" TEXT,
    "barangay_list" TEXT[],
    "violation_subjects" TEXT[],
    "current_registration_year" INTEGER NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'encoder',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar_url" TEXT,
    "security_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fisherfolk" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "suffix" TEXT,
    "date_of_birth" DATE NOT NULL,
    "sex" "Gender" NOT NULL,
    "civil_status" "CivilStatus",
    "address" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "contact_number" TEXT,
    "rsbsa_number" TEXT,
    "category_ids" TEXT[],
    "photo" TEXT,
    "signature" TEXT,
    "qr_code" TEXT,
    "status" "FisherfolkStatus" NOT NULL DEFAULT 'NEW',
    "date_joined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_year" INTEGER NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "fisherfolk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mfvr_number" TEXT NOT NULL,
    "vessel_name" TEXT,
    "vessel_type" TEXT NOT NULL,
    "hull_material" TEXT,
    "place_built" TEXT,
    "year_built" INTEGER,
    "registered_length" DOUBLE PRECISION,
    "registered_breadth" DOUBLE PRECISION,
    "registered_depth" DOUBLE PRECISION,
    "gross_tonnage" DOUBLE PRECISION,
    "net_tonnage" DOUBLE PRECISION,
    "engine_make" TEXT,
    "engine_serial_number" TEXT,
    "horsepower" DOUBLE PRECISION,
    "homeport" TEXT,
    "fishing_gear_classification" TEXT[],
    "vessel_photo" TEXT,
    "qr_code" TEXT,
    "status" "VesselStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "target_type" "ViolationTargetType" NOT NULL,
    "fisherfolk_id" TEXT,
    "vessel_id" TEXT,
    "subject" TEXT NOT NULL,
    "details" TEXT,
    "evidence_images" TEXT[],
    "notes" TEXT,
    "status" "ViolationStatus" NOT NULL DEFAULT 'ACTIVE',
    "filed_by_id" TEXT NOT NULL,
    "lifted_by_id" TEXT,
    "lifted_at" TIMESTAMP(3),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edit_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fisherfolk_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "field_changes" JSONB NOT NULL,
    "status" "EditRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fisherfolk_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentioned_user_ids" TEXT[],
    "is_ticket" BOOLEAN NOT NULL DEFAULT false,
    "ticket_status" "CommentTicketStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "display_color" TEXT NOT NULL,
    "icon_type" "CategoryIconType" NOT NULL DEFAULT 'EMOJI',
    "icon_emoji" TEXT,
    "icon_image_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "KanbanTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "KanbanTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "source_comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayuda_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "beneficiary_count" INTEGER NOT NULL DEFAULT 0,
    "status" "AyudaProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "verified_count" INTEGER NOT NULL DEFAULT 0,
    "not_received_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ayuda_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayuda_beneficiaries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "fisherfolk_id" TEXT NOT NULL,
    "verificationStatus" "AyudaBeneficiaryStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ayuda_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ayuda_uploads" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "upload_type" "AyudaUploadType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ayuda_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template_type" "IDTemplateType" NOT NULL,
    "front_background_url" TEXT,
    "back_background_url" TEXT,
    "front_elements" JSONB NOT NULL,
    "back_elements" JSONB NOT NULL,
    "status" "IDTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FisherfolkVessels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FisherfolkVessels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_username_key" ON "users"("tenant_id", "username");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_idx" ON "fisherfolk"("tenant_id");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_status_idx" ON "fisherfolk"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_barangay_idx" ON "fisherfolk"("tenant_id", "barangay");

-- CreateIndex
CREATE INDEX "fisherfolk_tenant_id_last_name_first_name_idx" ON "fisherfolk"("tenant_id", "last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "fisherfolk_tenant_id_id_number_key" ON "fisherfolk"("tenant_id", "id_number");

-- CreateIndex
CREATE INDEX "vessels_tenant_id_idx" ON "vessels"("tenant_id");

-- CreateIndex
CREATE INDEX "vessels_tenant_id_status_idx" ON "vessels"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_tenant_id_mfvr_number_key" ON "vessels"("tenant_id", "mfvr_number");

-- CreateIndex
CREATE INDEX "violations_tenant_id_idx" ON "violations"("tenant_id");

-- CreateIndex
CREATE INDEX "violations_tenant_id_status_idx" ON "violations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "violations_tenant_id_fisherfolk_id_idx" ON "violations"("tenant_id", "fisherfolk_id");

-- CreateIndex
CREATE INDEX "violations_tenant_id_vessel_id_idx" ON "violations"("tenant_id", "vessel_id");

-- CreateIndex
CREATE INDEX "violations_tenant_id_filed_by_id_idx" ON "violations"("tenant_id", "filed_by_id");

-- CreateIndex
CREATE INDEX "edit_requests_tenant_id_idx" ON "edit_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "edit_requests_tenant_id_status_idx" ON "edit_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "edit_requests_tenant_id_fisherfolk_id_idx" ON "edit_requests"("tenant_id", "fisherfolk_id");

-- CreateIndex
CREATE INDEX "comments_tenant_id_idx" ON "comments"("tenant_id");

-- CreateIndex
CREATE INDEX "comments_tenant_id_fisherfolk_id_idx" ON "comments"("tenant_id", "fisherfolk_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE INDEX "categories_tenant_id_status_idx" ON "categories"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_tasks_source_comment_id_key" ON "kanban_tasks"("source_comment_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_tenant_id_idx" ON "kanban_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_tenant_id_assigned_to_id_idx" ON "kanban_tasks"("tenant_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "kanban_tasks_tenant_id_status_idx" ON "kanban_tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_idx" ON "notifications"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ayuda_programs_tenant_id_idx" ON "ayuda_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "ayuda_programs_tenant_id_status_idx" ON "ayuda_programs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ayuda_beneficiaries_tenant_id_idx" ON "ayuda_beneficiaries"("tenant_id");

-- CreateIndex
CREATE INDEX "ayuda_beneficiaries_program_id_idx" ON "ayuda_beneficiaries"("program_id");

-- CreateIndex
CREATE INDEX "ayuda_beneficiaries_fisherfolk_id_idx" ON "ayuda_beneficiaries"("fisherfolk_id");

-- CreateIndex
CREATE UNIQUE INDEX "ayuda_beneficiaries_program_id_fisherfolk_id_key" ON "ayuda_beneficiaries"("program_id", "fisherfolk_id");

-- CreateIndex
CREATE INDEX "ayuda_uploads_program_id_idx" ON "ayuda_uploads"("program_id");

-- CreateIndex
CREATE INDEX "id_templates_tenant_id_idx" ON "id_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "id_templates_tenant_id_template_type_status_idx" ON "id_templates"("tenant_id", "template_type", "status");

-- CreateIndex
CREATE INDEX "_FisherfolkVessels_B_index" ON "_FisherfolkVessels"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fisherfolk" ADD CONSTRAINT "fisherfolk_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_filed_by_id_fkey" FOREIGN KEY ("filed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_lifted_by_id_fkey" FOREIGN KEY ("lifted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_source_comment_id_fkey" FOREIGN KEY ("source_comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_programs" ADD CONSTRAINT "ayuda_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_programs" ADD CONSTRAINT "ayuda_programs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "ayuda_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_fisherfolk_id_fkey" FOREIGN KEY ("fisherfolk_id") REFERENCES "fisherfolk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_beneficiaries" ADD CONSTRAINT "ayuda_beneficiaries_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_uploads" ADD CONSTRAINT "ayuda_uploads_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "ayuda_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ayuda_uploads" ADD CONSTRAINT "ayuda_uploads_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_templates" ADD CONSTRAINT "id_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_templates" ADD CONSTRAINT "id_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FisherfolkVessels" ADD CONSTRAINT "_FisherfolkVessels_A_fkey" FOREIGN KEY ("A") REFERENCES "fisherfolk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FisherfolkVessels" ADD CONSTRAINT "_FisherfolkVessels_B_fkey" FOREIGN KEY ("B") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================
-- Row Level Security (L2) — Active (multi-tenant mode)
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fisherfolk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vessels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "violations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "edit_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kanban_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ayuda_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ayuda_beneficiaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "id_templates" ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_users ON "users"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_fisherfolk ON "fisherfolk"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_vessels ON "vessels"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_violations ON "violations"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_edit_requests ON "edit_requests"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_comments ON "comments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_categories ON "categories"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_kanban_tasks ON "kanban_tasks"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_notifications ON "notifications"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_ayuda_programs ON "ayuda_programs"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_ayuda_beneficiaries ON "ayuda_beneficiaries"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_id_templates ON "id_templates"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Bypass RLS for the application role (Prisma connects as this user)
-- The L6 tenant-guard extension handles app-level isolation
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "fisherfolk" FORCE ROW LEVEL SECURITY;
ALTER TABLE "vessels" FORCE ROW LEVEL SECURITY;
ALTER TABLE "violations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "edit_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE "comments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
ALTER TABLE "kanban_tasks" FORCE ROW LEVEL SECURITY;
ALTER TABLE "notifications" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ayuda_programs" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ayuda_beneficiaries" FORCE ROW LEVEL SECURITY;
ALTER TABLE "id_templates" FORCE ROW LEVEL SECURITY;
