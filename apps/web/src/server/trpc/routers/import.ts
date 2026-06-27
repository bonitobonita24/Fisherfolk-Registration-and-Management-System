import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { buildQRPayload } from "@/lib/qr-code";
import {
  buildValidationReport,
  type ValidationContext,
} from "@/lib/import/validate";
import { parseImportWorkbook } from "@/lib/import/excel";

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
          mode: z.enum(["FULL", "INCREMENTAL"]).optional().default("FULL"),
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
          mode: input.mode,
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
   * importable rows.
   * FULL mode: skips on unique-constraint violation (P2002) — idempotent/resumable.
   * INCREMENTAL mode: upserts by (tenantId, idNumber) — updates existing records,
   * inserts new ones.  Returns `updated` count in addition to imported/skipped.
   */
  commit: adminProcedure
    .input(
      z
        .object({
          batchId: z.string(),
          rows: z.array(rowSchema),
          mode: z.enum(["FULL", "INCREMENTAL"]).optional().default("FULL"),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId!;
      const db = ctx.db;
      const isIncremental = input.mode === "INCREMENTAL";

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
      let updated = 0;

      const importableRows = report.rows.filter((r) => {
        if (r.status === "error") return false;
        if (r.action === "import") return true;
        // INCREMENTAL: also process existing records so the upsert branch can update them.
        // skip-duplicate and skip-collision remain excluded in all modes.
        if (isIncremental && r.action === "skip-existing") return true;
        return false;
      });

      for (let i = 0; i < importableRows.length; i++) {
        const r = importableRows[i];
        if (!r) continue;
        const n = r.normalized;

        const sexValue =
          n.sex == null
            ? null
            : n.sex === "Male"
              ? ("MALE" as const)
              : ("FEMALE" as const);

        const categoryIds = n.categories
          .map((c) => catMap.get(c.toLowerCase()))
          .filter((id): id is string => id != null);

        if (isIncremental) {
          // INCREMENTAL mode: upsert by tenant-scoped unique (tenantId + idNumber).
          // Unique selector name: tenantId_idNumber (Prisma compound key convention).
          const idNumber = r.idNumber;
          if (!idNumber) {
            skipped++;
            continue;
          }

          const createData = omitUndefined({
            tenantId,
            idNumber,
            fullName: n.fullName,
            lastName: n.lastName,
            firstName: n.firstName,
            middleName: n.middleName ?? undefined,
            dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
            sex: sexValue,
            address: n.address || "",
            barangay: n.barangay ?? "",
            contactNumber: n.contactNumber ?? undefined,
            rsbsaNumber: n.rsbsaNumber ?? undefined,
            categoryIds,
            remarks: n.remarks ?? undefined,
            status: "ACTIVE" as const,
            registrationYear: tenant.currentRegistrationYear,
            createdById: userId,
            updatedById: userId,
          });

          // Update data excludes immutable fields (id, tenantId, idNumber, createdAt, createdById)
          const updateData = omitUndefined({
            fullName: n.fullName,
            lastName: n.lastName,
            firstName: n.firstName,
            middleName: n.middleName ?? undefined,
            dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
            sex: sexValue,
            address: n.address || "",
            barangay: n.barangay ?? "",
            contactNumber: n.contactNumber ?? undefined,
            rsbsaNumber: n.rsbsaNumber ?? undefined,
            categoryIds,
            remarks: n.remarks ?? undefined,
            status: "ACTIVE" as const,
            registrationYear: tenant.currentRegistrationYear,
            updatedById: userId,
          });

          const wasExisting = existingIdNumbers.has(idNumber);

          const result = await db.fisherfolk.upsert({
            where: { tenantId_idNumber: { tenantId, idNumber } },
            create: createData,
            update: updateData,
          });

          await db.fisherfolk.update({
            where: { id: result.id },
            data: {
              qrCode: buildQRPayload({
                id: result.id,
                regNo: result.idNumber,
                tenantId,
              }),
            },
          });

          if (wasExisting) {
            updated++;
          } else {
            imported++;
          }
        } else {
          // FULL mode: original behavior — create and skip on P2002
          try {
            const data = omitUndefined({
              tenantId,
              idNumber: r.idNumber,
              fullName: n.fullName,
              lastName: n.lastName,
              firstName: n.firstName,
              middleName: n.middleName ?? undefined,
              dateOfBirth: n.dateOfBirth ? new Date(n.dateOfBirth) : null,
              sex: sexValue,
              address: n.address || "",
              barangay: n.barangay ?? "",
              contactNumber: n.contactNumber ?? undefined,
              rsbsaNumber: n.rsbsaNumber ?? undefined,
              categoryIds,
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

      // Finalize batch — store updated count in report JSON (no DB column for it)
      await db.importBatch.update({
        where: { id: input.batchId },
        data: {
          status: "COMPLETED",
          importedRows: imported,
          skippedRows: skipped,
          report: { updated } as Record<string, unknown>,
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
          after: { imported, skipped, updated } as Record<string, unknown>,
        },
      });

      return { imported, skipped, updated, batchId: input.batchId };
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

  /** parseWorkbook — server-side Excel/CSV parse (Buffer-only lib), returns raw rows. */
  parseWorkbook: adminProcedure
    .input(z.object({ fileBase64: z.string() }).strict())
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const { rows, headerWarnings } = await parseImportWorkbook(buffer);
      return { rows, headerWarnings };
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
