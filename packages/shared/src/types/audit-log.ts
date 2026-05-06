import type { AuditAction } from "./enums";

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AuditLogCreateInput {
  tenantId: string;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
}
