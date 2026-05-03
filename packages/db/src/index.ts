export { prisma } from "./client.js";
export type { ExtendedPrismaClient } from "./client.js";
export { writeAuditLog } from "./audit.js";
export type { AuditLogEntry } from "./audit.js";
export {
  tenantGuardExtension,
  getCurrentTenantId,
  runWithTenant,
} from "./middleware/tenant-guard.js";
export { withTenant } from "./rls.js";
export * from "@prisma/client";
