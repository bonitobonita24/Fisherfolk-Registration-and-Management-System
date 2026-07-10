import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { platformPrisma } from "@frms/db";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  tenantManagerProcedure,
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

  create: tenantManagerProcedure
    .input(
      z
        .object({
          name: z.string().min(1),
          slug: z.string().regex(/^[a-z0-9-]+$/),
          admin: z.object({
            username: z.string().min(3),
            fullName: z.string().min(1),
            password: z.string().min(12),
          }),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, slug, admin } = input;

      const existingTenant = await platformPrisma.tenant.findUnique({
        where: { slug },
      });
      if (existingTenant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tenant with this slug already exists.",
        });
      }

      const existingUser = await platformPrisma.user.findFirst({
        where: { username: admin.username },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken.",
        });
      }

      const created = await platformPrisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name,
            slug,
            status: "ACTIVE",
            currentRegistrationYear: new Date().getFullYear(),
          },
        });

        const passwordHash = await bcrypt.hash(admin.password, 12);

        await tx.user.create({
          data: {
            username: admin.username,
            email: `${admin.username}@${slug}.local`,
            name: admin.fullName,
            passwordHash,
            role: "tenant_superadmin",
            status: "ACTIVE",
            tenantId: tenant.id,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            userId: ctx.userId!,
            action: "CREATE",
            entityType: "Tenant",
            entityId: tenant.id,
            after: {
              id: tenant.id,
              slug: tenant.slug,
              name: tenant.name,
              status: String(tenant.status),
            },
          },
        });

        return tenant;
      });

      return {
        id: created.id,
        slug: created.slug,
        name: created.name,
        status: created.status,
      };
    }),

  reassignOwner: tenantManagerProcedure
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          newOwnerId: z.string().cuid(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await platformPrisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { id: true },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const newOwner = await platformPrisma.user.findFirst({
        where: { id: input.newOwnerId, tenantId: input.tenantId },
      });
      if (!newOwner) throw new TRPCError({ code: "NOT_FOUND" });

      if (newOwner.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot assign a deactivated user as owner.",
        });
      }

      if (newOwner.role === "tenant_superadmin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already the tenant owner.",
        });
      }

      const currentOwner = await platformPrisma.user.findFirst({
        where: { tenantId: input.tenantId, role: "tenant_superadmin" },
      });

      await platformPrisma.$transaction(async (tx) => {
        if (currentOwner) {
          await tx.user.update({
            where: { id: currentOwner.id },
            data: { role: "tenant_admin", securityVersion: { increment: 1 } },
          });
        }

        await tx.user.update({
          where: { id: newOwner.id },
          data: { role: "tenant_superadmin", securityVersion: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            userId: ctx.userId!,
            action: "UPDATE",
            entityType: "User",
            entityId: newOwner.id,
            before: {
              previousOwnerId: currentOwner?.id ?? null,
            },
            after: {
              reassignedOwner: true,
              newOwnerId: newOwner.id,
              previousOwnerId: currentOwner?.id ?? null,
            },
          },
        });
      });

      return {
        tenantId: input.tenantId,
        newOwnerId: newOwner.id,
        previousOwnerId: currentOwner?.id ?? null,
      };
    }),

  setStatus: tenantManagerProcedure
    .input(
      z
        .object({
          id: z.string(),
          status: z.enum(["ACTIVE", "SUSPENDED"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      const existing = await ctx.db.tenant.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updated = await ctx.db.tenant.update({
        where: { id },
        data: { status },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: id,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Tenant",
          entityId: id,
          before: { status: existing.status } as unknown as Record<
            string,
            unknown
          >,
          after: { status } as unknown as Record<string, unknown>,
        },
      });

      return { id: updated.id, status: updated.status };
    }),

  list: tenantManagerProcedure
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
