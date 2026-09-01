import { z } from "zod";
import {
  violationStatusSchema,
  violationTargetTypeSchema,
} from "./enums";

export const violationCreateSchema = z.object({
  targetType: violationTargetTypeSchema,
  fisherfolkId: z.string().cuid().optional(),
  vesselId: z.string().cuid().optional(),
  subject: z.string().min(1),
  details: z.string().optional(),
  evidenceImages: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: violationStatusSchema.optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const violationUpdateSchema = z.object({
  id: z.string().cuid(),
  targetType: violationTargetTypeSchema.optional(),
  fisherfolkId: z.string().cuid().nullable().optional(),
  vesselId: z.string().cuid().nullable().optional(),
  subject: z.string().min(1).optional(),
  details: z.string().nullable().optional(),
  evidenceImages: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  status: violationStatusSchema.optional(),
  liftedById: z.string().cuid().nullable().optional(),
  liftedAt: z.coerce.date().nullable().optional(),
  resolutionNotes: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
