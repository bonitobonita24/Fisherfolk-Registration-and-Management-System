import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { omitUndefined } from "../../lib/prisma-input";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";

export const ayudaRouter = createTRPCRouter({
  // ── AyudaProgram ────────────────────────────────────────────────────────────

  listPrograms: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          status: z
            .enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"])
            .optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
      };

      const [items, total] = await Promise.all([
        ctx.db.ayudaProgram.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            beneficiaryCount: true,
            verifiedCount: true,
            notReceivedCount: true,
            createdAt: true,
            createdBy: { select: { id: true, name: true } },
          },
        }),
        ctx.db.ayudaProgram.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getProgramById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const record = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return record;
    }),

  createProgram: adminProcedure
    .input(
      z
        .object({
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          filters: z.record(z.unknown()).optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const record = await ctx.db.ayudaProgram.create({
        data: omitUndefined({
          tenantId: ctx.tenantId,
          title: input.title,
          description: input.description,
          filters: input.filters ?? {},
          createdById: ctx.userId!,
        }),
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          filters: true,
          beneficiaryCount: true,
          createdAt: true,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "AyudaProgram",
          entityId: record.id,
          after: record as unknown as Record<string, unknown>,
        },
      });

      return record;
    }),

  publishProgram: adminProcedure
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const updated = await ctx.db.ayudaProgram.update({
        where: { id: input.id },
        data: { status: "ACTIVE" },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "AyudaProgram",
          entityId: input.id,
          before: { status: existing.status } as Record<string, unknown>,
          after: { status: updated.status } as Record<string, unknown>,
        },
      });

      return updated;
    }),

  closeProgram: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          status: z.enum(["COMPLETED", "CANCELLED"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const updated = await ctx.db.ayudaProgram.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "AyudaProgram",
          entityId: input.id,
          before: { status: existing.status } as Record<string, unknown>,
          after: { status: updated.status } as Record<string, unknown>,
        },
      });

      return updated;
    }),

  // ── AyudaBeneficiary ────────────────────────────────────────────────────────

  listBeneficiaries: protectedProcedure
    .input(
      z
        .object({
          programId: z.string().cuid(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          verificationStatus: z
            .enum(["PENDING", "RECEIVED", "CANCELLED"])
            .optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const program = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.programId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!program) throw new TRPCError({ code: "NOT_FOUND" });

      const { page, limit, verificationStatus } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        programId: input.programId,
        ...(verificationStatus && { verificationStatus }),
      };

      const [items, total] = await Promise.all([
        ctx.db.ayudaBeneficiary.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            verificationStatus: true,
            verifiedAt: true,
            createdAt: true,
            fisherfolk: {
              select: { id: true, fullName: true, idNumber: true },
            },
            verifiedBy: { select: { id: true, name: true } },
          },
        }),
        ctx.db.ayudaBeneficiary.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  addBeneficiary: adminProcedure
    .input(
      z
        .object({
          programId: z.string().cuid(),
          fisherfolkId: z.string().cuid(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const [program, fisherfolk] = await Promise.all([
        ctx.db.ayudaProgram.findFirst({
          where: { id: input.programId, tenantId: ctx.tenantId },
        }),
        ctx.db.fisherfolk.findFirst({
          where: { id: input.fisherfolkId, tenantId: ctx.tenantId },
        }),
      ]);

      if (!program || !fisherfolk) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (program.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const existing = await ctx.db.ayudaBeneficiary.findFirst({
        where: {
          programId: input.programId,
          fisherfolkId: input.fisherfolkId,
        },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Invalid input." });
      }

      const [record] = await ctx.db.$transaction([
        ctx.db.ayudaBeneficiary.create({
          data: {
            tenantId: ctx.tenantId,
            programId: input.programId,
            fisherfolkId: input.fisherfolkId,
          },
          select: {
            id: true,
            verificationStatus: true,
            createdAt: true,
          },
        }),
        ctx.db.ayudaProgram.update({
          where: { id: input.programId },
          data: { beneficiaryCount: { increment: 1 } },
        }),
      ]);

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "CREATE",
          entityType: "AyudaBeneficiary",
          entityId: record.id,
          after: {
            programId: input.programId,
            fisherfolkId: input.fisherfolkId,
          } as Record<string, unknown>,
        },
      });

      return record;
    }),

  verifyBeneficiary: adminProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          verificationStatus: z.enum(["RECEIVED", "CANCELLED"]),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.ayudaBeneficiary.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.verificationStatus !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      const countField =
        input.verificationStatus === "RECEIVED"
          ? { verifiedCount: { increment: 1 } }
          : { notReceivedCount: { increment: 1 } };

      const [updated] = await ctx.db.$transaction([
        ctx.db.ayudaBeneficiary.update({
          where: { id: input.id },
          data: {
            verificationStatus: input.verificationStatus,
            verifiedById: ctx.userId!,
            verifiedAt: new Date(),
          },
        }),
        ctx.db.ayudaProgram.update({
          where: { id: existing.programId },
          data: countField,
        }),
      ]);

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "AyudaBeneficiary",
          entityId: input.id,
          before: {
            verificationStatus: existing.verificationStatus,
          } as Record<string, unknown>,
          after: {
            verificationStatus: updated.verificationStatus,
          } as Record<string, unknown>,
        },
      });

      return updated;
    }),
});
