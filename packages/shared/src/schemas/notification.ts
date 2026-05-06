import { z } from "zod";
import { notificationTypeSchema } from "./enums";

export const notificationCreateSchema = z.object({
  userId: z.string().cuid(),
  type: notificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  isRead: z.boolean().optional(),
});

export const notificationUpdateSchema = z.object({
  id: z.string().cuid(),
  isRead: z.boolean().optional(),
});
