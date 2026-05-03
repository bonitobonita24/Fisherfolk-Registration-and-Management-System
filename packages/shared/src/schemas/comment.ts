import { z } from "zod";
import { entityTypeSchema } from "./enums.js";

export const commentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityType: entityTypeSchema,
  entityId: z.string(),
  userId: z.string(),
  content: z.string().min(1),
  createdAt: z.coerce.date(),
});

export const commentCreateSchema = z.object({
  tenantId: z.string().min(1),
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1),
});
