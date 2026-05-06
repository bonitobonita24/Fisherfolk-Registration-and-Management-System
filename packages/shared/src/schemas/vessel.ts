import { z } from "zod";
import { vesselStatusSchema } from "./enums";

export const vesselCreateSchema = z.object({
  mfvrNumber: z.string().min(1),
  vesselName: z.string().optional(),
  vesselType: z.string().min(1),
  hullMaterial: z.string().optional(),
  placeBuilt: z.string().optional(),
  yearBuilt: z.number().int().optional(),
  registeredLength: z.number().optional(),
  registeredBreadth: z.number().optional(),
  registeredDepth: z.number().optional(),
  grossTonnage: z.number().optional(),
  netTonnage: z.number().optional(),
  engineMake: z.string().optional(),
  engineSerialNumber: z.string().optional(),
  horsepower: z.number().optional(),
  homeport: z.string().optional(),
  fishingGearClassification: z.array(z.string()).default([]),
  vesselPhoto: z.string().optional(),
  qrCode: z.string().optional(),
  status: vesselStatusSchema.optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
});

const vesselUpdateDataSchema = z.object({
  mfvrNumber: z.string().min(1).optional(),
  vesselName: z.string().nullable().optional(),
  vesselType: z.string().min(1).optional(),
  hullMaterial: z.string().nullable().optional(),
  placeBuilt: z.string().nullable().optional(),
  yearBuilt: z.number().int().nullable().optional(),
  registeredLength: z.number().nullable().optional(),
  registeredBreadth: z.number().nullable().optional(),
  registeredDepth: z.number().nullable().optional(),
  grossTonnage: z.number().nullable().optional(),
  netTonnage: z.number().nullable().optional(),
  engineMake: z.string().nullable().optional(),
  engineSerialNumber: z.string().nullable().optional(),
  horsepower: z.number().nullable().optional(),
  homeport: z.string().nullable().optional(),
  fishingGearClassification: z.array(z.string()).optional(),
  vesselPhoto: z.string().nullable().optional(),
  qrCode: z.string().nullable().optional(),
  status: vesselStatusSchema.optional(),
  createdById: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
});

export const vesselUpdateSchema = z.object({
  id: z.string().cuid(),
  data: vesselUpdateDataSchema,
});
