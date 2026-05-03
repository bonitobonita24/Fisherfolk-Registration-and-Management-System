import { z } from "zod";
import { userRoleSchema, userStatusSchema } from "./enums.js";

export const userCreateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  avatarUrl: z.string().optional(),
  securityVersion: z.number().int().optional(),
});

export const userUpdateSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  passwordHash: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  avatarUrl: z.string().nullable().optional(),
  securityVersion: z.number().int().optional(),
});
