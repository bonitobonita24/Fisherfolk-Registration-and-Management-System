import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { deleteFile, getFileDownloadUrl } from "@frms/storage";
import {
  noteCreateSchema,
  noteListQuerySchema,
  noteUpdateSchema,
} from "@frms/shared/schemas";

import { omitUndefined } from "../../lib/prisma-input";
import type { TRPCContext } from "../context";
import { createTRPCRouter, matrixProcedure } from "../trpc";

// FIS-36 Field Diary — Phase 1. A note may only be captured from the
// field: the stamp gate (latitude/longitude/locationLabel/capturedAt) is
// enforced at the schema level (types) AND here (the wall-clock
// back-date/skew window, which Zod can't express against `Date.now()`
// inside a reusable schema).
const BACK_DATE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const FUTURE_SKEW_MS = 5 * 60 * 1000; // 5 minutes clock-skew allowance

function assertCapturedAtInWindow(capturedAt: Date): void {
  const now = Date.now();
  const capturedMs = capturedAt.getTime();
  if (capturedMs > now + FUTURE_SKEW_MS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "capturedAt cannot be in the future.",
    });
  }
  if (now - capturedMs > BACK_DATE_WINDOW_MS) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "capturedAt is too far in the past (max 14 days back-dated).",
    });
  }
}

const ADMIN_ROLES = ["tenant_manager", "tenant_superadmin", "tenant_admin"];

function isAdminRole(role: string | null | undefined): boolean {
  return role != null && ADMIN_ROLES.includes(role);
}

/**
 * Best-effort signed/media URL per NoteMedia row. Mirrors the dual-read
 * pattern in upload.ts's getDownloadUrl (MediaObject ledger for Telegram-
 * backed media, presigned S3/MinIO url fallback for pre-migration
 * objects) — never throws; a resolution failure returns `url: null` so a
 * single bad/orphaned row can't break the whole note detail response.
 */
async function resolveMediaUrl(
  ctx: TRPCContext,
  tenantId: string,
  storageKey: string,
): Promise<string | null> {
  try {
    const mo = await ctx.db.mediaObject.findUnique({
      where: { tenantId_storageKey: { tenantId, storageKey } },
      select: { backend: true, telegramFileId: true },
    });
    if (mo?.backend === "telegram" && mo.telegramFileId) {
      return `/api/media?key=${encodeURIComponent(storageKey)}`;
    }
    return await getFileDownloadUrl(storageKey, tenantId, 3600);
  } catch {
    return null;
  }
}

