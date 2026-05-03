import { z } from "zod";
import {
  idTemplateTypeSchema,
  idTemplateStatusSchema,
} from "./enums.js";

export const idTemplateCreateSchema = z.object({
  name: z.string().min(1),
  templateType: idTemplateTypeSchema,
  frontBackgroundUrl: z.string().optional(),
  backBackgroundUrl: z.string().optional(),
  frontElements: z.array(z.record(z.string(), z.unknown())),
  backElements: z.array(z.record(z.string(), z.unknown())),
  status: idTemplateStatusSchema.optional(),
});

export const idTemplateUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).optional(),
  templateType: idTemplateTypeSchema.optional(),
  frontBackgroundUrl: z.string().nullable().optional(),
  backBackgroundUrl: z.string().nullable().optional(),
  frontElements: z.array(z.record(z.string(), z.unknown())).optional(),
  backElements: z.array(z.record(z.string(), z.unknown())).optional(),
  status: idTemplateStatusSchema.optional(),
});
