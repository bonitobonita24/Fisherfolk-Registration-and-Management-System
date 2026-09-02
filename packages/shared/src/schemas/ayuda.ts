import { z } from "zod";
import {
  ayudaBeneficiaryStatusSchema,
  ayudaProgramStatusSchema,
  ayudaUploadTypeSchema,
} from "./enums";

export const ayudaProgramCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  filters: z.record(z.string(), z.unknown()),
  beneficiaryCount: z.number().int().nonnegative().optional(),
  status: ayudaProgramStatusSchema.optional(),
  verifiedCount: z.number().int().nonnegative().optional(),
  notReceivedCount: z.number().int().nonnegative().optional(),
});

export const ayudaProgramUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  beneficiaryCount: z.number().int().nonnegative().optional(),
  status: ayudaProgramStatusSchema.optional(),
  verifiedCount: z.number().int().nonnegative().optional(),
  notReceivedCount: z.number().int().nonnegative().optional(),
});

export const ayudaBeneficiaryCreateSchema = z.object({
  programId: z.string().cuid(),
  fisherfolkId: z.string().cuid(),
  verificationStatus: ayudaBeneficiaryStatusSchema.optional(),
  verifiedById: z.string().cuid().optional(),
  verifiedAt: z.coerce.date().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const ayudaBeneficiaryUpdateSchema = z.object({
  id: z.string().cuid(),
  verificationStatus: ayudaBeneficiaryStatusSchema.optional(),
  verifiedById: z.string().cuid().nullable().optional(),
  verifiedAt: z.coerce.date().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const ayudaUploadCreateSchema = z.object({
  programId: z.string().cuid(),
  uploadType: ayudaUploadTypeSchema,
  filePath: z.string().min(1),
  originalFilename: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
});

export const ayudaUploadUpdateSchema = z.object({
  id: z.string().cuid(),
  uploadType: ayudaUploadTypeSchema.optional(),
  filePath: z.string().min(1).optional(),
  originalFilename: z.string().min(1).optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export const FISHERFOLK_STATUS_VALUES = [
  "NEW",
  "ACTIVE",
  "RENEWED",
  "INACTIVE",
  "ARCHIVED",
] as const;

export const ayudaBeneficiaryFilterSchema = z
  .object({
    barangays: z.array(z.string().min(1)).optional(),
    householdIds: z.array(z.string().cuid()).optional(),
    familyIds: z.array(z.string().cuid()).optional(),
    categoryIds: z.array(z.string()).optional(),
    ageMin: z.number().int().min(0).max(150).optional(),
    ageMax: z.number().int().min(0).max(150).optional(),
    statuses: z.array(z.enum(FISHERFOLK_STATUS_VALUES)).optional(),
    vesselOwner: z.enum(["yes", "no"]).optional(),
    vesselTypes: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .refine(
    (f) => f.ageMin === undefined || f.ageMax === undefined || f.ageMin <= f.ageMax,
    { message: "ageMin must be ≤ ageMax", path: ["ageMin"] },
  );

export type AyudaBeneficiaryFilter = z.infer<typeof ayudaBeneficiaryFilterSchema>;
