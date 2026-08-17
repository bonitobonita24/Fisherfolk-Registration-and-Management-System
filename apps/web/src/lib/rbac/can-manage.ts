/**
 * Admin-tier "can manage" check — the domain-workflow-management gate
 * duplicated (identically) across several tenant pages (violations, ToDo,
 * ayuda) before this extraction. Single source of truth now; behaviour is
 * unchanged from every prior copy: `tenant_manager` / `tenant_superadmin` /
 * `tenant_admin` can manage, every other role cannot.
 */
export function canManage(role: string | undefined): boolean {
  return (
    role === "tenant_manager" ||
    role === "tenant_superadmin" ||
    role === "tenant_admin"
  );
}
