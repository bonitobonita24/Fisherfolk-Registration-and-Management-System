import { z } from "zod";
import {
  kanbanTaskPrioritySchema,
  kanbanTaskStatusSchema,
} from "./enums";

export const kanbanTaskSourceEntityTypeSchema = z.enum([
  "fisherfolk",
  "vessel",
  "violation",
  "ayudaProgram",
]);

export const kanbanTaskKindSchema = z.enum(["TASK", "EVENT"]);

export const taskAudienceSchema = z.enum(["PERSONAL", "SHARED", "ANNOUNCED"]);

export const kanbanTaskCreateSchema = z.object({
  assignedToId: z.string().cuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  sourceCommentId: z.string().cuid().optional(),
  dueDate: z.coerce.date().nullish(),
  sourceEntityType: kanbanTaskSourceEntityTypeSchema.nullish(),
  sourceEntityId: z.string().cuid().nullish(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  allDay: z.boolean().optional(),
  kind: kanbanTaskKindSchema.optional(),
  audience: taskAudienceSchema.optional(),
  shareWithUserIds: z.array(z.string()).optional(),
});

export const kanbanTaskUpdateSchema = z.object({
  id: z.string().cuid(),
  assignedToId: z.string().cuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  sourceCommentId: z.string().cuid().nullable().optional(),
  dueDate: z.coerce.date().nullish(),
  sourceEntityType: kanbanTaskSourceEntityTypeSchema.nullish(),
  sourceEntityId: z.string().cuid().nullish(),
  startAt: z.coerce.date().optional().nullable(),
  endAt: z.coerce.date().optional().nullable(),
  allDay: z.boolean().optional(),
  kind: kanbanTaskKindSchema.optional(),
  audience: taskAudienceSchema.optional(),
  shareWithUserIds: z.array(z.string()).optional(),
});

export const agendaQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  sources: z.array(z.string()).optional(),
  statuses: z.array(kanbanTaskStatusSchema).optional(),
  mineOnly: z.boolean().optional(),
});

export const upcomingQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export const shareMutationSchema = z.object({
  taskId: z.string(),
  userIds: z.array(z.string()).min(1),
});

export const setAudienceSchema = z.object({
  taskId: z.string(),
  audience: taskAudienceSchema,
});
