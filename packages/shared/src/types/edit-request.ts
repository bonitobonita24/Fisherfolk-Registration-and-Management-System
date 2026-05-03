import type { EditRequestStatus, EntityType } from "./enums.js";

export interface EditRequest {
  id: string;
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  requestedBy: string;
  requestedChanges: Record<string, unknown>;
  reason: string;
  status: EditRequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface EditRequestCreateInput {
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  requestedBy: string;
  requestedChanges: Record<string, unknown>;
  reason: string;
}

export interface EditRequestUpdateInput {
  status?: EditRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
}
