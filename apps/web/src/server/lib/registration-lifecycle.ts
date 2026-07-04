import type { ExtendedPrismaClient } from "@frms/db";

/**
 * Resets annual registrations by marking ACTIVE or RENEWED fisherfolk
 * whose registrationYear is older than the current registration year as INACTIVE.
 *
 * Idempotent: calling twice returns count 0 on the second call.
 *
 * @param db       - The tenant-scoped Prisma client
 * @param tenantId - The tenant to scope the update to
 * @param currentRegistrationYear - The current registration year; records with older years are deactivated
 * @returns        { count } — number of records updated
 */
export async function resetAnnualRegistrations(
  db: ExtendedPrismaClient,
  tenantId: string,
  currentRegistrationYear: number,
): Promise<{ count: number }> {
  const result = await db.fisherfolk.updateMany({
    where: {
      tenantId,
      status: { in: ["ACTIVE", "RENEWED"] },
      registrationYear: { lt: currentRegistrationYear },
    },
    data: { status: "INACTIVE" },
  });

  return { count: result.count };
}
