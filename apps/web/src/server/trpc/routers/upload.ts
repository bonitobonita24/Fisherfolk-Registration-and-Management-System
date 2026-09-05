import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  generateStorageKey,
  getFileDownloadUrl,
  getStorageBackend,
  getTelegramBotToken,
  isAllowedMimeType,
  uploadDocumentToTelegram,
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
  "note-photo",
] as const;

const MAX_BYTES_BY_ENTITY: Record<(typeof ENTITY_TYPES)[number], number> = {
  "fisherfolk-photo": 5 * 1024 * 1024,
  "fisherfolk-signature": 5 * 1024 * 1024,
  "vessel-photo": 5 * 1024 * 1024,
  "violation-evidence": 15 * 1024 * 1024,
  "ayuda-upload": 15 * 1024 * 1024,
  "kanban-attachment": 15 * 1024 * 1024,
  "id-template-bg": 5 * 1024 * 1024,
  "note-photo": 5 * 1024 * 1024,
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

      // T4 — Telegram-backed write path (see docs/plans/telegram-storage-migration-plan.md
      // §2/§10 T4). @frms/storage stays prisma-free, so the MediaObject ledger row is
      // written here, at the app layer, from the enriched Telegram upload result.
      if (getStorageBackend() === "telegram") {
        const tenant = await ctx.db.tenant.findUnique({
          where: { id: ctx.tenantId },
          select: { telegramChannelId: true },
        });
        const chatId =
          tenant?.telegramChannelId ?? process.env["TELEGRAM_DEFAULT_CHANNEL_ID"];

        if (!chatId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Telegram channel not configured.",
          });
        }

        const key = generateStorageKey(
          ctx.tenantId,
          input.entityType,
          input.originalFilename,
        );

        let messageId: number;
        let fileId: string;
        try {
          const result = await uploadDocumentToTelegram({
            botToken: getTelegramBotToken(),
            chatId,
            bytes: new Uint8Array(buffer),
            filename: input.originalFilename,
            mimeType: input.mimeType,
          });
          messageId = result.messageId;
          fileId = result.fileId;
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Upload failed.",
          });
        }

        await ctx.db.mediaObject.create({
          data: {
            tenantId: ctx.tenantId,
            storageKey: key,
            entityType: input.entityType,
            backend: "telegram",
            telegramChatId: chatId,
            telegramFileId: fileId,
            telegramMessageId: BigInt(messageId),
            sizeBytes: buffer.length,
            mimeType: input.mimeType,
            migratedAt: new Date(),
          },
        });

        return {
          key,
          sizeBytes: buffer.length,
          mimeType: input.mimeType,
          downloadUrl: `/api/media?key=${encodeURIComponent(key)}`,
        };
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

      // T6 — dual-read: prefer the MediaObject ledger (Telegram-backed media),
      // fall back to the presigned S3/MinIO url for pre-migration objects.
      const mo = await ctx.db.mediaObject.findUnique({
        where: {
          tenantId_storageKey: { tenantId: ctx.tenantId, storageKey: input.key },
        },
        select: { backend: true, telegramFileId: true },
      });

      if (mo?.backend === "telegram" && mo.telegramFileId) {
        return { url: `/api/media?key=${encodeURIComponent(input.key)}` };
      }

      try {
        const url = await getFileDownloadUrl(input.key, ctx.tenantId, 3600);
        return { url };
      } catch {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
    }),
});
