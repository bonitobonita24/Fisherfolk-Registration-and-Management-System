import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  getFileDownloadUrl,
  isAllowedMimeType,
  uploadFile,
} from "@frms/storage";

import { rateLimiters } from "../../lib/rate-limit";
import {
  createTRPCRouter,
  encoderProcedure,
  protectedProcedure,
} from "../trpc";

const ENTITY_TYPES = [
  "fisherfolk-photo",
  "fisherfolk-signature",
  "vessel-photo",
  "violation-evidence",
  "ayuda-upload",
  "kanban-attachment",
  "id-template-bg",
] as const;

const MAX_BYTES_BY_ENTITY: Record<(typeof ENTITY_TYPES)[number], number> = {
  "fisherfolk-photo": 5 * 1024 * 1024,
  "fisherfolk-signature": 5 * 1024 * 1024,
  "vessel-photo": 5 * 1024 * 1024,
  "violation-evidence": 15 * 1024 * 1024,
  "ayuda-upload": 15 * 1024 * 1024,
  "kanban-attachment": 15 * 1024 * 1024,
  "id-template-bg": 5 * 1024 * 1024,
};

export const uploadRouter = createTRPCRouter({
  uploadFile: encoderProcedure
    .input(
      z
        .object({
          base64: z.string().min(1),
          mimeType: z.string().min(1),
          originalFilename: z.string().min(1).max(255),
          entityType: z.enum(ENTITY_TYPES),
        })
        .strict(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId || !ctx.userId)
        throw new TRPCError({ code: "FORBIDDEN" });

      rateLimiters.upload.check(ctx.userId);

      if (!isAllowedMimeType(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File type not allowed.",
        });
      }

      let buffer: Buffer;
      try {
        const stripped = input.base64.replace(/^data:[^;]+;base64,/, "");
        buffer = Buffer.from(stripped, "base64");
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file encoding.",
        });
      }

      if (buffer.length === 0 || buffer.length > MAX_BYTES_BY_ENTITY[input.entityType]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size out of range.",
        });
      }

      let uploaded;
      try {
        uploaded = await uploadFile({
          tenantId: ctx.tenantId,
          entityType: input.entityType,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          buffer,
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload failed.",
        });
      }

      const downloadUrl = await getFileDownloadUrl(
        uploaded.key,
        ctx.tenantId,
        3600,
      );

      return {
        key: uploaded.key,
        sizeBytes: uploaded.sizeBytes,
        mimeType: uploaded.mimeType,
        downloadUrl,
      };
    }),

  // protectedProcedure (not encoderProcedure): all authenticated same-tenant roles
  // — incl. Viewer + Bantay Dagat — may fetch media signed URLs. Cross-tenant access
  // is still prevented inside getFileDownloadUrl, which throws "Access denied" when
  // extractTenantFromKey(key) !== ctx.tenantId. PRODUCT.md (Bantay Dagat must see
  // photos for field identity verification) requires this. Batch 3d fix.
  getDownloadUrl: protectedProcedure
    .input(z.object({ key: z.string().min(1) }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });

      try {
        const url = await getFileDownloadUrl(input.key, ctx.tenantId, 3600);
        return { url };
      } catch {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
});
