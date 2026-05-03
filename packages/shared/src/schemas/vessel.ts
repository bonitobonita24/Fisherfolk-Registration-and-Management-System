import { z } from "zod";
import { vesselStatusSchema } from "./enums.js";

export const vesselSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  fisherfolkId: z.string(),
  vesselName: z.string().min(1).max(255),
  vesselType: z.string().min(1),
  registrationNumber: z.string().min(1),
  material: z.string().nullable(),
  length: z.number().positive().nullable(),
  width: z.number().positive().nullable(),
  tonnage: z.number().nonnegative().nullable(),
  engineType: z.string().nullable(),
  horsepower: z.number().positive().nullable(),
  homePort: z.string().nullable(),
  status: vesselStatusSchema,
  photoUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const vesselCreateSchema = z.object({
  tenantId: z.string().min(1),
  fisherfolkId: z.string().min(1),
  vesselName: z.string().min(1).max(255),
  vesselType: z.string().min(1),
  registrationNumber: z.string().min(1),
  material: z.string().nullable().optional(),
  length: z.number().positive().nullable().optional(),
  width: z.number().positive().nullable().optional(),
  tonnage: z.number().nonnegative().nullable().optional(),
  engineType: z.string().nullable().optional(),
  horsepower: z.number().positive().nullable().optional(),
  homePort: z.string().nullable().optional(),
});

export const vesselUpdateSchema = z.object({
  vesselName: z.string().min(1).max(255).optional(),
  vesselType: z.string().min(1).optional(),
  registrationNumber: z.string().min(1).optional(),
  material: z.string().nullable().optional(),
  length: z.number().positive().nullable().optional(),
  width: z.number().positive().nullable().optional(),
  tonnage: z.number().nonnegative().nullable().optional(),
  engineType: z.string().nullable().optional(),
  horsepower: z.number().positive().nullable().optional(),
  homePort: z.string().nullable().optional(),
  status: vesselStatusSchema.optional(),
  photoUrl: z.string().url().nullable().optional(),
});
