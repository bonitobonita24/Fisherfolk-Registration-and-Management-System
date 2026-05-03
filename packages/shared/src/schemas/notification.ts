import { z } from "zod";
import { entityTypeSchema, notificationTypeSchema } from "./enums.js";

export const notificationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  isRead: z.boolean(),
  relatedEntityType: entityTypeSchema.nullable(),
  relatedEntityId: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const notificationCreateSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  relatedEntityType: entityTypeSchema.nullable().optional(),
  relatedEntityId: z.string().nullable().optional(),
});

export const notificationUpdateSchema = z.object({
  isRead: z.boolean().optional(),
});
