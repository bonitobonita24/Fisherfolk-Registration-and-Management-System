import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Municipal household-interconnection network (FIS-24). Barangay-level only —
 * no GPS is collected, so every position downstream is resolved to a
 * barangay centroid client-side. This procedure just returns the raw
 * household → head/members graph for the tenant.
 */
export const householdNetworkRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

    const households = await ctx.db.household.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { householdNumber: "asc" },
      select: {
        id: true,
        householdNumber: true,
        head: {
          select: {
            id: true,
            fullName: true,
            barangay: true,
            latitude: true,
            longitude: true,
          },
        },
        members: {
          select: {
            id: true,
            fullName: true,
            barangay: true,
            latitude: true,
            longitude: true,
          },
        },
        families: {
          orderBy: { familyNumber: "asc" },
          select: {
            id: true,
            familyNumber: true,
            headId: true,
            head: { select: { id: true, fullName: true, barangay: true, latitude: true, longitude: true } },
            members: { select: { id: true, fullName: true, barangay: true, latitude: true, longitude: true } },
          },
        },
      },
    });

    return households.map((h) => ({
      id: h.id,
      householdNumber: h.householdNumber,
      head: h.head,
      members: h.members,
      families: h.families,
    }));
  }),
});
