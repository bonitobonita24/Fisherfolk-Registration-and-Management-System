import { z } from "zod";
import {
  kanbanTaskPrioritySchema,
  kanbanTaskStatusSchema,
} from "./enums.js";

export const kanbanTaskCreateSchema = z.object({
  assignedToId: z.string().cuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  sourceCommentId: z.string().cuid().optional(),
});

export const kanbanTaskUpdateSchema = z.object({
  id: z.string().cuid(),
  assignedToId: z.string().cuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: kanbanTaskStatusSchema.optional(),
  priority: kanbanTaskPrioritySchema.optional(),
  sourceCommentId: z.string().cuid().nullable().optional(),
});
