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
          uploads: {
            orderBy: { uploadedAt: "desc" },
            select: {
              id: true,
              filePath: true,
              originalFilename: true,
              mimeType: true,
              fileSize: true,
              uploadType: true,
              uploadedAt: true,
            },
          },
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
          distributionUnit: z
            .enum(["FISHERFOLK", "HOUSEHOLD"])
            .default("FISHERFOLK"),
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
          distributionUnit: input.distributionUnit,
          createdById: ctx.userId!,
        }),
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          filters: true,
          distributionUnit: true,
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
            householdId: true,
            fisherfolk: {
              select: { id: true, fullName: true, idNumber: true },
            },
            household: {
              select: { id: true, householdNumber: true },
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
          fisherfolkId: z.string().cuid().optional(),
          householdId: z.string().cuid().optional(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const program = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.programId, tenantId: ctx.tenantId },
      });
      if (!program) throw new TRPCError({ code: "NOT_FOUND" });
      if (program.status !== "ACTIVE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input." });
      }

      let fisherfolkId: string;
      let householdId: string | undefined;

      if (program.distributionUnit === "HOUSEHOLD") {
        if (!input.householdId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid input.",
          });
        }
        const household = await ctx.db.household.findFirst({
          where: { id: input.householdId, tenantId: ctx.tenantId },
          select: { id: true, headId: true },
        });
        if (!household) throw new TRPCError({ code: "NOT_FOUND" });
        fisherfolkId = household.headId;
        householdId = household.id;
      } else {
        if (!input.fisherfolkId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid input.",
          });
        }
        const fisherfolk = await ctx.db.fisherfolk.findFirst({
          where: { id: input.fisherfolkId, tenantId: ctx.tenantId },
        });
        if (!fisherfolk) throw new TRPCError({ code: "NOT_FOUND" });
        fisherfolkId = input.fisherfolkId;
      }

      const existing = await ctx.db.ayudaBeneficiary.findFirst({
        where: {
          programId: input.programId,
          fisherfolkId,
        },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Invalid input." });
      }

      const [record] = await ctx.db.$transaction([
        ctx.db.ayudaBeneficiary.create({
          data: omitUndefined({
            tenantId: ctx.tenantId,
            programId: input.programId,
            fisherfolkId,
            householdId,
          }),
          select: {
            id: true,
            verificationStatus: true,
            createdAt: true,
            householdId: true,
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
            fisherfolkId,
            householdId: householdId ?? null,
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

  addUploads: adminProcedure
    .input(
      z
        .object({
          programId: z.string().cuid(),
          files: z
            .array(
              z.object({
                filePath: z.string().min(1),
                originalFilename: z.string().min(1).max(255),
                mimeType: z.string().min(1),
                fileSize: z.number().int().positive(),
              }),
            )
            .min(1),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const program = await ctx.db.ayudaProgram.findFirst({
        where: { id: input.programId, tenantId: ctx.tenantId },
      });
      if (!program) throw new TRPCError({ code: "NOT_FOUND" });

      const result = await ctx.db.ayudaUpload.createMany({
        data: input.files.map((file) => ({
          programId: input.programId,
          uploadType: file.mimeType.startsWith("image/")
            ? ("EVENT_PHOTO" as const)
            : ("DOCUMENT" as const),
          filePath: file.filePath,
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          uploadedById: ctx.userId!,
        })),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "UPDATE",
          entityType: "AyudaProgram",
          entityId: input.programId,
          after: {
            uploadedFiles: input.files.map((f) => f.originalFilename),
          } as Record<string, unknown>,
        },
      });

      return { count: result.count };
    }),

  removeUpload: adminProcedure
    .input(z.object({ uploadId: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const upload = await ctx.db.ayudaUpload.findFirst({
        where: {
          id: input.uploadId,
          program: { tenantId: ctx.tenantId },
        },
        select: { id: true, programId: true, originalFilename: true },
      });
      if (!upload) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.ayudaUpload.delete({ where: { id: upload.id } });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId!,
          action: "DELETE",
          entityType: "AyudaProgram",
          entityId: upload.programId,
          before: {
            uploadId: upload.id,
            originalFilename: upload.originalFilename,
          } as Record<string, unknown>,
        },
      });

      return { success: true };
    }),
});
