import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

// P2002 = Prisma unique-constraint violation. Duck-typed to avoid a hard
// dependency on the Prisma error class import (TS-strict safe).
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function formatFamilyNumber(seq: number): string {
  return `F-${String(seq).padStart(2, "0")}`;
}

const create = protectedProcedure
  .input(
    z
      .object({
        householdId: z.string().cuid(),
        headId: z.string().cuid(),
        memberIds: z.array(z.string().cuid()).default([]),
        notes: z.string().optional(),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId = ctx.tenantId;

    const household = await ctx.db.household.findFirst({
      where: { id: input.householdId, tenantId },
      select: { id: true },
    });
    if (!household) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Household not found in this tenant.",
      });
    }

    const memberIds = input.memberIds.filter((id) => id !== input.headId);

    const head = await ctx.db.fisherfolk.findFirst({
      where: { id: input.headId, tenantId },
      select: { id: true, householdId: true, familyId: true },
    });
    if (!head) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Head fisherfolk not found in this tenant.",
      });
    }
    if (head.householdId !== input.householdId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Head must be a member of this household.",
      });
    }

    if (memberIds.length > 0) {
      const members = await ctx.db.fisherfolk.findMany({
        where: { id: { in: memberIds }, tenantId },
        select: { id: true, householdId: true },
      });
      if (members.length !== memberIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more members were not found in this tenant.",
        });
      }
      const outsider = members.find((m) => m.householdId !== input.householdId);
      if (outsider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All family members must belong to this household.",
        });
      }
    }

    const MAX_ATTEMPTS = 8;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const count = await ctx.db.family.count({
        where: { householdId: input.householdId },
      });
      const familyNumber = formatFamilyNumber(count + 1 + attempt);

      try {
        const created = await ctx.db.$transaction(async (tx) => {
          const family = await tx.family.create({
            data: {
              tenantId,
              householdId: input.householdId,
              familyNumber,
              headId: input.headId,
              notes: input.notes ?? null,
            },
            select: { id: true },
          });

          await tx.fisherfolk.update({
            where: { id: input.headId },
            data: { familyId: family.id },
          });

          if (memberIds.length > 0) {
            await tx.fisherfolk.updateMany({
              where: { id: { in: memberIds }, tenantId },
              data: { familyId: family.id },
            });
          }

          return family;
        });

        return { id: created.id };
      } catch (error) {
        if (isUniqueViolation(error)) continue;
        throw error;
      }
    }

    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Could not create the family (head may already lead a family, or numbering clashed).",
    });
  });

const update = protectedProcedure
  .input(
    z
      .object({
        id: z.string().cuid(),
        addMemberIds: z.array(z.string().cuid()).optional(),
        removeMemberIds: z.array(z.string().cuid()).optional(),
        newHeadId: z.string().cuid().optional(),
        notes: z.string().optional(),
      })
      .strict(),
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId = ctx.tenantId;

    const family = await ctx.db.family.findFirst({
      where: { id: input.id, tenantId },
      select: { id: true, householdId: true, headId: true },
    });
    if (!family) throw new TRPCError({ code: "NOT_FOUND" });

    const addMemberIds = input.addMemberIds ?? [];
    const removeMemberIds = input.removeMemberIds ?? [];

    if (removeMemberIds.includes(family.headId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot remove the family head. Change the head first.",
      });
    }

    if (addMemberIds.length > 0) {
      const candidates = await ctx.db.fisherfolk.findMany({
        where: { id: { in: addMemberIds }, tenantId },
        select: { id: true, householdId: true },
      });
      if (candidates.length !== addMemberIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more members were not found in this tenant.",
        });
      }
      const outsider = candidates.find(
        (c) => c.householdId !== family.householdId,
      );
      if (outsider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New family members must belong to the same household.",
        });
      }
    }

    await ctx.db.$transaction(async (tx) => {
      if (removeMemberIds.length > 0) {
        await tx.fisherfolk.updateMany({
          where: {
            id: { in: removeMemberIds },
            tenantId,
            familyId: family.id,
          },
          data: { familyId: null },
        });
      }

      if (addMemberIds.length > 0) {
        await tx.fisherfolk.updateMany({
          where: { id: { in: addMemberIds }, tenantId },
          data: { familyId: family.id },
        });
      }

      if (input.newHeadId && input.newHeadId !== family.headId) {
        const candidate = await tx.fisherfolk.findFirst({
          where: { id: input.newHeadId, tenantId },
          select: { id: true, familyId: true },
        });
        if (!candidate || candidate.familyId !== family.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New head must be a current member of this family.",
          });
        }
        await tx.family.update({
          where: { id: family.id },
          data: { headId: input.newHeadId },
        });
      }

      if (input.notes !== undefined) {
        await tx.family.update({
          where: { id: family.id },
          data: { notes: input.notes },
        });
      }
    });

    return { id: family.id };
  });

const remove = protectedProcedure
  .input(z.object({ id: z.string().cuid() }).strict())
  .mutation(async ({ ctx, input }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId = ctx.tenantId;

    const family = await ctx.db.family.findFirst({
      where: { id: input.id, tenantId },
      select: { id: true },
    });
    if (!family) throw new TRPCError({ code: "NOT_FOUND" });

    await ctx.db.$transaction(async (tx) => {
      await tx.fisherfolk.updateMany({
        where: { familyId: family.id, tenantId },
        data: { familyId: null },
      });
      await tx.family.delete({ where: { id: family.id } });
    });

    return { ok: true as const };
  });

export const familyRouter = createTRPCRouter({ create, update, remove });
