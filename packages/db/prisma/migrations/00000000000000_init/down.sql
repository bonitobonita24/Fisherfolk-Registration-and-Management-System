-- Down migration: drop all RLS policies, tables, and enums

-- Drop RLS policies
DROP POLICY IF EXISTS tenant_isolation_users ON "users";
DROP POLICY IF EXISTS tenant_isolation_fisherfolk ON "fisherfolk";
DROP POLICY IF EXISTS tenant_isolation_vessels ON "vessels";
DROP POLICY IF EXISTS tenant_isolation_violations ON "violations";
DROP POLICY IF EXISTS tenant_isolation_edit_requests ON "edit_requests";
DROP POLICY IF EXISTS tenant_isolation_comments ON "comments";
DROP POLICY IF EXISTS tenant_isolation_categories ON "categories";
DROP POLICY IF EXISTS tenant_isolation_kanban_tasks ON "kanban_tasks";
DROP POLICY IF EXISTS tenant_isolation_notifications ON "notifications";
DROP POLICY IF EXISTS tenant_isolation_ayuda_programs ON "ayuda_programs";
DROP POLICY IF EXISTS tenant_isolation_ayuda_beneficiaries ON "ayuda_beneficiaries";
DROP POLICY IF EXISTS tenant_isolation_id_templates ON "id_templates";

-- Drop tables (reverse order of creation for FK dependencies)
DROP TABLE IF EXISTS "_FisherfolkVessels" CASCADE;
DROP TABLE IF EXISTS "id_templates" CASCADE;
DROP TABLE IF EXISTS "ayuda_uploads" CASCADE;
DROP TABLE IF EXISTS "ayuda_beneficiaries" CASCADE;
DROP TABLE IF EXISTS "ayuda_programs" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "kanban_tasks" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "edit_requests" CASCADE;
DROP TABLE IF EXISTS "violations" CASCADE;
DROP TABLE IF EXISTS "vessels" CASCADE;
DROP TABLE IF EXISTS "fisherfolk" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "CommentTicketStatus";
DROP TYPE IF EXISTS "AyudaUploadType";
DROP TYPE IF EXISTS "IDTemplateStatus";
DROP TYPE IF EXISTS "IDTemplateType";
DROP TYPE IF EXISTS "TenantStatus";
DROP TYPE IF EXISTS "UserStatus";
DROP TYPE IF EXISTS "CategoryStatus";
DROP TYPE IF EXISTS "CategoryIconType";
DROP TYPE IF EXISTS "ViolationTargetType";
DROP TYPE IF EXISTS "CivilStatus";
DROP TYPE IF EXISTS "Gender";
DROP TYPE IF EXISTS "AyudaBeneficiaryStatus";
DROP TYPE IF EXISTS "AyudaProgramStatus";
DROP TYPE IF EXISTS "NotificationType";
DROP TYPE IF EXISTS "KanbanTaskPriority";
DROP TYPE IF EXISTS "KanbanTaskStatus";
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "AuditAction";
DROP TYPE IF EXISTS "EditRequestStatus";
DROP TYPE IF EXISTS "ViolationStatus";
DROP TYPE IF EXISTS "VesselStatus";
DROP TYPE IF EXISTS "FisherfolkStatus";
