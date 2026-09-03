import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  tenantSuperadminProcedure,
} from "../trpc";

export const userRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          role: z
            .enum([
              "tenant_manager",
              "tenant_superadmin",
              "tenant_admin",
              "encoder",
              "viewer",
              "bantay_dagat",
            ])
            .optional(),
          status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, role, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        }),
        ctx.db.user.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  listAssignable: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    return ctx.db.user.findMany({
      where: { tenantId: ctx.tenantId, status: "ACTIVE" },
      take: 500,
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true },
    });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
    const record = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
      },
    });
    if (!record) throw new TRPCError({ code: "NOT_FOUND" });
    return record;
  }),

  create: adminProcedure
    .input(
      z
        .object({
          name: z.string().min(1),
          username: z.string().min(3).max(50),
          email: z.string().email(),
          password: z.string().min(8),
          role: z.enum(["tenant_admin", "encoder", "viewer", "bantay_dagat"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.user.findFirst({
        where: {
          tenantId: ctx.tenantId,
          OR: [{ email: input.email }, { username: input.username }],
        },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Invalid input." });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const record = await ctx.db.user.create({
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          passwordHash,
          role: input.role,
          tenantId: ctx.tenantId,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "User",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  updateRole: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          role: z.enum(["tenant_admin", "encoder", "viewer", "bantay_dagat"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          role: input.role,
          securityVersion: { increment: 1 },
        },
        select: { id: true, role: true, securityVersion: true },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: input.id,
          before: { role: existing.role } as Record<string, unknown>,
          after: { role: updated.role } as Record<string, unknown>,
        },
      });

      return updated;
    }),

  deactivate: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.id === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input.",
        });
      }

      const existing = await ctx.db.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          status: "DEACTIVATED",
          securityVersion: { increment: 1 },
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: input.id,
          before: { status: existing.status } as Record<string, unknown>,
          after: { status: updated.status } as Record<string, unknown>,
        },
      });

      return { success: true };
    }),

  // setStatus — FIS-7 tenant user-management: symmetric activate/deactivate
  // endpoint (mirrors the platform-side tenantUser.setStatus idiom). Kept
  // alongside the existing `deactivate` mutation (unchanged, still used by
  // any other consumer) rather than replacing it.
  setStatus: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          status: z.enum(["ACTIVE", "DEACTIVATED"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.status === "DEACTIVATED" && input.id === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input.",
        });
      }

      const existing = await ctx.db.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          status: input.status,
          securityVersion: { increment: 1 },
        },
        select: { id: true, status: true },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: input.id,
          before: { status: existing.status } as Record<string, unknown>,
          after: { status: updated.status } as Record<string, unknown>,
        },
      });

      return updated;
    }),

  // adminProcedure (not superAdminProcedure): after the tenant-manager role split
  // (2026-07-09) the LGU top account is role `admin`, and it must be able to reset
  // its own staff's passwords. Safe: hard-scoped to ctx.tenantId below, and
  // super_admins live on the separate `platform` tenant so an LGU admin can never
  // target one (no privilege escalation).
  resetPassword: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          newPassword: z.string().min(8),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await ctx.db.user.update({
        where: { id: input.id },
        data: {
          passwordHash,
          securityVersion: { increment: 1 },
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: input.id,
          after: { action: "password_reset" } as Record<string, unknown>,
        },
      });

      return { success: true };
    }),

  transferOwnership: tenantSuperadminProcedure
    .input(z.object({ newOwnerId: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      if (ctx.role !== "tenant_superadmin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.newOwnerId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already the owner.",
        });
      }

      const newOwner = await ctx.db.user.findFirst({
        where: { id: input.newOwnerId, tenantId: ctx.tenantId },
      });
      if (!newOwner) throw new TRPCError({ code: "NOT_FOUND" });
      if (newOwner.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot transfer ownership to a deactivated user.",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        // Demote self FIRST, then promote the new owner — the
        // one_tenant_superadmin_per_tenant partial-unique index is not
        // deferred, so promoting first would trip a 23505 violation.
        await tx.user.update({
          where: { id: ctx.userId! },
          data: {
            role: "tenant_admin",
            securityVersion: { increment: 1 },
          },
        });

        await tx.user.update({
          where: { id: newOwner.id },
          data: {
            role: "tenant_superadmin",
            securityVersion: { increment: 1 },
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: ctx.tenantId!,
            userId: ctx.userId!,
            action: "UPDATE",
            entityType: "User",
            entityId: newOwner.id,
            before: {
              previousOwnerId: ctx.userId,
            } as unknown as Record<string, unknown>,
            after: {
              transferredOwnership: true,
              newOwnerId: newOwner.id,
              previousOwnerId: ctx.userId,
            } as unknown as Record<string, unknown>,
          },
        });
      });

      return { newOwnerId: newOwner.id, previousOwnerId: ctx.userId! };
    }),
});
