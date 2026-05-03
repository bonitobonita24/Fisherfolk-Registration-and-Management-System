import { z } from "zod";
import { violationStatusSchema } from "./enums.js";

export const violationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  fisherfolkId: z.string(),
  vesselId: z.string().nullable(),
  violationType: z.string().min(1),
  description: z.string().min(1),
  dateOfViolation: z.coerce.date(),
  location: z.string().nullable(),
  reportedBy: z.string(),
  status: violationStatusSchema,
  resolution: z.string().nullable(),
  penaltyAmount: z.number().nonnegative().nullable(),
  evidenceUrls: z.array(z.string().url()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const violationCreateSchema = z.object({
  tenantId: z.string().min(1),
  fisherfolkId: z.string().min(1),
  vesselId: z.string().nullable().optional(),
  violationType: z.string().min(1),
  description: z.string().min(1),
  dateOfViolation: z.coerce.date(),
  location: z.string().nullable().optional(),
  reportedBy: z.string().min(1),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export const violationUpdateSchema = z.object({
  violationType: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dateOfViolation: z.coerce.date().optional(),
  location: z.string().nullable().optional(),
  status: violationStatusSchema.optional(),
  resolution: z.string().nullable().optional(),
  penaltyAmount: z.number().nonnegative().nullable().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
});
