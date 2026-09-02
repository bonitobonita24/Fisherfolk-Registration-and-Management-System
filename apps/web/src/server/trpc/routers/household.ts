import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

// ─── FisherfolkLite selection (shared shape for pickers + detail) ─────────────

const fisherfolkLiteSelect = {
  id: true,
  idNumber: true,
  fullName: true,
  barangay: true,
  categoryIds: true,
  photo: true,
  latitude: true,
  longitude: true,
};

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

function formatHouseholdNumber(sequence: number): string {
  return `HH-${sequence.toString().padStart(4, "0")}`;
}

export const householdRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(20),
          search: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(search && {
          OR: [
            {
              householdNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            { barangay: { contains: search, mode: "insensitive" as const } },
            {
              head: {
                fullName: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }),
      };

      const [rows, total] = await Promise.all([
        ctx.db.household.findMany({
          where,
          skip,
          take: limit,
          orderBy: { householdNumber: "asc" },
          select: {
            id: true,
            householdNumber: true,
            barangay: true,
            head: {
              select: { id: true, fullName: true, categoryIds: true },
            },
            _count: { select: { members: true, families: true } },
          },
        }),
        ctx.db.household.count({ where }),
      ]);

      const items = rows.map((row) => ({
        id: row.id,
        householdNumber: row.householdNumber,
        barangay: row.barangay,
        head: row.head,
        memberCount: row._count.members,
        familyCount: row._count.families,
      }));

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const household = await ctx.db.household.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          head: { select: fisherfolkLiteSelect },
          members: {
            orderBy: { fullName: "asc" },
            select: fisherfolkLiteSelect,
          },
          families: {
            orderBy: { familyNumber: "asc" },
            select: {
              id: true,
              familyNumber: true,
              notes: true,
              head: { select: fisherfolkLiteSelect },
              members: { orderBy: { fullName: "asc" }, select: fisherfolkLiteSelect },
            },
          },
        },
      });
      if (!household) throw new TRPCError({ code: "NOT_FOUND" });
      return household;
    }),

  availableFisherfolk: protectedProcedure
    .input(
      z
        .object({
          search: z.string(),
          excludeHouseholdId: z.string().cuid().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { search, excludeHouseholdId } = input;

      const conditions: Array<Record<string, unknown>> = [
        excludeHouseholdId
          ? { OR: [{ householdId: null }, { householdId: excludeHouseholdId }] }
          : { householdId: null },
      ];
      if (search) {
        conditions.push({
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { idNumber: { contains: search, mode: "insensitive" as const } },
          ],
        });
      }

      return ctx.db.fisherfolk.findMany({
        where: { tenantId: ctx.tenantId, AND: conditions },
        take: 20,
        orderBy: { fullName: "asc" },
        select: fisherfolkLiteSelect,
      });
    }),

  create: protectedProcedure
    .input(
      z
        .object({
          headId: z.string().cuid(),
          memberIds: z.array(z.string().cuid()).default([]),
          barangay: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId ?? null;

      // Head must be an unassigned fisherfolk in this tenant.
      const head = await ctx.db.fisherfolk.findFirst({
        where: { id: input.headId, tenantId },
        select: { id: true, householdId: true, barangay: true, address: true },
      });
      if (!head) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Head fisherfolk not found in this tenant.",
        });
      }
      if (head.householdId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Head is already assigned to a household.",
        });
      }

      // Members exclude the head (head is a member via its own householdId).
      const memberIds = input.memberIds.filter((id) => id !== input.headId);
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
        const assigned = members.find((m) => m.householdId !== null);
        if (assigned) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more members are already in a household.",
          });
        }
      }

      const barangay = input.barangay ?? head.barangay;
      const address = input.address ?? head.address;

      // Auto-number per tenant; retry on unique clash (concurrent create).
      const MAX_ATTEMPTS = 8;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const count = await ctx.db.household.count({ where: { tenantId } });
        const householdNumber = formatHouseholdNumber(count + 1 + attempt);

        try {
          const created = await ctx.db.$transaction(async (tx) => {
            const household = await tx.household.create({
              data: {
                tenantId,
                householdNumber,
                headId: input.headId,
                barangay,
                address,
                notes: input.notes ?? null,
                createdById: userId,
              },
              select: { id: true },
            });

            const family = await tx.family.create({
              data: {
                tenantId,
                householdId: household.id,
                familyNumber: "F-01",
                headId: input.headId,
                notes: null,
              },
              select: { id: true },
            });

            await tx.fisherfolk.update({
              where: { id: input.headId },
              data: { householdId: household.id, familyId: family.id },
            });

            if (memberIds.length > 0) {
              await tx.fisherfolk.updateMany({
                where: { id: { in: memberIds }, tenantId },
                data: { householdId: household.id, familyId: family.id },
              });
            }

            return household;
          });

          return { id: created.id };
        } catch (error) {
          if (isUniqueViolation(error)) continue;
          throw error;
        }
      }

      throw new TRPCError({
        code: "CONFLICT",
        message: "Could not allocate a unique household number.",
      });
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          addMemberIds: z.array(z.string().cuid()).optional(),
          removeMemberIds: z.array(z.string().cuid()).optional(),
          newHeadId: z.string().cuid().optional(),
          barangay: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      const household = await ctx.db.household.findFirst({
        where: { id: input.id, tenantId },
        select: { id: true, headId: true },
      });
      if (!household) throw new TRPCError({ code: "NOT_FOUND" });

      const addMemberIds = input.addMemberIds ?? [];
      const removeMemberIds = input.removeMemberIds ?? [];

      // Cannot remove the current head — change the head first.
      if (removeMemberIds.includes(household.headId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the household head. Change the head first.",
        });
      }

      // New members must be unassigned + in-tenant.
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
        const assigned = candidates.find(
          (c) => c.householdId !== null && c.householdId !== household.id,
        );
        if (assigned) {
          // FIS-22 — name the conflicting household so the caller can see
          // exactly where the fisherfolk already lives, instead of a
          // generic "already in a household" message.
          const assignedFisherfolk = await ctx.db.fisherfolk.findFirst({
            where: { id: assigned.id },
            select: { fullName: true },
          });
          const conflictingHousehold = await ctx.db.household.findFirst({
            where: { id: assigned.householdId as string },
            select: { householdNumber: true },
          });
          const who = assignedFisherfolk?.fullName ?? "This fisherfolk";
          const conflictHouseholdNumber =
            conflictingHousehold?.householdNumber ?? "another household";
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${who} is already a member of household ${conflictHouseholdNumber}.`,
          });
        }
      }

      const householdData: Record<string, unknown> = {};
      if (input.barangay !== undefined) householdData.barangay = input.barangay;
      if (input.address !== undefined) householdData.address = input.address;
      if (input.notes !== undefined) householdData.notes = input.notes;

      await ctx.db.$transaction(async (tx) => {
        // Remove members (only those actually in this household).
        if (removeMemberIds.length > 0) {
          await tx.fisherfolk.updateMany({
            where: {
              id: { in: removeMemberIds },
              tenantId,
              householdId: household.id,
            },
            data: { householdId: null, familyId: null },
          });
        }

        // Add members.
        if (addMemberIds.length > 0) {
          await tx.fisherfolk.updateMany({
            where: { id: { in: addMemberIds }, tenantId },
            data: { householdId: household.id },
          });
        }

        // Change head — must be a current member (after any additions).
        if (input.newHeadId && input.newHeadId !== household.headId) {
          const candidate = await tx.fisherfolk.findFirst({
            where: { id: input.newHeadId, tenantId },
            select: { id: true, householdId: true },
          });
          if (!candidate || candidate.householdId !== household.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "New head must be a current member of this household.",
            });
          }
          householdData.headId = input.newHeadId;
        }

        if (Object.keys(householdData).length > 0) {
          await tx.household.update({
            where: { id: household.id },
            data: householdData,
          });
        }
      });

      return { id: household.id };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      const household = await ctx.db.household.findFirst({
        where: { id: input.id, tenantId },
        select: { id: true },
      });
      if (!household) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.$transaction(async (tx) => {
        // Unlink all members (never delete fisherfolk).
        await tx.fisherfolk.updateMany({
          where: { householdId: household.id, tenantId },
          data: { householdId: null },
        });
        await tx.household.delete({ where: { id: household.id } });
      });

      return { ok: true as const };
    }),
});
