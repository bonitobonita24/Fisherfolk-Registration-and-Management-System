import type { EntityType } from "./enums.js";

export interface Comment {
  id: string;
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface CommentCreateInput {
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  content: string;
}
