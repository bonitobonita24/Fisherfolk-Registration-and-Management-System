export { prisma } from "./client";
export type { ExtendedPrismaClient } from "./client";
export { writeAuditLog } from "./audit";
export type { AuditLogEntry } from "./audit";
export {
  tenantGuardExtension,
  getCurrentTenantId,
  runWithTenant,
} from "./middleware/tenant-guard";
export { withTenant } from "./rls";
export * from "@prisma/client";
