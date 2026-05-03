import { z } from "zod";

export const idTemplateSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  templateData: z.record(z.string(), z.unknown()),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const idTemplateCreateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  templateData: z.record(z.string(), z.unknown()),
  isDefault: z.boolean().optional(),
});

export const idTemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  templateData: z.record(z.string(), z.unknown()).optional(),
  isDefault: z.boolean().optional(),
});
