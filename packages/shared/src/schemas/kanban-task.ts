import { z } from "zod";
import {
  entityTypeSchema,
  kanbanTaskPrioritySchema,
  kanbanTaskStatusSchema,
} from "./enums.js";

export const kanbanTaskSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  title: z.string().min(1),
  description: z.string().nullable(),
  status: kanbanTaskStatusSchema,
  priority: kanbanTaskPrioritySchema,
  assigneeId: z.string().nullable(),
  dueDate: z.coerce.date().nullable(),
  relatedEntityType: entityTypeSchema.nullable(),
  relatedEntityId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const kanbanTaskCreateSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  relatedEntityType: entityTypeSchema.nullable().optional(),
  relatedEntityId: z.string().nullable().optional(),
});

export const kanbanTaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  relatedEntityType: entityTypeSchema.nullable().optional(),
  relatedEntityId: z.string().nullable().optional(),
});
