import { z } from "zod";
import { tenantStatusSchema } from "./enums.js";

export const tenantCreateSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  logoUrl: z.string().optional(),
  mayorName: z.string().optional(),
  mayorSignatureUrl: z.string().optional(),
  accentColor: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpFrom: z.string().optional(),
  barangayList: z.array(z.string()).default([]),
  violationSubjects: z.array(z.string()).default([]),
  currentRegistrationYear: z.number().int(),
  status: tenantStatusSchema.optional(),
});

export const tenantUpdateSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  logoUrl: z.string().nullable().optional(),
  mayorName: z.string().nullable().optional(),
  mayorSignatureUrl: z.string().nullable().optional(),
  accentColor: z.string().optional(),
  smtpHost: z.string().nullable().optional(),
  smtpPort: z.number().int().nullable().optional(),
  smtpUser: z.string().nullable().optional(),
  smtpPassword: z.string().nullable().optional(),
  smtpFrom: z.string().nullable().optional(),
  barangayList: z.array(z.string()).optional(),
  violationSubjects: z.array(z.string()).optional(),
  currentRegistrationYear: z.number().int().optional(),
  status: tenantStatusSchema.optional(),
});
