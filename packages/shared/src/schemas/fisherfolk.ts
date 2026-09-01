import { z } from "zod";
import {
  fisherfolkStatusSchema,
  genderSchema,
  civilStatusSchema,
} from "./enums";

export const fisherfolkCreateSchema = z.object({
  idNumber: z.string().min(1),
  fullName: z.string().min(1),
  lastName: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  dateOfBirth: z.coerce.date(),
  sex: genderSchema,
  civilStatus: civilStatusSchema.optional(),
  address: z.string().min(1),
  barangay: z.string().min(1),
  contactNumber: z.string().optional(),
  rsbsaNumber: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  photo: z.string().optional(),
  signature: z.string().optional(),
  qrCode: z.string().optional(),
  status: fisherfolkStatusSchema.optional(),
  dateJoined: z.coerce.date().optional(),
  registrationYear: z.number().int(),
  remarks: z.string().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const fisherfolkSearchDuplicatesSchema = z
  .object({
    idNumber: z.string().trim().min(1).optional(),
    rsbsaNumber: z.string().trim().min(1).optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    dateOfBirth: z.coerce.date().optional(),
  })
  .strict()
  .refine(
    (data) =>
      Boolean(data.idNumber) ||
      Boolean(data.rsbsaNumber) ||
      (Boolean(data.firstName) && Boolean(data.lastName)),
    {
      message:
        "Provide an ID number, RSBSA number, or both first and last name.",
    },
  );

export const fisherfolkUpdateSchema = z.object({
  id: z.string().cuid(),
  idNumber: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  firstName: z.string().min(1).optional(),
  middleName: z.string().nullable().optional(),
  suffix: z.string().nullable().optional(),
  dateOfBirth: z.coerce.date().optional(),
  sex: genderSchema.optional(),
  civilStatus: civilStatusSchema.nullable().optional(),
  address: z.string().min(1).optional(),
  barangay: z.string().min(1).optional(),
  contactNumber: z.string().nullable().optional(),
  rsbsaNumber: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
  photo: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  qrCode: z.string().nullable().optional(),
  status: fisherfolkStatusSchema.optional(),
  dateJoined: z.coerce.date().optional(),
  registrationYear: z.number().int().optional(),
  remarks: z.string().nullable().optional(),
  createdById: z.string().nullable().optional(),
  updatedById: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const fisherfolkRenewSchema = z.object({
  id: z.string().cuid(),
  notes: z.string().max(500).optional(),
});

export const fisherfolkMarkReleasedSchema = z.object({
  id: z.string().cuid(),
});

export const fisherfolkActivityQuerySchema = z.object({
  id: z.string().cuid(),
});
