/**
 * platformRole router — Milestone 2 of the Site Access & Tenancy Bootstrap
 * Standard (docs/SITE_ACCESS_STANDARD.md §2).
 *
 * CRUD over the platform-tier (`/tm`) curated-role permission-matrix layer:
 * `CustomRole` (scope='platform', tenantId=NULL) + `PlatformRolePermission`
 * rows, plus `assignToUser` / `unassignFromUser` to attach/clear a platform
 * user's `customRoleId` overlay. Structurally mirrors `customRole.ts`
 * (PD-005 Chunk 6) but is CODE-DISJOINT from it: this router never touches
 * `RolePermission` (tenant-domain) and never returns/edits a scope='tenant'
 * row; `customRole.ts` is hard-filtered to never return/edit a
 * scope='platform' row (see that file's `where: { scope: "tenant", ... }`
 * additions).
 *
 * AUTHORIZATION — every procedure is `platformMatrixProcedure`, gated on
 * `PlatformPermissionKey "tenant_management"` (docs/SITE_ACCESS_STANDARD.md
 * §2: "only the /tm ADMIN creates/edits/assigns platform roles" — ADMIN is
 * the un-matrixed `tenant_manager` default, which always resolves true; a
 * BILLING/TECH-SUPPORT curated role only reaches these procedures if it was
 * explicitly ALSO granted `tenant_management`). `view` gates the two reads
 * so a restricted platform actor cannot even list/browse platform roles
 * without that grant — deny-by-default, same posture as every other surface
 * in this codebase.
 *
 * DB ACCESS PATTERN — `platformPrisma` (the unguarded client) throughout,
 * mirroring `customRole.ts` / `tenant.ts`: platform rows have no tenantId to
 * scope a guarded query by, and `ctx.tenantId` is always null for a
 * `tenant_manager` caller regardless.
 *
 * CEILING ENFORCEMENT — `intersectWithPlatformCeiling()` runs on every
 * persisted grant (create + update) as defense-in-depth (mirrors
 * `customRole.ts`'s `intersectWithCeiling()` usage).
 *
 * CROSS-SCOPE GUARDS (docs/SITE_ACCESS_STANDARD.md rollout item 6):
 *   (a) `assignToUser` refuses to assign a scope='platform' role to a
 *       non-`tenant_manager` user (FORBIDDEN).
 *   (b) `assignToUser` is only reachable by/for `tenant_manager` accounts in
 *       the first place — a tenant-scoped account (tenant_superadmin /
 *       tenant_admin / domain roles) is refused via the same role check as
 *       (a), which also covers "never assign a platform role to a
 *       tenant-scoped user".
 *   (c) `create`/`update` only ever persist `PlatformRolePermission` rows
 *       keyed by the `PlatformPermissionKey` enum — a tenant `FeatureKey`
 *       value is structurally impossible here (the zod input schema is
 *       `z.enum(PLATFORM_PERMISSION_KEYS)`), so a platform role can never be
 *       created with a tenant-domain grant, and `customRole.ts`'s own
 *       `z.enum(FEATURE_KEYS)` input schema makes the mirror-image
 *       impossible for tenant roles.
 *   (d) The reverse of (a) — assigning a scope='tenant' role to a
 *       `tenant_manager` platform account — is rejected by `customRole.ts`'s
 *       `assignToUser`, whose `ASSIGNABLE_ROLES` set already excludes
 *       `tenant_manager` (unaffected by this milestone; verified in the
 *       cross-scope test suite alongside this router's guards).
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { platformPrisma } from "@frms/db";
import {
  PLATFORM_PERMISSION_KEYS,
  intersectWithPlatformCeiling,
  type PlatformPermissionMatrix,
} from "@frms/shared/rbac";

import { createTRPCRouter, platformMatrixProcedure } from "../trpc";

const permissionGrantSchema = z
  .object({
    permissionKey: z.enum(PLATFORM_PERMISSION_KEYS),
    view: z.boolean().default(false),
    write: z.boolean().default(false),
    update: z.boolean().default(false),
    delete: z.boolean().default(false),
  })
  .strict();

const nameSchema = z.string().trim().min(1).max(60);

function matrixToPermissionsArray(
  permissions: {
    permissionKey: string;
    view: boolean;
    write: boolean;
    update: boolean;
    delete: boolean;
  }[],
) {
  return permissions.map((p) => ({
    permissionKey: p.permissionKey,
    view: p.view,
    write: p.write,
    update: p.update,
    delete: p.delete,
  }));
}

function toClampedMatrix(
  grants: z.infer<typeof permissionGrantSchema>[],
): PlatformPermissionMatrix {
  const raw: PlatformPermissionMatrix = {};
  for (const g of grants) {
    raw[g.permissionKey] = {
      view: g.view,
      write: g.write,
      update: g.update,
      delete: g.delete,
    };
  }
  return intersectWithPlatformCeiling(raw);
}

export const platformRoleRouter = createTRPCRouter({
  list: platformMatrixProcedure("tenant_management", "view").query(async () => {
    const roles = await platformPrisma.customRole.findMany({
      where: { scope: "platform", tenantId: null },
      orderBy: { createdAt: "desc" },
      include: {
        platformPermissions: {
          select: { permissionKey: true, view: true, write: true, update: true, delete: true },
        },
        _count: { select: { users: true } },
      },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userCount: r._count.users,
      permissions: matrixToPermissionsArray(r.platformPermissions),
    }));
  }),

  getById: platformMatrixProcedure("tenant_management", "view")
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ input }) => {
      const role = await platformPrisma.customRole.findFirst({
        where: { id: input.id, scope: "platform", tenantId: null },
        include: {
          platformPermissions: {
            select: { permissionKey: true, view: true, write: true, update: true, delete: true },
          },
          _count: { select: { users: true } },
        },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        permissions: matrixToPermissionsArray(role.platformPermissions),
      };
    }),

  create: platformMatrixProcedure("tenant_management", "write")
    .input(
      z
        .object({
          name: nameSchema,
          description: z.string().trim().max(500).optional(),
          permissions: z.array(permissionGrantSchema).default([]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, description, permissions } = input;

      const existing = await platformPrisma.customRole.findFirst({
        where: { scope: "platform", tenantId: null, name },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A platform role with this name already exists.",
        });
      }

      const clamped = toClampedMatrix(permissions);

      const created = await platformPrisma.$transaction(async (tx) => {
        const role = await tx.customRole.create({
          data: {
            scope: "platform",
            tenantId: null,
            name,
            description: description ?? null,
          },
        });

        const rows = Object.entries(clamped) as [
          keyof PlatformPermissionMatrix,
          NonNullable<PlatformPermissionMatrix[keyof PlatformPermissionMatrix]>,
        ][];
        if (rows.length > 0) {
          await tx.platformRolePermission.createMany({
            data: rows.map(([permissionKey, grant]) => ({
              roleId: role.id,
              permissionKey,
              view: grant.view,
              write: grant.write,
              update: grant.update,
              delete: grant.delete,
            })),
          });
        }

        await tx.auditLog.create({
          data: {
            tenantId: null,
            userId: ctx.userId!,
            action: "CREATE",
            entityType: "PlatformRole",
            entityId: role.id,
            after: {
              id: role.id,
              name: role.name,
              description: role.description,
              permissions: rows.map(([permissionKey, grant]) => ({ permissionKey, ...grant })),
            },
          },
        });

        return role;
      });

      return { id: created.id };
    }),

  update: platformMatrixProcedure("tenant_management", "update")
    .input(
      z
        .object({
          id: z.string().cuid(),
          name: nameSchema.optional(),
          description: z.string().trim().max(500).optional(),
          permissions: z.array(permissionGrantSchema).optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, description, permissions } = input;

      const before = await platformPrisma.customRole.findFirst({
        where: { id, scope: "platform", tenantId: null },
        select: { id: true, name: true, description: true },
      });
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });

      if (name && name !== before.name) {
        const dup = await platformPrisma.customRole.findFirst({
          where: { scope: "platform", tenantId: null, name, id: { not: id } },
          select: { id: true },
        });
        if (dup) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A platform role with this name already exists.",
          });
        }
      }

      await platformPrisma.$transaction(async (tx) => {
        await tx.customRole.update({
          where: { id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(description !== undefined ? { description } : {}),
          },
        });

        let permissionsAfter:
          | { permissionKey: string; view: boolean; write: boolean; update: boolean; delete: boolean }[]
          | undefined;

        if (permissions !== undefined) {
          const clamped = toClampedMatrix(permissions);
          await tx.platformRolePermission.deleteMany({ where: { roleId: id } });

          const rows = Object.entries(clamped) as [
            keyof PlatformPermissionMatrix,
            NonNullable<PlatformPermissionMatrix[keyof PlatformPermissionMatrix]>,
          ][];
          if (rows.length > 0) {
            await tx.platformRolePermission.createMany({
              data: rows.map(([permissionKey, grant]) => ({
                roleId: id,
                permissionKey,
                view: grant.view,
                write: grant.write,
                update: grant.update,
                delete: grant.delete,
              })),
            });
          }
          permissionsAfter = rows.map(([permissionKey, grant]) => ({ permissionKey, ...grant }));
        }

        // Bump securityVersion for every user currently assigned this
        // platform role — an edited matrix must invalidate their existing
        // session, mirrors customRole.ts's update procedure.
        await tx.user.updateMany({
          where: { customRoleId: id },
          data: { securityVersion: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            tenantId: null,
            userId: ctx.userId!,
            action: "UPDATE",
            entityType: "PlatformRole",
            entityId: id,
            before: { name: before.name, description: before.description },
            after: {
              ...(name !== undefined ? { name } : {}),
              ...(description !== undefined ? { description } : {}),
              ...(permissionsAfter !== undefined ? { permissions: permissionsAfter } : {}),
            },
          },
        });
      });

      return { id };
    }),

  delete: platformMatrixProcedure("tenant_management", "delete")
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const role = await platformPrisma.customRole.findFirst({
        where: { id, scope: "platform", tenantId: null },
        select: { id: true, name: true },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const assignedCount = await platformPrisma.user.count({
        where: { customRoleId: id },
      });
      if (assignedCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete: ${assignedCount} user(s) are still assigned this role. Reassign or clear them first.`,
        });
      }

      await platformPrisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { customRoleId: id },
          data: { securityVersion: { increment: 1 } },
        });

        await tx.platformRolePermission.deleteMany({ where: { roleId: id } });
        await tx.customRole.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            tenantId: null,
            userId: ctx.userId!,
            action: "DELETE",
            entityType: "PlatformRole",
            entityId: id,
            before: { id: role.id, name: role.name },
          },
        });
      });

      return { id };
    }),

  assignToUser: platformMatrixProcedure("tenant_management", "update")
    .input(
      z
        .object({
          userId: z.string().cuid(),
          customRoleId: z.string().cuid().nullable(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, customRoleId } = input;

      const user = await platformPrisma.user.findFirst({
        where: { id: userId },
        select: { id: true, role: true, customRoleId: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // CROSS-SCOPE GUARD (a): a scope='platform' role may only ever be
      // assigned to a `tenant_manager` account — never a tenant-scoped user
      // (tenant_superadmin / tenant_admin / domain roles).
      if (user.role !== "tenant_manager") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Platform roles can only be assigned to a tenant_manager (platform) account.",
        });
      }

      if (customRoleId) {
        const role = await platformPrisma.customRole.findFirst({
          where: { id: customRoleId, scope: "platform", tenantId: null },
          select: { id: true },
        });
        if (!role) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Platform role not found." });
        }
      }

      await platformPrisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { customRoleId, securityVersion: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            tenantId: null,
            userId: ctx.userId!,
            action: "UPDATE",
            entityType: "User",
            entityId: userId,
            before: { customRoleId: user.customRoleId },
            after: { customRoleId },
          },
        });
      });

      return { id: userId, customRoleId };
    }),
});