export const noteRouter = createTRPCRouter({
  list: matrixProcedure("notes", "view")
    .input(noteListQuerySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const { page, limit, search, from, to, authorId } = input;
      const skip = (page - 1) * limit;

      // Own notes by default; only an admin (tenant_admin+) may cross into
      // another author's notes, and only via an explicit authorId — never
      // implicitly widened for a non-admin caller.
      const admin = isAdminRole(ctx.role);
      const authorFilter = admin ? authorId : ctx.userId;

      const where = {
        tenantId: ctx.tenantId,
        ...(authorFilter && { authorId: authorFilter }),
        ...(search && {
          bodyText: { contains: search, mode: "insensitive" as const },
        }),
        ...((from || to) && {
          capturedAt: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.note.findMany({
          where,
          skip,
          take: limit,
          orderBy: { capturedAt: "desc" },
          select: {
            id: true,
            title: true,
            bodyText: true,
            capturedAt: true,
            locationLabel: true,
            visibility: true,
            createdAt: true,
            author: { select: { id: true, name: true } },
            _count: { select: { media: true, entityRefs: true } },
          },
        }),
        ctx.db.note.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getById: matrixProcedure("notes", "view")
    .input(z.object({ id: z.string().cuid() }).strict())
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;

      const note = await ctx.db.note.findFirst({
        where: { id: input.id, tenantId },
        include: {
          author: { select: { id: true, name: true, email: true } },
          entityRefs: true,
          media: true,
        },
      });
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });

      const admin = isAdminRole(ctx.role);
      const isAuthor = note.authorId === ctx.userId;
      const isSharedVisible = note.visibility === "shared";
      if (!isAuthor && !admin && !isSharedVisible) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const media = await Promise.all(
        note.media.map(async (m) => ({
          ...m,
          url: await resolveMediaUrl(ctx, tenantId, m.storageKey),
        })),
      );

      return { ...note, media };
    }),

  create: matrixProcedure("notes", "write")
    .input(noteCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId;

      assertCapturedAtInWindow(input.capturedAt);

      const { media, entityRefs, ...noteFields } = input;

      const created = await ctx.db.$transaction(async (tx) => {
        const note = await tx.note.create({
          data: omitUndefined({
            tenantId,
            authorId: userId,
            title: noteFields.title,
            body: noteFields.body,
            bodyText: noteFields.bodyText,
            capturedAt: noteFields.capturedAt,
            latitude: noteFields.latitude,
            longitude: noteFields.longitude,
            locationLabel: noteFields.locationLabel,
            visibility: noteFields.visibility ?? "private",
          }),
        });

        if (media.length > 0) {
          await tx.noteMedia.createMany({
            data: media.map((m) => ({
              noteId: note.id,
              storageKey: m.storageKey,
              originalFilename: m.originalFilename,
              mimeType: m.mimeType,
              fileSize: m.fileSize,
              blockId: m.blockId ?? null,
            })),
          });
        }

        if (entityRefs.length > 0) {
          await tx.noteEntityRef.createMany({
            data: entityRefs.map((r) => ({
              tenantId,
              noteId: note.id,
              refType: r.refType,
              entityId: r.entityId,
              labelSnapshot: r.labelSnapshot,
              blockId: r.blockId ?? null,
            })),
          });
        }

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "CREATE",
            entityType: "note",
            entityId: note.id,
            after: note as unknown as Record<string, unknown>,
          },
        });

        return note;
      });

      return created;
    }),

  update: matrixProcedure("notes", "update")
    .input(noteUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId;
      const { id, media, entityRefs, ...changes } = input;

      const existing = await ctx.db.note.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (existing.authorId !== userId && !isAdminRole(ctx.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Re-validate the stamp window whenever capturedAt changes; a
      // partial stamp edit (e.g. locationLabel only) doesn't need it.
      if (changes.capturedAt) {
        assertCapturedAtInWindow(changes.capturedAt);
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const note = await tx.note.update({
          where: { id },
          data: omitUndefined({
            title: changes.title,
            body: changes.body,
            bodyText: changes.bodyText,
            capturedAt: changes.capturedAt,
            latitude: changes.latitude,
            longitude: changes.longitude,
            locationLabel: changes.locationLabel,
            visibility: changes.visibility,
          }),
        });

        if (media !== undefined) {
          await tx.noteMedia.deleteMany({ where: { noteId: id } });
          if (media.length > 0) {
            await tx.noteMedia.createMany({
              data: media.map((m) => ({
                noteId: id,
                storageKey: m.storageKey,
                originalFilename: m.originalFilename,
                mimeType: m.mimeType,
                fileSize: m.fileSize,
                blockId: m.blockId ?? null,
              })),
            });
          }
        }

        if (entityRefs !== undefined) {
          await tx.noteEntityRef.deleteMany({ where: { noteId: id } });
          if (entityRefs.length > 0) {
            await tx.noteEntityRef.createMany({
              data: entityRefs.map((r) => ({
                tenantId,
                noteId: id,
                refType: r.refType,
                entityId: r.entityId,
                labelSnapshot: r.labelSnapshot,
                blockId: r.blockId ?? null,
              })),
            });
          }
        }

        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "UPDATE",
            entityType: "note",
            entityId: id,
            before: existing as unknown as Record<string, unknown>,
            after: note as unknown as Record<string, unknown>,
          },
        });

        return note;
      });

      return updated;
    }),

  delete: matrixProcedure("notes", "delete")
    .input(z.object({ id: z.string().cuid() }).strict())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" });
      const tenantId = ctx.tenantId;
      const userId = ctx.userId;

      const existing = await ctx.db.note.findFirst({
        where: { id: input.id, tenantId },
        include: { media: { select: { storageKey: true } } },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (existing.authorId !== userId && !isAdminRole(ctx.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Best-effort storage cleanup — never blocks the note delete. Not
      // Telegram-aware (packages/storage's deleteFile is S3/MinIO-only,
      // see note.ts dispatch note below); wrapped so a Telegram-backed key
      // (the fleet default backend) fails silently instead of aborting
      // the whole delete.
      await Promise.all(
        existing.media.map((m) =>
          deleteFile(m.storageKey, tenantId).catch(() => undefined),
        ),
      );

      // NoteMedia / NoteEntityRef cascade via the Prisma schema's
      // `onDelete: Cascade` FK — no manual child-row deletes needed.
      await ctx.db.$transaction(async (tx) => {
        await tx.note.delete({ where: { id: input.id } });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            action: "DELETE",
            entityType: "note",
            entityId: input.id,
            before: existing as unknown as Record<string, unknown>,
          },
        });
      });

      return { success: true };
    }),
});
