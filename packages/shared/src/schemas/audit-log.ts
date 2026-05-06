import { z } from "zod";
import { auditActionSchema } from "./enums";

export const auditLogCreateSchema = z.object({
  userId: z.string().cuid(),
  action: auditActionSchema,
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  before: z.record(z.string(), z.unknown()).optional(),
  after: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});
