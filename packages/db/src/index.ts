export { prisma, platformPrisma } from "./client";
export type { ExtendedPrismaClient } from "./client";
export { writeAuditLog } from "./audit";
export type { AuditLogEntry } from "./audit";
export {
  tenantGuardExtension,
  getCurrentTenantId,
  runWithTenant,
  isSystemModel,
  assertTenantContext,
  scopeArgsToTenant,
} from "./middleware/tenant-guard";
export { withTenant } from "./rls";
export * from "@prisma/client";
