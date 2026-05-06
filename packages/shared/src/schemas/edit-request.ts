import { z } from "zod";
import { editRequestStatusSchema } from "./enums";

export const editRequestCreateSchema = z.object({
  fisherfolkId: z.string().cuid(),
  fieldChanges: z.record(z.string(), z.unknown()),
  status: editRequestStatusSchema.optional(),
});

export const editRequestUpdateSchema = z.object({
  id: z.string().cuid(),
  status: editRequestStatusSchema.optional(),
  reviewedById: z.string().cuid().nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
});
