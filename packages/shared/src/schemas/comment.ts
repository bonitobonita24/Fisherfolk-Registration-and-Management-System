import { z } from "zod";
import { commentTicketStatusSchema } from "./enums.js";

export const commentCreateSchema = z.object({
  fisherfolkId: z.string().cuid(),
  content: z.string().min(1),
  mentionedUserIds: z.array(z.string()).default([]),
  isTicket: z.boolean().default(false).optional(),
  ticketStatus: commentTicketStatusSchema.optional(),
});

export const commentUpdateSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1).optional(),
  mentionedUserIds: z.array(z.string()).optional(),
  isTicket: z.boolean().optional(),
  ticketStatus: commentTicketStatusSchema.nullable().optional(),
});
