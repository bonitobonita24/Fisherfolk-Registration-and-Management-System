import type {
  EntityType,
  KanbanTaskPriority,
  KanbanTaskStatus,
} from "./enums.js";

export interface KanbanTask {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: KanbanTaskStatus;
  priority: KanbanTaskPriority;
  assigneeId: string | null;
  dueDate: Date | null;
  relatedEntityType: EntityType | null;
  relatedEntityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KanbanTaskCreateInput {
  tenantId: string;
  title: string;
  description?: string | null;
  status?: KanbanTaskStatus;
  priority?: KanbanTaskPriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
  relatedEntityType?: EntityType | null;
  relatedEntityId?: string | null;
}

export interface KanbanTaskUpdateInput {
  title?: string;
  description?: string | null;
  status?: KanbanTaskStatus;
  priority?: KanbanTaskPriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
  relatedEntityType?: EntityType | null;
  relatedEntityId?: string | null;
}
