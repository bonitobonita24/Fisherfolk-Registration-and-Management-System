-- Tenant RBAC 3-tier retrofit — Chunk B: exactly one owner per tenant.
--
-- Step 1 (data normalization): a tenant may currently have more than one
-- `tenant_superadmin` (owner) after the Chunk-A enum rename. Keep the
-- oldest owner (earliest created_at, tiebreak id ascending) and demote every
-- extra owner to `tenant_admin` so the partial-unique index below can be created.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY tenant_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM users
  WHERE role = 'tenant_superadmin' AND tenant_id IS NOT NULL
)
UPDATE users u
SET role = 'tenant_admin'
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

-- Step 2 (DB invariant): enforce at most one tenant owner per tenant.
-- Only `tenant_superadmin` rows are constrained, so platform `tenant_manager`
-- rows are exempt via the role predicate (in FRMS the tenant_manager carries a
-- non-null tenant_id on the `platform` tenant, so it is the role filter — not
-- the tenant_id clause — that excludes it). The `tenant_id IS NOT NULL` clause
-- is the fleet-standard guard for NULL-tenancy platform rows and is harmless
-- here. A duplicate-owner insert/update now fails with a 23505 unique_violation.
CREATE UNIQUE INDEX "one_tenant_superadmin_per_tenant"
  ON users (tenant_id)
  WHERE role = 'tenant_superadmin' AND tenant_id IS NOT NULL;
