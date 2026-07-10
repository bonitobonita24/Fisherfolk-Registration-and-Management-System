ALTER TYPE "UserRole" RENAME VALUE 'super_admin' TO 'tenant_manager';
ALTER TYPE "UserRole" RENAME VALUE 'admin' TO 'tenant_superadmin';
ALTER TYPE "UserRole" ADD VALUE 'tenant_admin';
