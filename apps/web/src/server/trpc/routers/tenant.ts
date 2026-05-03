import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  superAdminProcedure,
} from "../trpc";

export const tenantRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenant = await ctx.db.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        mayorName: true,
        mayorSignatureUrl: true,
        accentColor: true,
        barangayList: true,
        violationSubjects: true,
        currentRegistrationYear: true,
        status: true,
      },
    });
    if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
    return tenant;
  }),

  updateSettings: adminProcedure
    .input(
      z
        .object({
          name: z.string().min(1).optional(),
          logoUrl: z.string().url().optional(),
          mayorName: z.string().optional(),
          mayorSignatureUrl: z.string().url().optional(),
          accentColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          barangayList: z.array(z.string().min(1)).optional(),
          violationSubjects: z.array(z.string().min(1)).optional(),
          currentRegistrationYear: z
            .number()
            .int()
            .min(2000)
            .max(2100)
            .optional(),
          smtpHost: z.string().optional(),
          smtpPort: z.number().int().min(1).max(65535).optional(),
          smtpUser: z.string().optional(),
          smtpPassword: z.string().optional(),
          smtpFrom: z.string().email().optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.tenant.findUnique({
        where: { id: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.tenant.update({
        where: { id: ctx.tenantId },
        data: omitUndefined(input),
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          mayorName: true,
          accentColor: true,
          barangayList: true,
          violationSubjects: true,
          currentRegistrationYear: true,
          status: true,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Tenant",
          entityId: ctx.tenantId,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  list: superAdminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          search: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.tenant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            createdAt: true,
            _count: { select: { users: true, fisherfolk: true } },
          },
        }),
        ctx.db.tenant.count({ where }),
      ]);

      return { items, total, page, limit };
    }),
});
