import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { buildQRPayload } from "@/lib/qr-code";
import {
  buildValidationReport,
  type ValidationContext,
} from "@/lib/import/validate";

import { omitUndefined } from "../../lib/prisma-input";
import { adminProcedure, createTRPCRouter } from "../trpc";

const rowSchema = z.record(z.string(), z.string());

export const importRouter = createTRPCRouter({
  /**
   * preview — validate a batch of raw rows, persist an ImportBatch record
   * (status READY), and return the validation report.  ZERO fisherfolk writes.
   */
  preview: adminProcedure
    .input(
      z
        .object({
          fileName: z.string().optional(),
          rows: z.array(rowSchema),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const db = ctx.db;

      const tenant = await db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
      });

      const aliases = await db.barangayAlias.findMany({ where: { tenantId } });
      const typoMap: Record<string, string> = {};
      for (const a of aliases) {
        typoMap[a.fromLabel] = a.toLabel;
      }

      const existingRecords = await db.fisherfolk.findMany({
        where: { tenantId },
        select: { idNumber: true },
      });
      const existingIdNumbers = new Set(existingRecords.map((f) => f.idNumber));

      const validationCtx: ValidationContext = {
        barangayList: tenant.barangayList,
        typoMap,
        existingIdNumbers,
      };

      const report = buildValidationReport(input.rows, validationCtx);

      const batch = await db.importBatch.create({
        data: omitUndefined({
          tenantId,
          mode: "FULL" as const,
          status: "READY" as const,
          fileName: input.fileName,
          totalRows: report.counts.total,
          validRows: report.counts.valid,
          warningRows: report.counts.warning,
          errorRows: report.counts.error,
          report: report,
          createdById: userId,
        }),
      });

      return { batchId: batch.id, report };
    }),

  /**
   * commit — re-validate server-side (source of truth), then insert all
   * importable rows.  Skips on unique-constraint violation (P2002) so the
   * operation is idempotent and resumable.
   */
  commit: adminProcedure
    .input(
      z
        .object({
          batchId: z.string(),
          rows: z.array(rowSchema),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const db = ctx.db;

      // Re-validate server-side — never trust client
      const tenant = await db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
      });

      const aliases = await db.barangayAlias.findMany({ where: { tenantId } });
      const typoMap: Record<string, string> = {};
      for (const a of aliases) {
        typoMap[a.fromLabel] = a.toLabel;
      }

      const existingRecords = await db.fisherfolk.findMany({
        where: { tenantId },
        select: { idNumber: true },
      });
      const existingIdNumbers = new Set(existingRecords.map((f) => f.idNumber));

      const validationCtx: ValidationContext = {
        barangayList: tenant.barangayList,
        typoMap,
        existingIdNumbers,
      };

      const report = buildValidationReport(input.rows, validationCtx);

      // Build category name (lowercase) → id map
      const categoryRecords = await db.category.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });
      const catMap = new Map<string, string>();
      for (const c of categoryRecords) {
        catMap.set(c.name.toLowerCase(), c.id);
      }

      // Mark batch as importing
      await db.importBatch.update({
        where: { id: input.batchId, tenantId },
        data: { status: "IMPORTING" },
      });

      let imported = 0;
      let skipped = 0;

      const importableRows = report.rows.filter(
        (r) => r.status !== "error" && r.action === "import",
      );

      for (let i = 0; i < importableRows.length; i++) {
        const r = importableRows[i];
        if (!r) continue;
        const n = r.normalized;

        try {
          const data = omitUndefined({
            tenantId,
            idNumber: r.idNumber,
            fullName: n.fullName,
            lastName: n.lastName,
            firstName: n.firstName,
            middleName: n.middleName ?? undefined,
            dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
            sex:
              n.sex == null
                ? null
                : n.sex === "Male"
                  ? ("MALE" as const)
                  : ("FEMALE" as const),
            address: n.address || "",
            barangay: n.barangay ?? "",
            contactNumber: n.contactNumber ?? undefined,
            rsbsaNumber: n.rsbsaNumber ?? undefined,
            categoryIds: n.categories
              .map((c) => catMap.get(c.toLowerCase()))
              .filter((id): id is string => id != null),
            remarks: n.remarks ?? undefined,
            status: "ACTIVE" as const,
            registrationYear: tenant.currentRegistrationYear,
            createdById: userId,
            updatedById: userId,
          });

          const created = await db.fisherfolk.create({ data });

          await db.fisherfolk.update({
            where: { id: created.id },
            data: {
              qrCode: buildQRPayload({
                id: created.id,
                regNo: created.idNumber,
                tenantId,
              }),
            },
          });

          imported++;
        } catch (err: unknown) {
          // Idempotent: skip on unique-constraint violation (same idNumber)
          if (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            (err as { code: string }).code === "P2002"
          ) {
            skipped++;
            continue;
          }
          throw err;
        }

        // Periodic progress checkpoint every 50 rows
        if ((i + 1) % 50 === 0) {
          await db.importBatch.update({
            where: { id: input.batchId },
            data: {
              lastProcessedRow: i + 1,
              importedRows: imported,
              skippedRows: skipped,
            },
          });
        }
      }

      // Finalize batch
      await db.importBatch.update({
        where: { id: input.batchId },
        data: {
          status: "COMPLETED",
          importedRows: imported,
          skippedRows: skipped,
          completedAt: new Date(),
        },
      });

      // Audit log — match exact field names from fisherfolk.ts
      await db.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "CREATE",
          entityType: "ImportBatch",
          entityId: input.batchId,
          after: { imported, skipped } as Record<string, unknown>,
        },
      });

      return { imported, skipped, batchId: input.batchId };
    }),

  /** getBatch — fetch a single ImportBatch record scoped to this tenant. */
  getBatch: adminProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.importBatch.findFirstOrThrow({
        where: { id: input.id, tenantId: ctx.tenantId },
      });
    }),

  /** listBatches — last 50 ImportBatch records for this tenant, newest first. */
  listBatches: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
    return ctx.db.importBatch.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),
});
