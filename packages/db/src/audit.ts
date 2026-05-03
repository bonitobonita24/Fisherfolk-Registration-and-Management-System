import type { Prisma, AuditAction } from "@prisma/client";

export interface AuditLogEntry {
  tenantId: string | null;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  entry: AuditLogEntry,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenantId: entry.tenantId,
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      ...(entry.before !== undefined
        ? { before: entry.before as Prisma.InputJsonValue }
        : {}),
      ...(entry.after !== undefined
        ? { after: entry.after as Prisma.InputJsonValue }
        : {}),
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}
