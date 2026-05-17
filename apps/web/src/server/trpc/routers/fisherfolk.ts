import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  fisherfolkCreateSchema,
  fisherfolkSearchDuplicatesSchema,
  fisherfolkUpdateSchema,
} from "@frms/shared/schemas";

import { buildQRPayload } from "@/lib/qr-code";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  encoderProcedure,
  protectedProcedure,
} from "../trpc";

export const fisherfolkRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          status: z
            .enum(["NEW", "ACTIVE", "RENEWED", "INACTIVE", "ARCHIVED"])
            .optional(),
          barangay: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, status, barangay } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(barangay && { barangay }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { idNumber: { contains: search, mode: "insensitive" as const } },
            { contactNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.fisherfolk.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            idNumber: true,
            fullName: true,
            barangay: true,
            contactNumber: true,
            status: true,
            createdAt: true,
          },
        }),
        ctx.db.fisherfolk.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          vessels: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              mfvrNumber: true,
              vesselName: true,
              vesselType: true,
              status: true,
            },
          },
          violations: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              subject: true,
              targetType: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  searchForDuplicates: encoderProcedure
    .input(fisherfolkSearchDuplicatesSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const orClauses: Array<Record<string, unknown>> = [];
      if (input.idNumber) {
        orClauses.push({
          idNumber: { equals: input.idNumber, mode: "insensitive" as const },
        });
      }
      if (input.rsbsaNumber) {
        orClauses.push({
          rsbsaNumber: {
            equals: input.rsbsaNumber,
            mode: "insensitive" as const,
          },
        });
      }
      if (input.firstName && input.lastName) {
        orClauses.push({
          AND: [
            {
              firstName: {
                equals: input.firstName,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                equals: input.lastName,
                mode: "insensitive" as const,
              },
            },
          ],
        });
      }

      if (orClauses.length === 0) return { matches: [] };

      const candidates = await ctx.db.fisherfolk.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { not: "ARCHIVED" },
          OR: orClauses,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          idNumber: true,
          rsbsaNumber: true,
          fullName: true,
          firstName: true,
          lastName: true,
          middleName: true,
          suffix: true,
          dateOfBirth: true,
          barangay: true,
          contactNumber: true,
          status: true,
          createdAt: true,
        },
      });

      const inputDobMs = input.dateOfBirth?.getTime();

      const matches = candidates.map((c) => {
        let matchType:
          | "EXACT_ID"
          | "EXACT_RSBSA"
          | "STRONG_NAME_DOB"
          | "POSSIBLE_NAME";

        if (
          input.idNumber &&
          c.idNumber.toLowerCase() === input.idNumber.toLowerCase()
        ) {
          matchType = "EXACT_ID";
        } else if (
          input.rsbsaNumber &&
          c.rsbsaNumber &&
          c.rsbsaNumber.toLowerCase() === input.rsbsaNumber.toLowerCase()
        ) {
          matchType = "EXACT_RSBSA";
        } else if (
          inputDobMs !== undefined &&
          c.dateOfBirth.getTime() === inputDobMs
        ) {
          matchType = "STRONG_NAME_DOB";
        } else {
          matchType = "POSSIBLE_NAME";
        }

        return { ...c, matchType };
      });

      const rank: Record<string, number> = {
        EXACT_ID: 0,
        EXACT_RSBSA: 1,
        STRONG_NAME_DOB: 2,
        POSSIBLE_NAME: 3,
      };
      matches.sort((a, b) => rank[a.matchType]! - rank[b.matchType]!);

      return { matches };
    }),

  generateNextIdNumber: encoderProcedure
    .input(z.object({ year: z.number().int().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const year = input?.year ?? new Date().getFullYear();
      const prefix = `FF-${year}-`;

      const last = await ctx.db.fisherfolk.findFirst({
        where: {
          tenantId: ctx.tenantId,
          idNumber: { startsWith: prefix },
        },
        orderBy: { idNumber: "desc" },
        select: { idNumber: true },
      });

      let nextSeq = 1;
      if (last) {
        const tail = last.idNumber.slice(prefix.length);
        const parsed = Number.parseInt(tail, 10);
        if (Number.isFinite(parsed) && parsed > 0) nextSeq = parsed + 1;
      }

      const idNumber = `${prefix}${nextSeq.toString().padStart(4, "0")}`;
      return { idNumber, year, sequence: nextSeq };
    }),

  create: encoderProcedure
    .input(fisherfolkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { idNumber: input.idNumber, tenantId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Invalid input.",
        });
      }

      const record = await ctx.db.$transaction(async (tx) => {
        const created = await tx.fisherfolk.create({
          data: omitUndefined({
            ...input,
            tenantId,
            createdById: userId,
            updatedById: userId,
          }),
        });

        const qrPayload = buildQRPayload({
          id: created.id,
          regNo: created.idNumber,
          tenantId,
        });

        return tx.fisherfolk.update({
          where: { id: created.id },
          data: { qrCode: qrPayload },
        });
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE",
          entityType: "Fisherfolk",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  update: adminProcedure
    .input(fisherfolkUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.fisherfolk.update({
        where: { id },
        data: omitUndefined({ ...data, updatedById: ctx.userId! }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.fisherfolk.update({
        where: { id: input.id },
        data: { status: "ARCHIVED", updatedById: ctx.userId! },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return { success: true };
    }),
});
