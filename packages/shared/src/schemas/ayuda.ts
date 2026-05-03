import { z } from "zod";
import {
  ayudaBeneficiaryStatusSchema,
  ayudaProgramStatusSchema,
} from "./enums.js";

export const ayudaProgramSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  description: z.string().nullable(),
  budget: z.number().nonnegative().nullable(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  status: ayudaProgramStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const ayudaProgramCreateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  status: ayudaProgramStatusSchema.optional(),
});

export const ayudaProgramUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  budget: z.number().nonnegative().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  status: ayudaProgramStatusSchema.optional(),
});

export const ayudaBeneficiarySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  programId: z.string(),
  fisherfolkId: z.string(),
  amountReceived: z.number().nonnegative().nullable(),
  dateReceived: z.coerce.date().nullable(),
  status: ayudaBeneficiaryStatusSchema,
  createdAt: z.coerce.date(),
});

export const ayudaBeneficiaryCreateSchema = z.object({
  tenantId: z.string().min(1),
  programId: z.string().min(1),
  fisherfolkId: z.string().min(1),
  amountReceived: z.number().nonnegative().nullable().optional(),
  dateReceived: z.coerce.date().nullable().optional(),
  status: ayudaBeneficiaryStatusSchema.optional(),
});

export const ayudaBeneficiaryUpdateSchema = z.object({
  amountReceived: z.number().nonnegative().nullable().optional(),
  dateReceived: z.coerce.date().nullable().optional(),
  status: ayudaBeneficiaryStatusSchema.optional(),
});

export const ayudaUploadSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  programId: z.string(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  uploadedBy: z.string(),
  createdAt: z.coerce.date(),
});

export const ayudaUploadCreateSchema = z.object({
  tenantId: z.string().min(1),
  programId: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  uploadedBy: z.string().min(1),
});
