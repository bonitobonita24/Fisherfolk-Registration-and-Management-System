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
});
