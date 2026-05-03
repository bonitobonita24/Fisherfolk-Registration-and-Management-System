import type { EntityType, NotificationType } from "./enums.js";

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: EntityType | null;
  relatedEntityId: string | null;
  createdAt: Date;
}

export interface NotificationCreateInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: EntityType | null;
  relatedEntityId?: string | null;
}

export interface NotificationUpdateInput {
  isRead?: boolean;
}
