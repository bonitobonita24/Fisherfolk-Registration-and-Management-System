/**
 * customRole router — PD-005 Chunk 6.
 *
 * CRUD over the data-driven custom-role permission-matrix layer
 * (tenant-rbac-standard.md §4): `CustomRole` + `RolePermission` rows below
 * the fixed 3-tier system roles, plus `assignToUser` to attach/clear a
 * user's `customRoleId` overlay.
 *
 * AUTHORIZATION — every procedure is `tenantSuperadminProcedure`
 * (tenant_manager or tenant_superadmin only), per tenant-rbac-standard.md
 * §4 "Only `tenant_superadmin` (and platform `tenant_manager`) may
 * create/edit/assign custom roles."
 *
 * DB ACCESS PATTERN — mirrors tenantUser.ts: writes go through
 * `platformPrisma` (the unguarded client) with an EXPLICIT `tenantId` in
 * every where-clause, because `tenant_manager` callers have `tenantId:
 * null` (no ALS/runWithTenant context) and the guarded `prisma` client
 * would throw "Tenant context not set" for them. Every query below scopes
 * explicitly by `tenantId` regardless, so this is safe for tenant_superadmin
 * callers too.
 *
 * CEILING ENFORCEMENT — `intersectWithCeiling()` runs on every persisted
 * grant (create + update) as defense-in-depth: the ceiling is currently
 * all-true for every real FeatureKey, so its practical effect today is
 * dropping any key that is not a valid FeatureKey (billing/user_management
 * are structurally impossible — they are not FeatureKey values at all, so
 * the zod `z.enum(FEATURE_KEYS)` input schema already rejects them before
 * this ever runs).
 *
 * ASSIGNMENT DESIGN — `assignToUser` sets `User.customRoleId` as an
 * OVERLAY on top of the existing fixed `role` enum (never swaps the enum
 * value). This matches the Chunk-1 schema design note (schema.prisma
 * `model User` — "Independent of the fixed `role` tier") and
 * `resolveActorMatrix()` (`../rbac/resolve.ts`), which only consults
 * `customRoleId` for the domain-role tiers (`encoder` / `viewer` /
 * `bantay_dagat`) and short-circuits BEFORE any DB lookup for the 3 fixed
 * system tiers. Assigning a custom role to a `tenant_admin` /
 * `tenant_superadmin` / `tenant_manager` user would therefore silently do
 * nothing at read time — `assignToUser` refuses it outright (FORBIDDEN)
 * rather than persist a no-op.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { platformPrisma } from "@frms/db";
import { FEATURE_KEYS, intersectWithCeiling } from "@frms/shared/rbac";
import type { PermissionMatrix } from "@frms/shared/rbac";

import { createTRPCRouter, tenantSuperadminProcedure } from "../trpc";

/** Domain roles that MAY carry a customRoleId overlay — see resolve.ts FIXED_TIER_ROLES. */
const ASSIGNABLE_ROLES = new Set(["encoder", "viewer", "bantay_dagat"]);

const permissionGrantSchema = z
  .object({
    featureKey: z.enum(FEATURE_KEYS),
    view: z.boolean().default(false),
    write: z.boolean().default(false),
    update: z.boolean().default(false),
    delete: z.boolean().default(false),
  })
  .strict();

const nameSchema = z.string().trim().min(1).max(60);

/** Shapes a PermissionMatrix (from CustomRole.permissions rows) into the wire array. */
function matrixToPermissionsArray(
  permissions: {
    featureKey: string;
    view: boolean;
    write: boolean;
    update: boolean;
    delete: boolean;
  }[],
) {
  return permissions.map((p) => ({
    featureKey: p.featureKey,
    view: p.view,
    write: p.write,
    update: p.update,
    delete: p.delete,
  }));
}

/** Builds a clamped PermissionMatrix from the wire-format grants array. */
function toClampedMatrix(
  grants: z.infer<typeof permissionGrantSchema>[],
): PermissionMatrix {
  const raw: PermissionMatrix = {};
  for (const g of grants) {
    raw[g.featureKey] = {
      view: g.view,
      write: g.write,
      update: g.update,
      delete: g.delete,
    };
  }
  return intersectWithCeiling(raw);
}

async function assertTenantExists(tenantId: string) {
  const tenant = await platformPrisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });
  if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
}

