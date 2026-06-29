import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "../trpc";

export const DEFAULT_PRIMARY_COLOR = "#F97316";
export const DEFAULT_SECONDARY_COLOR = "#1E3A5F";

export const settingsRouter = createTRPCRouter({
  barangayAlias: createTRPCRouter({
    /**
     * listAliases — return all BarangayAlias records for the tenant,
     * ordered by fromLabel ascending.
     */
    listAliases: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const db = ctx.db;

      return db.barangayAlias.findMany({
        where: { tenantId },
        orderBy: { fromLabel: "asc" },
      });
    }),

    /**
     * createAlias — upsert on (tenantId, fromLabel) unique key so
     * re-adding an existing fromLabel updates its toLabel instead of erroring.
     */
    createAlias: adminProcedure
      .input(
        z
          .object({
            fromLabel: z.string().min(1).trim(),
            toLabel: z.string().min(1).trim(),
          })
          .strict(),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = ctx.tenantId;
        const db = ctx.db;

        return db.barangayAlias.upsert({
          where: {
            tenantId_fromLabel: {
              tenantId,
              fromLabel: input.fromLabel,
            },
          },
          create: {
            tenantId,
            fromLabel: input.fromLabel,
            toLabel: input.toLabel,
          },
          update: {
            toLabel: input.toLabel,
          },
        });
      }),

    /**
     * deleteAlias — delete a BarangayAlias by id, guarded by tenantId so
     * cross-tenant deletion is impossible.
     */
    deleteAlias: adminProcedure
      .input(z.object({ id: z.string() }).strict())
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = ctx.tenantId;
        const db = ctx.db;

        const existing = await db.barangayAlias.findFirst({
          where: { id: input.id, tenantId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        await db.barangayAlias.delete({ where: { id: input.id } });
        return { success: true } as const;
      }),

    /**
     * barangayList — returns the canonical barangay list for this tenant
     * (stored on the Tenant record as tenant.barangayList) so UI can offer
     * a dropdown for toLabel.
     */
    barangayList: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const db = ctx.db;

      const tenant = await db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { barangayList: true },
      });
      return tenant.barangayList;
    }),
  }),

  theme: createTRPCRouter({
    /**
     * get — return the tenant's current accent colors.
     */
    get: adminProcedure.query(async ({ ctx }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const db = ctx.db;

      return db.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { primaryColor: true, secondaryColor: true },
      });
    }),

    /**
     * update — write new accent colors for the tenant.
     * Both values must be 6-digit hex strings (#RRGGBB).
     */
    update: adminProcedure
      .input(
        z
          .object({
            primaryColor: z
              .string()
              .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color"),
            secondaryColor: z
              .string()
              .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color"),
          })
          .strict(),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
        const tenantId = ctx.tenantId;
        const db = ctx.db;

        return db.tenant.update({
          where: { id: tenantId },
          data: {
            primaryColor: input.primaryColor,
            secondaryColor: input.secondaryColor,
          },
          select: { primaryColor: true, secondaryColor: true },
        });
      }),
  }),
});
