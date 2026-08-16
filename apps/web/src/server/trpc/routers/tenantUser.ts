import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { platformPrisma } from "@frms/db";

import { createTRPCRouter, platformOrTenantAdminProcedure } from "../trpc";

export const tenantUserRouter = createTRPCRouter({
  list: platformOrTenantAdminProcedure("tenant_management", "view")
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          search: z.string().optional(),
          role: z
            .enum(["tenant_admin", "encoder", "viewer", "bantay_dagat"])
            .optional(),
          status: z.enum(["ACTIVE", "DEACTIVATED"]).optional(),
        })
        .strict(),
    )
    .query(async ({ input }) => {
      const { tenantId, page, limit, search, role, status } = input;
      const skip = (page - 1) * limit;

      const tenant = await platformPrisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const where = {
        tenantId,
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
        platformPrisma.user.findMany({
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
            customRoleId: true,
          },
        }),
        platformPrisma.user.count({ where }),
      ]);

      return { items, total, page, limit, tenant };
    }),

  create: platformOrTenantAdminProcedure("tenant_management", "write")
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          name: z.string().min(1),
          username: z.string().min(3).max(50),
          role: z.enum(["tenant_admin", "encoder", "viewer", "bantay_dagat"]),
          password: z.string().min(12),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, name, username, role, password } = input;

      const tenant = await platformPrisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true },
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });

      const existingUser = await platformPrisma.user.findFirst({
        where: { username },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const email = `${username}@${tenant.slug}.local`;

      const user = await platformPrisma.user.create({
        data: {
          username,
          email,
          name,
          passwordHash,
          role,
          status: "ACTIVE",
          tenantId,
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

      await platformPrisma.auditLog.create({
        data: {
          tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "User",
          entityId: user.id,
          after: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: String(user.role),
            status: String(user.status),
          },
        },
      });

      return user;
    }),

  resetPassword: platformOrTenantAdminProcedure("tenant_management", "update")
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          userId: z.string().cuid(),
          newPassword: z.string().min(12),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, newPassword } = input;

      const user = await platformPrisma.user.findFirst({
        where: { id: userId, tenantId },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await platformPrisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          securityVersion: { increment: 1 },
        },
      });

      await platformPrisma.auditLog.create({
        data: {
          tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: userId,
          after: { passwordReset: true },
        },
      });

      return { id: userId };
    }),

  setStatus: platformOrTenantAdminProcedure("tenant_management", "update")
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          userId: z.string().cuid(),
          status: z.enum(["ACTIVE", "DEACTIVATED"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, status } = input;

      const user = await platformPrisma.user.findFirst({
        where: { id: userId, tenantId },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        status === "DEACTIVATED" &&
        user.role === "tenant_superadmin" &&
        user.status === "ACTIVE"
      ) {
        const activeAdminCount = await platformPrisma.user.count({
          where: { tenantId, role: "tenant_superadmin", status: "ACTIVE" },
        });
        if (activeAdminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot deactivate the only active admin.",
          });
        }
      }

      const updated = await platformPrisma.user.update({
        where: { id: userId },
        data: {
          status,
          securityVersion: { increment: 1 },
        },
        select: { id: true, status: true },
      });

      await platformPrisma.auditLog.create({
        data: {
          tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "User",
          entityId: userId,
          before: { status: String(user.status) },
          after: { status: String(status) },
        },
      });

      return { id: updated.id, status: updated.status };
    }),
});
