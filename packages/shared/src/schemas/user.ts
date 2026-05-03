import { z } from "zod";
import { userRoleSchema } from "./enums.js";

export const userSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  username: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  isActive: z.boolean(),
  securityVersion: z.number().int(),
  lastLoginAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const userCreateSchema = z.object({
  tenantId: z.string().min(1),
  username: z.string().min(1).max(100),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: userRoleSchema,
  isActive: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  passwordHash: z.string().min(1).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});
