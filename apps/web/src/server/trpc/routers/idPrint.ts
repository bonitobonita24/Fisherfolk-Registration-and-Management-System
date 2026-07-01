import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { idPrintRecordSchema, idPrintValidateSchema } from "@frms/shared/schemas";

import {
  createTRPCRouter,
  encoderProcedure,
} from "../trpc";

// PHT = UTC+8; midnight PHT expressed as a UTC Date (used in todaysPrinted).
function startOfDayPHT(): Date {
  const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
  const nowMs = Date.now();
  return new Date(
    Math.floor((nowMs + PHT_OFFSET_MS) / 86_400_000) * 86_400_000 - PHT_OFFSET_MS,
  );
}

export const idPrintRouter = createTRPCRouter({
  /**
   * List fisherfolk (or vessels) eligible for ID printing: tenant-scoped, with
   * photo/signature/qrCode and a derived `ready` boolean.
   * Note: `barangay` filter applies only to FISHERFOLK; silently ignored for VESSEL
   * (vessels have no barangay field).
   */
  listEligible: encoderProcedure
    .input(
      z
        .object({
          templateType: z.enum(["FISHERFOLK", "VESSEL"]),
          search: z.string().optional(),
          barangay: z.string().optional(),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { templateType, search, barangay } = input;

      if (templateType === "FISHERFOLK") {
        const where = {
          tenantId: ctx.tenantId,
          ...(barangay && { barangay }),
          ...(search && {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { idNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }),
        };

        const items = await ctx.db.fisherfolk.findMany({
          where,
          orderBy: { fullName: "asc" },
          select: {
            id: true,
            fullName: true,
            photo: true,
            signature: true,
            qrCode: true,
            idReleasedAt: true,
            _count: { select: { renewals: true } },
          },
        });

        return items.map((item) => ({
          id: item.id,
          name: item.fullName,
          photo: item.photo,
          signature: item.signature,
          qrCode: item.qrCode,
          idReleasedAt: item.idReleasedAt,
          renewalCount: item._count.renewals,
          ready: item.photo !== null && item.signature !== null,
        }));
      }

      // VESSEL templateType — barangay filter not applicable
      const where = {
        tenantId: ctx.tenantId,
        ...(search && {
          OR: [
            { vesselName: { contains: search, mode: "insensitive" as const } },
            { mfvrNumber: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const vessels = await ctx.db.vessel.findMany({
        where,
        orderBy: { vesselName: "asc" },
        select: {
          id: true,
          vesselName: true,
          vesselPhoto: true,
          qrCode: true,
        },
      });

      return vessels.map((v) => ({
        id: v.id,
        name: v.vesselName,
        photo: v.vesselPhoto,
        signature: null,
        qrCode: v.qrCode,
        idReleasedAt: null,
        renewalCount: 0,
        // Vessels have no signature requirement — photo alone determines readiness
        ready: v.vesselPhoto !== null,
      }));
    }),

  /**
   * Fetch all template-variable-resolvable fields for selected subjects.
   * Used by PvcSheet to build the CardData map for IdCardRenderer (print mode).
   * Scoped to the calling tenant; IDs not found in this tenant are silently omitted.
   */
  getSubjectPrintData: encoderProcedure
    .input(
      z
        .object({
          subjectIds: z.array(z.string().cuid()).min(1).max(4),
          templateType: z.enum(["FISHERFOLK", "VESSEL"]),
        })
        .strict(),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { subjectIds, templateType } = input;
      const tenantId = ctx.tenantId;

      if (templateType === "FISHERFOLK") {
        const records = await ctx.db.fisherfolk.findMany({
          where: { id: { in: subjectIds }, tenantId },
          select: {
            id: true,
            idNumber: true,
            fullName: true,
            lastName: true,
            firstName: true,
            middleName: true,
            dateOfBirth: true,
            sex: true,
            address: true,
            barangay: true,
            rsbsaNumber: true,
            categoryIds: true,
            photo: true,
            signature: true,
            qrCode: true,
            dateJoined: true,
            registrationYear: true,
          },
        });

        // Batch-fetch category names for all subjects in a single round-trip
        const allCategoryIds = [...new Set(records.flatMap((r) => r.categoryIds))];
        const categoryRows =
          allCategoryIds.length > 0
            ? await ctx.db.category.findMany({
                where: { id: { in: allCategoryIds }, tenantId },
                select: { id: true, name: true },
              })
            : [];
        const categoryNameById = new Map(categoryRows.map((c) => [c.id, c.name]));

        return records.map((r) => ({
          subjectId: r.id,
          data: {
            "{{registration_number}}": r.idNumber,
            "{{full_name}}": r.fullName,
            "{{last_name}}": r.lastName,
            "{{first_name}}": r.firstName,
            "{{middle_name}}": r.middleName ?? "",
            "{{date_of_birth}}": r.dateOfBirth
              ? r.dateOfBirth.toISOString().slice(0, 10)
              : "",
            "{{sex}}": r.sex ?? "",
            "{{address}}": r.address,
            "{{barangay}}": r.barangay,
            "{{rsbsa_number}}": r.rsbsaNumber ?? "",
            "{{categories}}": r.categoryIds
              .map((id) => categoryNameById.get(id) ?? "")
              .filter(Boolean)
              .join(", "),
            "{{photo}}": r.photo ?? "",
            "{{signature}}": r.signature ?? "",
            "{{qr_code}}": r.qrCode ?? "",
            "{{date_joined}}": r.dateJoined.toISOString().slice(0, 10),
            "{{registration_year}}": String(r.registrationYear),
            "{{mayor_name}}": "",
            "{{mayor_signature}}": "",
          },
        }));
      }

      // VESSEL
      const vessels = await ctx.db.vessel.findMany({
        where: { id: { in: subjectIds }, tenantId },
        select: {
          id: true,
          mfvrNumber: true,
          vesselName: true,
          vesselType: true,
          hullMaterial: true,
          placeBuilt: true,
          yearBuilt: true,
          homeport: true,
          grossTonnage: true,
          horsepower: true,
          vesselPhoto: true,
          qrCode: true,
        },
      });

      return vessels.map((v) => ({
        subjectId: v.id,
        data: {
          "{{mfvr_number}}": v.mfvrNumber,
          "{{vessel_name}}": v.vesselName ?? "",
          "{{vessel_type}}": v.vesselType,
          "{{hull_material}}": v.hullMaterial ?? "",
          "{{place_built}}": v.placeBuilt ?? "",
          "{{year_built}}": v.yearBuilt != null ? String(v.yearBuilt) : "",
          "{{homeport}}": v.homeport ?? "",
          "{{gross_tonnage}}": v.grossTonnage != null ? String(v.grossTonnage) : "",
          "{{horsepower}}": v.horsepower != null ? String(v.horsepower) : "",
          "{{vessel_photo}}": v.vesselPhoto ?? "",
          "{{vessel_qr_code}}": v.qrCode ?? "",
          "{{mayor_name}}": "",
          "{{mayor_signature}}": "",
        },
      }));
    }),

  /**
   * Validate a selection of IDs: returns readyIds and blockedIds with missing field info.
   */
  validateSelection: encoderProcedure
    .input(idPrintValidateSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { ids, templateType } = input;

      const readyIds: string[] = [];
      const blockedIds: { id: string; missing: ("photo" | "signature")[] }[] = [];

      if (templateType === "FISHERFOLK") {
        const records = await ctx.db.fisherfolk.findMany({
          where: { id: { in: ids }, tenantId: ctx.tenantId },
          select: { id: true, photo: true, signature: true },
        });

        const foundIds = new Set(records.map((r) => r.id));
        for (const id of ids) {
          if (!foundIds.has(id)) {
            blockedIds.push({ id, missing: ["photo", "signature"] });
          }
        }

        for (const record of records) {
          const missing: ("photo" | "signature")[] = [];
          if (!record.photo) missing.push("photo");
          if (!record.signature) missing.push("signature");

          if (missing.length === 0) {
            readyIds.push(record.id);
          } else {
            blockedIds.push({ id: record.id, missing });
          }
        }
      } else {
        // VESSEL — only photo required
        const vessels = await ctx.db.vessel.findMany({
          where: { id: { in: ids }, tenantId: ctx.tenantId },
          select: { id: true, vesselPhoto: true },
        });

        const foundIds = new Set(vessels.map((v) => v.id));
        for (const id of ids) {
          if (!foundIds.has(id)) {
            blockedIds.push({ id, missing: ["photo"] });
          }
        }

        for (const vessel of vessels) {
          if (vessel.vesselPhoto) {
            readyIds.push(vessel.id);
          } else {
            blockedIds.push({ id: vessel.id, missing: ["photo"] });
          }
        }
      }

      return { readyIds, blockedIds };
    }),

  /**
   * Record a print run: server-side re-validates photo+signature before persisting.
   * Creates one IDPrintBatch + AuditLog(PRINT) in a transaction.
   * All subjects must have subjectType matching templateType.
   */
  recordPrint: encoderProcedure
    .input(idPrintRecordSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const { templateId, templateType, subjects } = input;

      // Guard: all subjects must match templateType (prevent mismatch bypass)
      const wrongType = subjects.filter((s) => s.subjectType !== templateType);
      if (wrongType.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `All subjects must have subjectType matching templateType '${templateType}'`,
        });
      }

      // Verify template belongs to this tenant AND matches templateType
      const template = await ctx.db.iDTemplate.findFirst({
        where: { id: templateId, tenantId, templateType },
        select: { id: true },
      });
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

      // Server-side re-validate every subject has required media (defence-in-depth).
      // Also detects IDs missing from DB (deleted between validateSelection and recordPrint).
      const blockedIds: string[] = [];

      if (templateType === "FISHERFOLK") {
        const fisherfolkIds = subjects.map((s) => s.subjectId);
        const records = await ctx.db.fisherfolk.findMany({
          where: { id: { in: fisherfolkIds }, tenantId },
          select: { id: true, photo: true, signature: true },
        });

        const foundIds = new Set(records.map((r) => r.id));
        // IDs not found in this tenant (deleted or cross-tenant forgery)
        for (const id of fisherfolkIds) {
          if (!foundIds.has(id)) blockedIds.push(id);
        }
        // IDs found but missing required media
        for (const record of records) {
          if (!record.photo || !record.signature) {
            blockedIds.push(record.id);
          }
        }
      } else {
        const vesselIds = subjects.map((s) => s.subjectId);
        const vessels = await ctx.db.vessel.findMany({
          where: { id: { in: vesselIds }, tenantId },
          select: { id: true, vesselPhoto: true },
        });

        const foundIds = new Set(vessels.map((v) => v.id));
        for (const id of vesselIds) {
          if (!foundIds.has(id)) blockedIds.push(id);
        }
        for (const vessel of vessels) {
          if (!vessel.vesselPhoto) {
            blockedIds.push(vessel.id);
          }
        }
      }

      if (blockedIds.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot print: ${blockedIds.length} subject(s) are missing required media or not found.`,
        });
      }

      const summaryJson = subjects.map((s) => ({
        subjectId: s.subjectId,
        subjectType: s.subjectType,
        registrationType: s.registrationType,
      }));

      const batch = await ctx.db.$transaction(async (tx) => {
        const created = await tx.iDPrintBatch.create({
          data: {
            tenantId,
            templateId,
            templateType,
            printedById: userId,
            idCount: subjects.length,
            summaryJson,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "PRINT",
            entityType: "IDPrintBatch",
            entityId: created.id,
            after: { idCount: created.idCount, templateType, summaryJson } as unknown as Record<string, unknown>,
          },
        });

        return created;
      });

      // Return minimal surface — caller uses todaysPrinted for full batch detail
      return { id: batch.id, idCount: batch.idCount };
    }),

  /**
   * Today's printed batches for this tenant, with per-batch detail and rolled-up counts.
   * Requires encoder role (print operations are not visible to viewers).
   * Start-of-day is computed in PHT (UTC+8), the LGU's local timezone.
   */
  todaysPrinted: encoderProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    const tenantId = ctx.tenantId;

    const startOfDay = startOfDayPHT();

    const batches = await ctx.db.iDPrintBatch.findMany({
      where: { tenantId, printedAt: { gte: startOfDay } },
      orderBy: { printedAt: "desc" },
      include: {
        printedBy: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, templateType: true } },
      },
    });

    let newCount = 0;
    let renewedCount = 0;
    let updateCount = 0;

    for (const batch of batches) {
      const summary = batch.summaryJson as Array<{
        subjectId: string;
        subjectType: string;
        registrationType: string;
      }>;

      for (const entry of summary) {
        if (entry.registrationType === "NEW") newCount++;
        else if (entry.registrationType === "RENEWED") renewedCount++;
        else if (entry.registrationType === "UPDATE") updateCount++;
      }
    }

    return {
      batches,
      totals: { new: newCount, renewed: renewedCount, update: updateCount, total: newCount + renewedCount + updateCount },
    };
  }),
});
