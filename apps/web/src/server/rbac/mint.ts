/**
 * loadCustomRoleView() — mints the "view" slice of a user's custom-role
 * matrix for embedding into the NextAuth JWT/session. PD-005 Chunk 4.
 *
 * MIRRORS `computeActorMatrix()` in `./resolve.ts` — same DB shape
 * (`User.customRoleId` → `CustomRole.isActive` → `RolePermission` rows),
 * same `intersectWithCeiling()` clamp, same deny-by-default semantics. Kept
 * as a separate function (not imported from resolve.ts) because this runs
 * once at sign-in from `authorize()` (no `TRPCContext`/`ctx.db` available
 * there — only a raw Prisma client), while `resolveActorMatrix()` is the
 * per-request tRPC-side resolver. If resolve.ts's DB-loading logic changes,
 * mirror the change here too.
 *
 * SECURITY CONTRACT
 *   - Deny-by-default: no `customRoleId` → `null` (caller falls back to the
 *     domain-role preset, same as resolve.ts). An INACTIVE custom role →
 *     `[]` (view nothing — fail closed, matches resolve.ts's `matrix: {}`).
 *   - Only ever called for domain-role tiers (`encoder`/`viewer`/
 *     `bantay_dagat`) — the 3 fixed system tiers never carry a
 *     `customRoleId` (tenant-rbac-standard.md §4) and must never be passed
 *     into this function.
 *   - `db` accepts any Prisma client shaped like `PrismaClient` — callers
 *     pass `platformPrisma` (no ALS/tenant context exists at sign-in time).
 */
import type { PrismaClient } from "@frms/db";

import { intersectWithCeiling } from "@frms/shared/rbac";
import type { FeatureKey, PermissionMatrix } from "@frms/shared/rbac";

export async function loadCustomRoleView(
  db: PrismaClient,
  userId: string,
  tenantId: string,
): Promise<FeatureKey[] | null> {
  const user = await db.user.findFirst({
    where: { id: userId, tenantId },
    select: {
      customRoleId: true,
      customRole: { select: { isActive: true } },
    },
  });

  if (!user?.customRoleId) {
    return null;
  }

  // A DEACTIVATED custom role denies everything (fail closed) — mirrors
  // resolve.ts's `matrix: {}` for the same case.
  if (user.customRole?.isActive === false) {
    return [];
  }

  const rows = await db.rolePermission.findMany({
    where: { roleId: user.customRoleId, tenantId },
    select: { featureKey: true, view: true, write: true, update: true, delete: true },
  });

  const raw: PermissionMatrix = {};
  for (const row of rows) {
    raw[row.featureKey] = {
      view: row.view,
      write: row.write,
      update: row.update,
      delete: row.delete,
    };
  }

  const clamped = intersectWithCeiling(raw);

  return (
    Object.entries(clamped) as [FeatureKey, NonNullable<PermissionMatrix[FeatureKey]>][]
  )
    .filter(([, grant]) => grant.view)
    .map(([featureKey]) => featureKey);
}
