import { runWithTenant, type ExtendedPrismaClient } from "@frms/db";

/**
 * Post-election bulk-expire: marks ALL currently-valid (NEW or RENEWED)
 * fisherfolk in the tenant as EXPIRED, flagging them for renewal.
 *
 * Idempotent: calling twice returns count 0 on the second call (no NEW/RENEWED
 * records left to expire).
 *
 * Establishes its own tenant context via runWithTenant so the guarded Prisma
 * client's tenant-guard extension is satisfied. This makes the helper reusable
 * from ANY caller — the tRPC admin mutation (which already sets context; nesting
 * is harmless) AND a future cron/CLI path that has no request middleware.
 *
 * Writes one AuditLog row (action EXPIRE) recording the affected count.
 *
 * @param db           - The tenant-scoped (guarded) Prisma client
 * @param tenantId     - The tenant to scope the update to
 * @param actorUserId  - The user performing the bulk expire, for audit attribution
 * @returns            { count } — number of records updated
 */
export async function resetAnnualRegistrations(
  db: ExtendedPrismaClient,
  tenantId: string,
  actorUserId: string,
): Promise<{ count: number }> {
  const result = await runWithTenant(tenantId, async () => {
    const updated = await db.fisherfolk.updateMany({
      where: {
        tenantId,
        status: { in: ["NEW", "RENEWED"] },
      },
      data: { status: "EXPIRED" },
    });

    await db.auditLog.create({
      data: {
        tenantId,
        userId: actorUserId,
        action: "EXPIRE",
        entityType: "Fisherfolk",
        entityId: tenantId,
        after: { affectedCount: updated.count } as Record<string, unknown>,
      },
    });

    return updated;
  });

  return { count: result.count };
}