export const customRoleRouter = createTRPCRouter({
  list: tenantSuperadminProcedure
    .input(z.object({ tenantId: z.string().cuid() }).strict())
    .query(async ({ input }) => {
      const { tenantId } = input;
      await assertTenantExists(tenantId);

      const roles = await platformPrisma.customRole.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        include: {
          permissions: {
            select: { featureKey: true, view: true, write: true, update: true, delete: true },
          },
          _count: { select: { users: true } },
        },
      });

      return roles.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        name: r.name,
        description: r.description,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userCount: r._count.users,
        permissions: matrixToPermissionsArray(r.permissions),
      }));
    }),

  getById: tenantSuperadminProcedure
    .input(z.object({ tenantId: z.string().cuid(), id: z.string().cuid() }).strict())
    .query(async ({ input }) => {
      const { tenantId, id } = input;

      const role = await platformPrisma.customRole.findFirst({
        where: { id, tenantId },
        include: {
          permissions: {
            select: { featureKey: true, view: true, write: true, update: true, delete: true },
          },
          _count: { select: { users: true } },
        },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        id: role.id,
        tenantId: role.tenantId,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        permissions: matrixToPermissionsArray(role.permissions),
      };
    }),

  create: tenantSuperadminProcedure
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          name: nameSchema,
          description: z.string().trim().max(500).optional(),
          permissions: z.array(permissionGrantSchema).default([]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, name, description, permissions } = input;
      await assertTenantExists(tenantId);

      const existing = await platformPrisma.customRole.findFirst({
        where: { tenantId, name },
        select: { id: true },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A custom role with this name already exists.",
        });
      }

      const clamped = toClampedMatrix(permissions);

      const created = await platformPrisma.$transaction(async (tx) => {
        const role = await tx.customRole.create({
          data: {
            tenantId,
            name,
            description: description ?? null,
          },
        });

        const rows = Object.entries(clamped) as [
          keyof PermissionMatrix,
          NonNullable<PermissionMatrix[keyof PermissionMatrix]>,
        ][];
        if (rows.length > 0) {
          await tx.rolePermission.createMany({
            data: rows.map(([featureKey, grant]) => ({
              tenantId,
              roleId: role.id,
              featureKey,
              view: grant.view,
              write: grant.write,
              update: grant.update,
              delete: grant.delete,
            })),
          });
        }

        await tx.auditLog.create({
          data: {
            tenantId,
            userId: ctx.userId!,
            action: "CREATE",
            entityType: "CustomRole",
            entityId: role.id,
            after: {
              id: role.id,
              name: role.name,
              description: role.description,
              permissions: rows.map(([featureKey, grant]) => ({ featureKey, ...grant })),
            },
          },
        });

        return role;
      });

      return { id: created.id };
    }),

  update: tenantSuperadminProcedure
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          id: z.string().cuid(),
          name: nameSchema.optional(),
          description: z.string().trim().max(500).optional(),
          permissions: z.array(permissionGrantSchema).optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, id, name, description, permissions } = input;

      const before = await platformPrisma.customRole.findFirst({
        where: { id, tenantId },
        select: { id: true, name: true, description: true },
      });
      if (!before) throw new TRPCError({ code: "NOT_FOUND" });

      if (name && name !== before.name) {
        const dup = await platformPrisma.customRole.findFirst({
          where: { tenantId, name, id: { not: id } },
          select: { id: true },
        });
        if (dup) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A custom role with this name already exists.",
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
          | { featureKey: string; view: boolean; write: boolean; update: boolean; delete: boolean }[]
          | undefined;

        if (permissions !== undefined) {
          const clamped = toClampedMatrix(permissions);
          await tx.rolePermission.deleteMany({ where: { roleId: id, tenantId } });

          const rows = Object.entries(clamped) as [
            keyof PermissionMatrix,
            NonNullable<PermissionMatrix[keyof PermissionMatrix]>,
          ][];
          if (rows.length > 0) {
            await tx.rolePermission.createMany({
              data: rows.map(([featureKey, grant]) => ({
                tenantId,
                roleId: id,
                featureKey,
                view: grant.view,
                write: grant.write,
                update: grant.update,
                delete: grant.delete,
              })),
            });
          }
          permissionsAfter = rows.map(([featureKey, grant]) => ({ featureKey, ...grant }));
        }

        // Bump securityVersion for every user currently assigned this role
        // — an edited matrix must invalidate their existing session, same
        // reasoning as assignToUser above.
        await tx.user.updateMany({
          where: { customRoleId: id, tenantId },
          data: { securityVersion: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId: ctx.userId!,
            action: "UPDATE",
            entityType: "CustomRole",
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

  delete: tenantSuperadminProcedure
    .input(z.object({ tenantId: z.string().cuid(), id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      const { tenantId, id } = input;

      const role = await platformPrisma.customRole.findFirst({
        where: { id, tenantId },
        select: { id: true, name: true },
      });
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const assignedCount = await platformPrisma.user.count({
        where: { customRoleId: id, tenantId },
      });
      if (assignedCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete: ${assignedCount} user(s) are still assigned this role. Reassign or clear them first.`,
        });
      }

      await platformPrisma.$transaction(async (tx) => {
        // Defense-in-depth against a TOCTOU race with the `assignedCount`
        // guard above: bump securityVersion for anyone still pointing at
        // this role (should be none) BEFORE the role row is gone, so a
        // straggler's stale customView can never survive the delete.
        await tx.user.updateMany({
          where: { customRoleId: id, tenantId },
          data: { securityVersion: { increment: 1 } },
        });

        await tx.rolePermission.deleteMany({ where: { roleId: id, tenantId } });
        await tx.customRole.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId: ctx.userId!,
            action: "DELETE",
            entityType: "CustomRole",
            entityId: id,
            before: { id: role.id, name: role.name },
          },
        });
      });

      return { id };
    }),

  assignToUser: tenantSuperadminProcedure
    .input(
      z
        .object({
          tenantId: z.string().cuid(),
          userId: z.string().cuid(),
          customRoleId: z.string().cuid().nullable(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, customRoleId } = input;

      const user = await platformPrisma.user.findFirst({
        where: { id: userId, tenantId },
        select: { id: true, role: true, customRoleId: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      if (!ASSIGNABLE_ROLES.has(user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Custom roles cannot be assigned to a fixed system tier (tenant_admin/tenant_superadmin/tenant_manager).",
        });
      }

      if (customRoleId) {
        const role = await platformPrisma.customRole.findFirst({
          where: { id: customRoleId, tenantId },
          select: { id: true },
        });
        if (!role) throw new TRPCError({ code: "NOT_FOUND", message: "Custom role not found." });
      }

      await platformPrisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          // Bump securityVersion so the target user's existing session is
          // invalidated on next read (V28 hardening, index.ts session
          // callback) — a customView change must not persist stale in an
          // already-minted JWT/session.
          data: { customRoleId, securityVersion: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            tenantId,
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
