import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  fisherfolkActivityQuerySchema,
  fisherfolkCreateSchema,
  fisherfolkMarkReleasedSchema,
  fisherfolkRenewSchema,
  fisherfolkSearchDuplicatesSchema,
  fisherfolkUpdateSchema,
} from "@frms/shared/schemas";

import { buildQRPayload } from "@/lib/qr-code";

import { omitUndefined } from "../../lib/prisma-input";
import {
  createTRPCRouter,
  encoderProcedure,
  matrixProcedure,
} from "../trpc";

export const fisherfolkRouter = createTRPCRouter({
  // PD-005 Chunk 3 pilot: list/getById/getActivity/create/update/archive run
  // through matrixProcedure() (custom-role matrix aware). The remaining
  // procedures (searchForDuplicates, generateNextIdNumber, completeRecord,
  // renew, markIdReleased) are intentionally left on the fixed-tier
  // encoderProcedure for this chunk — out of scope, migrate in a later
  // chunk.
  list: matrixProcedure("fisherfolk", "view")
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(200).default(50),
          search: z.string().optional(),
          status: z
            .enum(["NEW", "RENEWED", "EXPIRED", "ARCHIVED"])
            .optional(),
          barangay: z.string().optional(),
          missing: z.enum(["photo", "signature"]).optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, status, barangay, missing } = input;
      const skip = (page - 1) * limit;

      const where = {
        tenantId: ctx.tenantId,
        ...(status && { status }),
        ...(barangay && { barangay }),
        ...(missing === "photo" && { photo: null }),
        ...(missing === "signature" && { signature: null }),
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
            idReleasedAt: true,
            _count: { select: { renewals: true } },
          },
        }),
        ctx.db.fisherfolk.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: matrixProcedure("fisherfolk", "view")
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
          ayudaBeneficiaries: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              verificationStatus: true,
              verifiedAt: true,
              createdAt: true,
              program: { select: { id: true, title: true, status: true } },
            },
          },
          renewals: {
            orderBy: { renewedAt: "desc" },
            take: 20,
            select: {
              id: true,
              renewalYear: true,
              renewedAt: true,
              notes: true,
              renewedBy: { select: { name: true, email: true } },
            },
          },
          fishCatches: {
            orderBy: { landingDate: "desc" },
            take: 5,
            select: {
              id: true,
              referenceNo: true,
              landingDate: true,
              gearType: true,
              totalCatchKg: true,
            },
          },
          idReleasedBy: { select: { name: true, email: true } },
          household: {
            select: { id: true, householdNumber: true, headId: true },
          },
          family: {
            select: { id: true, familyNumber: true, headId: true },
          },
        },
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        ...record,
        fishCatches: record.fishCatches.map((fc) => ({
          ...fc,
          totalCatchKg: Number(fc.totalCatchKg),
        })),
      };
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
          c.dateOfBirth != null &&
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

  create: matrixProcedure("fisherfolk", "write")
    .input(fisherfolkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { idNumber: input.idNumber, tenantId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A record with this ID number already exists.",
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

  // RECONCILIATION (PD-005 Chunk 3): this procedure was `adminProcedure`
  // (tenant_manager/superadmin/tenant_admin only — encoder excluded).
  // Adopting matrixProcedure("fisherfolk","update") WIDENS access to
  // `encoder`, whose DOMAIN_ROLE_PRESETS grant (packages/shared/src/rbac/
  // permissions.ts) is write+update+no-delete on fisherfolk — deliberately
  // authored that way in Chunk 2 to match nav-items.ts (encoder already
  // sees the Fisherfolk section). `viewer`/`bantay_dagat` stay denied
  // (view-only preset). This is an intentional alignment with the
  // tenant-rbac-standard matrix, not an accidental widening.
  update: matrixProcedure("fisherfolk", "update")
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
        data: omitUndefined({ ...data, updatedById: ctx.userId }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  completeRecord: encoderProcedure
    .input(
      z
        .object({
          id: z.string().cuid(),
          changes: fisherfolkUpdateSchema.omit({ id: true }).strict(),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const userId = ctx.userId!;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Server-side guard: each targeted field must currently be empty
      // (null / undefined / "" / empty array).  A populated field requires
      // admin approval via the edit-request workflow (PD-004).
      const isEmpty = (v: unknown): boolean => {
        if (v === null || v === undefined) return true;
        if (typeof v === "string") return v.trim() === "";
        if (Array.isArray(v)) return v.length === 0;
        return false;
      };

      for (const key of Object.keys(input.changes) as Array<
        keyof typeof input.changes
      >) {
        const existingValue = (existing as Record<string, unknown>)[key as string];
        if (!isEmpty(existingValue)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Field already set — requires admin approval.",
          });
        }
      }

      const updated = await ctx.db.fisherfolk.update({
        where: { id: input.id },
        data: omitUndefined({ ...input.changes, updatedById: userId }),
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return updated;
    }),

  archive: matrixProcedure("fisherfolk", "delete")
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.fisherfolk.update({
        where: { id: input.id },
        data: { status: "ARCHIVED", updatedById: ctx.userId },
      });

      await ctx.db.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          action: "UPDATE",
          entityType: "Fisherfolk",
          entityId: input.id,
          before: existing as unknown as Record<string, unknown>,
          after: updated as unknown as Record<string, unknown>,
        },
      });

      return { success: true };
    }),

  renew: encoderProcedure
    .input(fisherfolkRenewSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { id, notes } = input;
      const currentYear = new Date().getFullYear();

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (existing.status !== "EXPIRED") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot renew: record must be EXPIRED before it can be renewed",
        });
      }

      const activeViolationCount = await ctx.db.violation.count({
        where: { fisherfolkId: id, tenantId, status: "ACTIVE" },
      });
      if (activeViolationCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot renew: active violation on record",
        });
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const alreadyRenewed = await tx.registrationRenewal.findUnique({
          where: { fisherfolkId_renewalYear: { fisherfolkId: id, renewalYear: currentYear } },
          select: { id: true },
        });
        if (alreadyRenewed) {
          throw new TRPCError({ code: "CONFLICT", message: "Already renewed for this year" });
        }
        await tx.registrationRenewal.create({
          data: omitUndefined({ tenantId, fisherfolkId: id, renewalYear: currentYear, renewedById: userId, notes }),
        });
        const fisherfolk = await tx.fisherfolk.update({
          where: { id },
          data: { status: "RENEWED", registrationYear: currentYear, updatedById: userId },
        });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "RENEW",
            entityType: "Fisherfolk",
            entityId: id,
            before: existing as unknown as Record<string, unknown>,
            after: fisherfolk as unknown as Record<string, unknown>,
          },
        });
        return fisherfolk;
      });

      return updated;
    }),

  markIdReleased: encoderProcedure
    .input(fisherfolkMarkReleasedSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { id } = input;

      const existing = await ctx.db.fisherfolk.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Idempotent: already released — no-op, no duplicate audit entry
      if (existing.idReleasedAt) {
        return existing;
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const fisherfolk = await tx.fisherfolk.update({
          where: { id },
          data: { idReleasedAt: new Date(), idReleasedById: userId, updatedById: userId },
        });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "UPDATE",
            entityType: "Fisherfolk",
            entityId: id,
            before: existing as unknown as Record<string, unknown>,
            after: fisherfolk as unknown as Record<string, unknown>,
          },
        });
        return fisherfolk;
      });

      return updated;
    }),

  getActivity: matrixProcedure("fisherfolk", "view")
    .input(fisherfolkActivityQuerySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { id } = input;

      const exists = await ctx.db.fisherfolk.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!exists) throw new TRPCError({ code: "NOT_FOUND" });

      const logs = await ctx.db.auditLog.findMany({
        where: { tenantId: ctx.tenantId, entityType: "Fisherfolk", entityId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      });

      // Sanitized: return action/actor/timestamp ONLY — no before/after diffs
      return logs.map((log) => ({
        id: log.id,
        action: log.action,
        actorName: log.user?.name ?? log.user?.email ?? null,
        createdAt: log.createdAt,
      }));
    }),
});
