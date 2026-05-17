import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  getFileDownloadUrl,
  isAllowedMimeType,
  uploadFile,
} from "@frms/storage";

import { rateLimiters } from "../../lib/rate-limit";
import { createTRPCRouter, encoderProcedure } from "../trpc";

const MAX_BYTES = 5 * 1024 * 1024;

const ENTITY_TYPES = ["fisherfolk-photo", "fisherfolk-signature"] as const;

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

      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
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

  getDownloadUrl: encoderProcedure
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
