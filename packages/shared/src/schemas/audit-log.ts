import { z } from "zod";
import { auditActionSchema } from "./enums.js";

export const auditLogSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  action: auditActionSchema,
  entity: z.string().min(1),
  entityId: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const auditLogCreateSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  action: auditActionSchema,
  entity: z.string().min(1),
  entityId: z.string().min(1),
  before: z.record(z.string(), z.unknown()).nullable().optional(),
  after: z.record(z.string(), z.unknown()).nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});
