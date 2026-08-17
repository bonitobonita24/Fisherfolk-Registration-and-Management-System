-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('tenant', 'platform');

-- CreateEnum
CREATE TYPE "PlatformPermissionKey" AS ENUM ('billing', 'tenant_management', 'data_overrides', 'tech_support');

-- AlterTable
ALTER TABLE "custom_roles" ADD COLUMN     "scope" "RoleScope" NOT NULL DEFAULT 'tenant',
ALTER COLUMN "tenant_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform_role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_key" "PlatformPermissionKey" NOT NULL,
    "view" BOOLEAN NOT NULL DEFAULT false,
    "write" BOOLEAN NOT NULL DEFAULT false,
    "update" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_role_permissions_role_id_permission_key_key" ON "platform_role_permissions"("role_id", "permission_key");

-- AddForeignKey
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "custom_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-added: scope/tenant_id consistency guard (cannot be expressed natively
-- by Prisma). A tenant-scoped role MUST have tenant_id set; a platform-scoped
-- role MUST have tenant_id NULL. See docs/SITE_ACCESS_STANDARD.md §2.
ALTER TABLE "custom_roles" ADD CONSTRAINT "scope_tenant_consistency" CHECK ((scope = 'tenant' AND tenant_id IS NOT NULL) OR (scope = 'platform' AND tenant_id IS NULL));

-- Hand-added: platform role names must be globally unique (tenant_id is NULL
-- for every platform row, so the existing (tenant_id, name) unique index does
-- not enforce this — Postgres treats NULL <> NULL for uniqueness purposes).
CREATE UNIQUE INDEX "custom_roles_platform_name_key" ON "custom_roles"("name") WHERE scope = 'platform';
