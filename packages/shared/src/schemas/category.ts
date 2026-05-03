import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});

export const categoryCreateSchema = z.object({
  tenantId: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const categoryUpdateSchema = z.object({
  type: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
