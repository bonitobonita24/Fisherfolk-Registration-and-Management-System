import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  isActive: z.boolean(),
  logoUrl: z.string().url().nullable(),
  accentColor: z.string().max(7).nullable(),
  smtpHost: z.string().nullable(),
  smtpPort: z.number().int().min(1).max(65535).nullable(),
  smtpUser: z.string().nullable(),
  smtpPasswordEncrypted: z.string().nullable(),
  smtpFrom: z.string().email().nullable(),
  smtpFromName: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const tenantCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  isActive: z.boolean().optional(),
  logoUrl: z.string().url().nullable().optional(),
  accentColor: z.string().max(7).nullable().optional(),
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPasswordEncrypted: z.string().nullable().optional(),
  smtpFrom: z.string().email().nullable().optional(),
  smtpFromName: z.string().nullable().optional(),
});

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  logoUrl: z.string().url().nullable().optional(),
  accentColor: z.string().max(7).nullable().optional(),
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPasswordEncrypted: z.string().nullable().optional(),
  smtpFrom: z.string().email().nullable().optional(),
  smtpFromName: z.string().nullable().optional(),
});
