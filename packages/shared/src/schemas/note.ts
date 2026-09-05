import { z } from "zod";

import { noteRefTypeSchema, noteVisibilitySchema } from "./enums";

// FIS-36 Field Diary — Phase 1. A note carries a mandatory field-capture
// stamp (latitude/longitude/locationLabel/capturedAt) enforced here AND
// re-validated at the router (Zod alone can't express "must have been
// captured within the last 14 days" against wall-clock time cleanly inside
// a reusable schema — the router owns that runtime check).

export const noteMediaItemSchema = z
  .object({
    storageKey: z.string().min(1),
    originalFilename: z.string().min(1).max(255),
    mimeType: z.string().min(1),
    fileSize: z.number().int().positive(),
    blockId: z.string().min(1).optional(),
  })
  .strict();

export const noteEntityRefItemSchema = z
  .object({
    refType: noteRefTypeSchema,
    entityId: z.string().cuid(),
    labelSnapshot: z.string().min(1),
    blockId: z.string().min(1).optional(),
  })
  .strict();

export const noteCreateSchema = z
  .object({
    // HARD STAMP GATE — every note must carry a real field-capture stamp.
    // Back-date-window + skew re-validated at the router (wall-clock check).
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    locationLabel: z.string().min(1),
    capturedAt: z.coerce.date(),
    title: z.string().min(1).max(255).optional(),
    body: z.record(z.string(), z.unknown()),
    bodyText: z.string().min(1),
    visibility: noteVisibilitySchema.optional(),
    media: z.array(noteMediaItemSchema).default([]),
    entityRefs: z.array(noteEntityRefItemSchema).default([]),
  })
  .strict();

export const noteUpdateSchema = z
  .object({
    id: z.string().cuid(),
    title: z.string().min(1).max(255).nullable().optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    bodyText: z.string().min(1).optional(),
    visibility: noteVisibilitySchema.optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationLabel: z.string().min(1).optional(),
    capturedAt: z.coerce.date().optional(),
    media: z.array(noteMediaItemSchema).optional(),
    entityRefs: z.array(noteEntityRefItemSchema).optional(),
  })
  .strict();

export const noteListQuerySchema = z
  .object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    authorId: z.string().cuid().optional(),
  })
  .strict();
