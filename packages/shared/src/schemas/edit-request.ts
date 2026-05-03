import { z } from "zod";
import { editRequestStatusSchema, entityTypeSchema } from "./enums.js";

export const editRequestSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityType: entityTypeSchema,
  entityId: z.string(),
  requestedBy: z.string(),
  requestedChanges: z.record(z.string(), z.unknown()),
  reason: z.string().min(1),
  status: editRequestStatusSchema,
  reviewedBy: z.string().nullable(),
  reviewedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const editRequestCreateSchema = z.object({
  tenantId: z.string().min(1),
  entityType: entityTypeSchema,
  entityId: z.string().min(1),
  requestedBy: z.string().min(1),
  requestedChanges: z.record(z.string(), z.unknown()),
  reason: z.string().min(1),
});

export const editRequestUpdateSchema = z.object({
  status: editRequestStatusSchema.optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.coerce.date().optional(),
});
