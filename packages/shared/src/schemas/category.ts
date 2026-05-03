import { z } from "zod";
import {
  categoryIconTypeSchema,
  categoryStatusSchema,
} from "./enums.js";

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1),
  displayColor: z.string().min(1),
  iconType: categoryIconTypeSchema.optional(),
  iconEmoji: z.string().optional(),
  iconImageUrl: z.string().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  status: categoryStatusSchema.optional(),
});

export const categoryUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  slug: z.string().min(1).optional(),
  displayColor: z.string().min(1).optional(),
  iconType: categoryIconTypeSchema.optional(),
  iconEmoji: z.string().nullable().optional(),
  iconImageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  status: categoryStatusSchema.optional(),
});
