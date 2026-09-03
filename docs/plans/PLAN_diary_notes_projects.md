# Implementation Plan — Field Diary / Notes → Projects Module

**Status:** DRAFT design doc (planning only — no code, no migration written yet). HARD HOLD.
**Author:** Claude (scout + architect pass), 2026-09-04.
**Scope tier:** `[WHAT]` product decisions flagged inline for the owner; `[HOW]` decisions taken here.
**Companion rules:** Rule 1 (PRODUCT.md is source of truth — this plan must be back-ported before build),
Rule 33/40 (RA 10173 privacy — notes reference citizens), Rule 34 (tenant RBAC), Rule 7 (tenant isolation).

---

## 0. Scout findings (actual codebase — exact paths)

**Monorepo layout** (`pnpm` workspace, Turbo):
- `apps/web` — Next.js 15 App Router, the only app.
- `packages/db` — Prisma. Schema: `packages/db/prisma/schema.prisma` (single schema, ~1100 lines).
- `packages/storage` — the StorageAdapter (Telegram default / MinIO(S3) fallback).
- `packages/shared` — RBAC types (`src/rbac/permissions.ts`), etc.
- `packages/ui`, `packages/api-client`, `packages/jobs`.

**No existing notes/diary feature.** `grep` for `model Note` / `diary` → nothing. Greenfield.

**No rich-text editor library present anywhere** (`grep tiptap|prosemirror|lexical|slate|@tiptap` → NONE).
Present & reusable: `maplibre-gl@^5` (maps), `exceljs` (report export), `next@15.5`.

**Prisma models that matter** (`packages/db/prisma/schema.prisma`):
- `Fisherfolk` (L365) — has `latitude Float? / longitude Float?`, `barangay`, `fullName`, `idNumber`, `photo` (opaque storageKey string).
- `Vessel` (L429), `Violation` (L471), `AyudaProgram` (L646) / `AyudaBeneficiary` (L671), `Household` (L701), `Family` (L725) — the entity-picker targets.
- `KanbanTask` (L598) — `assignedToId`, `status KanbanTaskStatus (TODO…)`, `priority`, `sourceEntityType/sourceEntityId` (already a generic "this task came from entity X" pattern), `KanbanAttachment` (L782).
- `FishCatch` (L922) — precedent for a per-user, location-stamped, `recordedById` operational record (`latitude/longitude/landingDate/landingTime`). Good analog for `Note`.
- `MediaObject` (L1074) — the media ledger: `tenantId`, `storageKey` (opaque), `entityType`, `backend` (`telegram` default), `telegram*` fields, `mimeType`, `sizeBytes`. Domain models store only the opaque `storageKey` string; this ledger maps key→backend.
- `AuditLog` (L552) — generic `entityType/entityId` + `before/after Json`.

**Enums:** `FeatureKey` (L210) = `fisherfolk, households, vessels, fish_catches, violations, ayuda, edit_requests, kanban, reports, analytics, map, notifications, id_generator, import, audit_log, data_management`. **New keys `notes` + `projects` must be added** via `ALTER TYPE … ADD VALUE` (additive, never DROP/CREATE). `PermissionAction` (`packages/shared/src/rbac/permissions.ts:27`) = `"view"|"write"|"update"|"delete"`.

**tRPC** (`apps/web/src/server/trpc/`):
- `context.ts` — `ctx` carries `session`, `userId`, `role`, `tenantId`, `tenantSlug`, `db`.
- `trpc.ts` — procedures: `publicProcedure`, `protectedProcedure` (enforces auth + `runWithTenant(ctx.tenantId, …)` for tenant isolation), `encoderProcedure`, `adminProcedure`, `tenantManagerProcedure`, `tenantSuperadminProcedure`, and the data-driven `matrixProcedure(feature: FeatureKey, action)`.
- Routers registered in `root.ts` (28 routers). New: `note`, `project` (+ later `todo` maybe folded into project).

**Reusable search procedures for the slash picker (query shapes):**
- `fisherfolk.list` (`routers/fisherfolk.ts:62`) = `matrixProcedure("fisherfolk","view")`, input `{page, limit≤200, search?, status?, barangay?, …}`, filter `OR: [{fullName contains search, mode insensitive},{idNumber …},{contactNumber …}]`, `take: limit, orderBy createdAt desc`. `fisherfolk.searchForDuplicates` (L219) returns `take: 20`.
- Same `list`-with-`search` shape exists per entity (`vessel`, `violation`, `ayuda`, `household`, `family`). These are the pickers' data sources — the plan adds a thin unified `note.searchEntities` facade over them (below) rather than re-querying tables directly.

**Media upload pattern (reuse verbatim):**
- `routers/upload.ts` — `upload.uploadFile` = `encoderProcedure`, input `{base64, mimeType, originalFilename, entityType: enum ENTITY_TYPES}`; validates MIME + per-entity size cap; calls `@frms/storage` `uploadDocumentToTelegram`/`uploadFile` → returns opaque `storageKey`. `upload.getDownloadUrl` resolves key→URL.
- Client components: `components/fisherfolk/photo-upload.tsx`, `components/shared/attachment-upload.tsx` use `trpc.upload.uploadFile.useMutation()` + `trpc.upload.getDownloadUrl.useQuery()`. **New `ENTITY_TYPES` member: `"note-photo"`** (+ size cap).
- `@frms/storage` exports: `uploadFile, getFileDownloadUrl, deleteFile, generateStorageKey, S3Adapter, TelegramAdapter, resolveBackend` (`packages/storage/src/index.ts`).

**Location capture (reuse verbatim):** `apps/web/src/components/shared/location-picker.tsx` — `LocationPicker` props `{ value: {lat,lng}|null, onChange, barangay?, disabled? }`, MapLibre draggable pin, auto-centers on Calapan barangay centroid, has a `LocateFixed` (browser geolocation) button. Fisherfolk records already persist `latitude/longitude Float?`.

**Report/print precedent:** `routers/report.ts` — `buildReport` + `exportExcel` (`adminProcedure`) → `buildExcel()` via `ExcelJS`, returns **base64 xlsx + filename** as a tRPC query result (no file endpoint). `routers/idPrint.ts` = print-batch precedent. `dateFrom/dateTo` string filters are the date-range convention.

---

## 1. Concept & scope

A **Notion-style field diary** for FMO field staff (enumerators/encoders) to freely journal daily work —
tasks done, whereabouts, accomplishments — as free-form rich notes that are **always date/time + location
stamped** and may embed **inline photos**. A `/` slash menu provides formatting help **and** live
**entity pickers** that pull a fisherfolk/vessel/violation/ayuda/task from the DB and drop a linked "chip"
inline. Staff **generate an Accomplishment Report** (date-ranged) from their notes when a supervisor asks
(payroll/performance evidence).

This is Phase 1 of a larger **Projects / Project Management** module: a **Project** consolidates many
tasks/todos + notes + files + media + docs into one workspace. The diary is the atomic unit; Projects are
the container. Build the diary first, standalone and useful; grow Projects on top without reworking the note
schema.

**In scope (Phase 1–3):** Note CRUD, mandatory stamping, slash editor, entity chips, inline photo, per-user
privacy, Accomplishment Report export.
**Later (Phase 4):** Projects, todos, project-scoped file/doc shelf, membership.
**Out of scope:** real-time collaborative editing (single-author notes), offline-first sync, mobile-native app.

---

## 2. Data model (Prisma sketches)

All models are tenant-scoped (`tenantId` + `@@index`) and go through `runWithTenant` isolation (Rule 7).
Additive migration only; enum values added with `ADD VALUE`.

```prisma
// ── FIELD DIARY ─────────────────────────────────────────────────────────────

enum NoteVisibility {
  private   // author + tenant_admin+ only (default)
  shared    // any tenant user with notes:view
}

model Note {
  id            String         @id @default(cuid())
  tenantId      String         @map("tenant_id")
  authorId      String         @map("author_id")

  title         String?                                   // optional; else derived from first line
  // Rich body stored as editor JSON (ProseMirror/TipTap doc). Portable, queryable
  // enough for MVP; a plain-text mirror powers search + report rendering.
  body          Json                                      // { type:"doc", content:[…] }
  bodyText      String         @map("body_text")          // denormalized plaintext for FTS + report

  // MANDATORY stamps — enforced at the tRPC layer, NOT nullable here.
  capturedAt    DateTime       @map("captured_at")        // when the work happened (staff-set, defaults now)
  latitude      Float          @map("latitude")           // REQUIRED
  longitude     Float          @map("longitude")          // REQUIRED
  locationLabel String         @map("location_label")     // REQUIRED (barangay/landmark text)

  visibility    NoteVisibility @default(private)
  projectId     String?        @map("project_id")         // null until Projects phase

  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  tenant        Tenant          @relation(fields: [tenantId], references: [id])
  author        User            @relation("NoteAuthor", fields: [authorId], references: [id])
  project       Project?        @relation(fields: [projectId], references: [id])
  entityRefs    NoteEntityRef[]
  media         NoteMedia[]

  @@index([tenantId])
  @@index([tenantId, authorId])
  @@index([tenantId, capturedAt])
  @@index([tenantId, projectId])
  @@map("notes")
}

// Inline photos — mirrors the ViolationAttachment/KanbanAttachment pattern but
// records the block position so the image renders where it was placed in the body.
model NoteMedia {
  id               String   @id @default(cuid())
  noteId           String   @map("note_id")
  storageKey       String   @map("storage_key")           // opaque @frms/storage key → MediaObject ledger
  originalFilename String   @map("original_filename")
  mimeType         String   @map("mime_type")
  fileSize         Int      @map("file_size")
  blockId          String?  @map("block_id")              // editor node id the image belongs to
  uploadedAt       DateTime @default(now()) @map("uploaded_at")

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  @@index([noteId])
  @@map("note_media")
}

enum NoteRefType {   // which entity a chip links to
  fisherfolk
  vessel
  violation
  ayuda_program
  ayuda_beneficiary
  household
  family
  kanban_task
  fish_catch
}

// A typed, denormalized link from a note to a domain entity. entityId is a
// loose FK (no hard relation — targets are heterogeneous); labelSnapshot keeps
// the chip readable even if the source is later renamed/deleted.
model NoteEntityRef {
  id            String      @id @default(cuid())
  tenantId      String      @map("tenant_id")
  noteId        String      @map("note_id")
  refType       NoteRefType @map("ref_type")
  entityId      String      @map("entity_id")
  labelSnapshot String      @map("label_snapshot")        // e.g. "Juan Dela Cruz (FF-2024-0001)"
  blockId       String?     @map("block_id")              // editor node id for inline placement
  createdAt     DateTime    @default(now()) @map("created_at")

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@index([noteId])
  @@index([tenantId, refType, entityId])   // reverse lookup: "notes mentioning this fisherfolk"
  @@map("note_entity_refs")
}

// ── PROJECTS (Phase 4) ──────────────────────────────────────────────────────

enum ProjectStatus { ACTIVE ARCHIVED COMPLETED }

model Project {
  id          String        @id @default(cuid())
  tenantId    String        @map("tenant_id")
  ownerId     String        @map("owner_id")
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  tenant   Tenant          @relation(fields: [tenantId], references: [id])
  owner    User            @relation("ProjectOwner", fields: [ownerId], references: [id])
  notes    Note[]
  todos    ProjectTodo[]
  files    ProjectFile[]
  members  ProjectMember[]

  @@index([tenantId])
  @@index([tenantId, ownerId])
  @@map("projects")
}

model ProjectTodo {        // lightweight checklist; distinct from board-style KanbanTask (see [WHAT] D4)
  id         String   @id @default(cuid())
  projectId  String   @map("project_id")
  title      String
  done       Boolean  @default(false)
  assigneeId String?  @map("assignee_id")
  dueDate    DateTime? @map("due_date")
  orderIndex Int      @default(0) @map("order_index")
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([projectId])
  @@map("project_todos")
}

model ProjectFile {        // docs/media shelf — same opaque storageKey pattern
  id               String   @id @default(cuid())
  projectId        String   @map("project_id")
  storageKey       String   @map("storage_key")
  originalFilename String   @map("original_filename")
  mimeType         String   @map("mime_type")
  fileSize         Int      @map("file_size")
  uploadedById     String   @map("uploaded_by_id")
  uploadedAt       DateTime @default(now()) @map("uploaded_at")
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([projectId])
  @@map("project_files")
}

model ProjectMember {
  id        String @id @default(cuid())
  projectId String @map("project_id")
  userId    String @map("user_id")
  role      String @default("member")   // owner|member|viewer
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, userId])
  @@index([projectId])
  @@map("project_members")
}
```

**Back-relations to add:** `User` gets `authoredNotes Note[] @relation("NoteAuthor")`, `ownedProjects Project[] @relation("ProjectOwner")`. `Tenant` gets `notes`, `projects`.
**Enum additions (raw SQL in migration):** `ALTER TYPE "FeatureKey" ADD VALUE 'notes'; ALTER TYPE "FeatureKey" ADD VALUE 'projects';`

> **[HOW] Body storage choice:** store the editor doc as `Json` **plus** a denormalized `bodyText` plaintext
> mirror. JSON keeps fidelity (chips, image blocks, formatting); `bodyText` powers Postgres full-text search
> and the report renderer without parsing JSON in SQL. Chips/images are ALSO rows in `NoteEntityRef`/`NoteMedia`
> (source of truth for links + reverse lookup); the JSON holds their placement `blockId`. This dual-write keeps
> referential queries fast and the body self-contained.

---

## 3. The editor

### 3.1 Library recommendation — **TipTap v2** (ProseMirror)

`[WHAT] D1` for the owner, but the strong recommendation is **TipTap**:
- ProseMirror-based, React-first, **schema is a portable JSON doc** (`{type:"doc",content:[…]}`) → maps cleanly to `Note.body Json`.
- First-class extensions for exactly the three required capabilities: **slash commands** (`@tiptap/suggestion` — the same primitive that powers `Mention`), **inline images** (`@tiptap/extension-image` + custom upload node), **mentions/chips** (`@tiptap/extension-mention`, rendered as our entity chip node).
- No new UI system needed — TipTap is headless; toolbar/menus are our own shadcn/ui components (Rule: shadcn only).
- Lexical is the runner-up (Meta, fast) but its serialized state is less ergonomic to re-render server-side for the report; Editor.js stores blocks but has weaker inline-mention support. **Verify current TipTap v2/v3 API + Next 15 RSC guidance via `context7` before install** (Rule 30 — editor must be a client component, `"use client"`).

Packages (pin exact versions at install, confirm via context7): `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-mention`, `@tiptap/extension-image`, `@tiptap/suggestion`. Lives in `apps/web` (a `components/notes/note-editor.tsx` client component); no shared package needed for MVP.

### 3.2 Slash-command architecture

One `/` `suggestion` plugin with a two-tier command palette rendered in a shadcn `Command`/popover:

1. **Formatting / help commands** (synchronous, static list): H1/H2, bullet/numbered list, quote, divider, "insert photo", checkbox, "help". Each maps to a TipTap chain command.
2. **Entity pickers** (async, DB-backed): typing `/fisherfolk juan`, `/vessel …`, `/violation`, `/ayuda`, `/task`, `/household` switches the palette into search mode. Debounced (~250 ms) query → a **new unified tRPC facade** `note.searchEntities({ refType, q, limit:10 })` which dispatches internally to the existing per-entity `list`/search queries (reusing their `OR contains … mode insensitive` filters and tenant scoping — DO NOT re-implement search). Results render as rows; selecting one:
   - inserts a **chip node** (`Mention`-style, non-editable inline atom) showing `labelSnapshot`,
   - writes a `NoteEntityRef` row on save (typed link),
   - optionally expands a one-line detail pull ("FF-2024-0001 · Brgy Salong · ACTIVE") fetched from the entity's `getById`, per owner preference (`[WHAT] D5` — chip-only vs. chip+detail-block).

Chip click → navigate to that entity's detail page (`/{tenant}/fisherfolk/{id}` etc.) using the existing `tenant-href` helper.

### 3.3 Inline images via StorageAdapter

Reuse `upload.uploadFile` exactly. Flow: user picks/drops an image in the editor → client base64-encodes → `trpc.upload.uploadFile.useMutation({ entityType:"note-photo" })` (new `ENTITY_TYPES` member + size cap ~5 MB) → returns opaque `storageKey` → editor inserts an **image node** carrying `storageKey` + `blockId`; on save a `NoteMedia` row is written. Render/read uses `upload.getDownloadUrl` (Telegram-backed, resolved through `MediaObject`). No direct Telegram/MinIO calls — the adapter + ledger stay the single path (cross-scope note: this reuses the shared media bucket; delete-on-note-delete must clean up via `deleteFile`).

### 3.4 Mandatory stamping — enforced at save

- On note **create**, the editor mounts the existing `LocationPicker` (pre-seeded from browser geolocation `LocateFixed` + author's default barangay) and a date/time field defaulting to `now()`.
- **Server-side hard gate:** `note.create`/`note.update` Zod input requires `latitude`, `longitude`, `locationLabel` (non-empty), `capturedAt` — reject with `BAD_REQUEST` if missing. The schema columns are non-nullable, so a note can never persist unstamped. Client blocks the Save button until a location is set. (Location can be captured once and carried; staff may adjust the pin.)

---

## 4. Accomplishment Report (date-ranged export)

**Purpose:** staff self-generate a formatted report of their own notes over a date range for payroll/supervisor review.

- **tRPC:** `note.accomplishmentReport({ from, to, authorId?, projectId? })` — `matrixProcedure("notes","view")`. Default `authorId = ctx.userId` (own notes); querying another user's notes requires `notes:view` + admin tier (`[WHAT] D3` privacy model). Aggregates notes where `capturedAt BETWEEN from AND to`, ordered by `capturedAt`, grouped by day. Returns structured JSON: per-day sections, each note's `capturedAt/locationLabel/bodyText`, linked entities (`labelSnapshot`), photo thumbnails.
- **Rendering options** (`[WHAT] D2`):
  - **A. Print/PDF (recommended default):** a server-rendered React print route `/{tenant}/notes/report/print` styled with `@media print` (mirrors the `idPrint` precedent) → browser "Save as PDF". Zero new deps, honors letterhead/branding, images inline.
  - **B. XLSX:** reuse the `ExcelJS` `buildExcel` pattern from `report.ts` (returns base64) for a tabular variant — cheap to add, good for payroll spreadsheets, but loses formatting/photos.
  - **C. DOCX:** only if the owner needs an editable Word doc → add `docx` npm lib (new dep, defer). 
- **Recommendation:** ship **A (print→PDF)** first; add **B (xlsx)** as a one-liner reusing existing infra. DOCX only on explicit demand.
- Report header carries the mandatory context: staff name, date range, tenant/LGU letterhead, note count, generated-at.

---

## 5. tRPC surface + RBAC + privacy

**New routers** (registered in `root.ts`): `note`, `project` (+ `note.searchEntities` facade).

`note` router (all on `matrixProcedure("notes", <action>)` for data-driven RBAC — Rule 34):
- `note.list({ page, limit, search?, from?, to?, authorId?, projectId? })` — own notes by default; `bodyText contains search`.
- `note.getById({ id })` — with `entityRefs` + `media` (download URLs resolved).
- `note.create(input)` — `write`; **hard-validates stamps** (§3.4); persists body JSON + `bodyText` + entity refs + media rows in one transaction.
- `note.update({ id, … })` — `update`; author-only unless admin.
- `note.delete({ id })` — `delete`; author-only unless admin; cascades `NoteEntityRef`/`NoteMedia` + `deleteFile` each `storageKey`.
- `note.searchEntities({ refType, q, limit })` — `view`; thin dispatcher over existing entity search (reuse, don't duplicate).
- `note.accomplishmentReport({ from, to, authorId? })` — `view` (see privacy below).
- `note.mentionsOf({ refType, entityId })` — reverse lookup ("notes referencing this fisherfolk") for entity detail pages.

`project` router (Phase 4, `matrixProcedure("projects", …)`): `list/getById/create/update/archive`, `addTodo/toggleTodo/reorderTodo`, `attachFile/removeFile`, `addMember/removeMember`, `linkNote/unlinkNote`.

**RBAC / tiers:**
- Add `notes` + `projects` to `FeatureKey` enum → the existing custom-role permission matrix picks them up automatically (tenant-scoped, ≤ tenant_admin ceiling). Seed default matrices: encoders/field staff get `notes:{view,write,update,delete}` on **own** notes.
- **Ownership guard:** `authorId === ctx.userId` for update/delete on private notes; `tenant_admin`+ may view/manage per the visibility/privacy decision.
- All queries inherit `protectedProcedure`'s `runWithTenant(ctx.tenantId)` — tenant isolation is automatic (Rule 7); every `where` still includes `tenantId` defensively.

**Privacy (Rule 33 / RA 10173 — notes may name citizens):**
- Notes are **`private` by default** (author + admins). Cross-user visibility is opt-in (`shared`) or admin-only (`[WHAT] D3`).
- Notes referencing fisherfolk carry PII (names, IDs, locations) → they are **personal data**: covered by the same retention/audit posture as the fisherfolk record. Log create/update/delete to `AuditLog` (`entityType:"note"`). Do **not** expose note bodies in any public/unauthed surface (SEO: notes routes are authed → `noindex` per Rule 35 default). The accomplishment report is an internal document; if exported/printed it inherits the LGU's data-handling policy. Flag in `docs/PRODUCT.md` compliance section on back-port.

---

## 6. Phasing & open [WHAT] decisions

**Phase 1 — MVP Diary (build first):** `Note`/`NoteMedia` models + migration (enum add); `note` router (list/get/create/update/delete) with **mandatory stamp gate**; TipTap editor (formatting slash commands + inline photo via `upload` reuse) wired to `LocationPicker`; notes list + detail pages under `/{tenant}/notes`. Delivers a usable stamped field journal.

**Phase 2 — Slash entity pickers:** `NoteEntityRef` model; `note.searchEntities` facade + chip node + `Mention` extension; reverse `mentionsOf` surfaced on entity detail pages. Delivers the linking/reference value.

**Phase 3 — Accomplishment Report:** `note.accomplishmentReport` + print route (option A) + optional xlsx (option B). Delivers the payroll deliverable.

**Phase 4 — Projects / PM:** `Project*` models + `project` router + project workspace UI consolidating notes/todos/files. Owner-gated scope; likely its own plan doc.

**OPEN [WHAT] decisions (record in `PENDING_DECISIONS.md`):**
- **D1 — Editor library:** confirm **TipTap** (recommended) vs Lexical.
- **D2 — Report format:** print→PDF only, or +XLSX, or +DOCX? (recommend A then B.)
- **D3 — Note privacy/sharing model:** strictly private + admin-view, or per-note `shared`, or team/project-shared? Who (which tier) may read another staffer's notes for a report?
- **D4 — Projects vs existing Kanban:** does a Project's todos reuse/relate to `KanbanTask` (which already has `sourceEntityType/sourceEntityId` and a board UI), or stay a separate lightweight `ProjectTodo` checklist? (Recommend: lightweight `ProjectTodo` for in-project checklists; allow *linking* a `KanbanTask` via `NoteEntityRef`/project link rather than merging models.)
- **D5 — Chip depth:** entity chip = link-only, or chip + an auto-pulled inline detail block (name/ID/status/barangay)? Detail block is richer but goes stale — snapshot vs live-fetch.
- **D6 — capturedAt vs createdAt:** allow staff to set `capturedAt` in the past (back-dating field work) — yes/no, and any max back-date window for payroll integrity.

---

## 7. Integration notes (all additive — nothing existing changes behavior)

- **Storage:** reuse `upload.uploadFile`/`getDownloadUrl` + `@frms/storage` + `MediaObject` ledger untouched; only add `"note-photo"` to `ENTITY_TYPES` and a size cap. Note deletion must call `deleteFile(storageKey)` for each `NoteMedia`/`ProjectFile` (cross-scope cleanup — shared media backend).
- **Entity search:** `note.searchEntities` is a **facade** over existing `fisherfolk.list`/`vessel.list`/… search — no duplicate query logic, keeps tenant scoping + RBAC of the source procedures.
- **Location:** reuse `LocationPicker` (`components/shared/location-picker.tsx`) verbatim; persist to `Note.latitude/longitude/locationLabel` (same Float pattern as `Fisherfolk`/`FishCatch`).
- **Print/export:** reuse the `report.ts` `ExcelJS` + `idPrint` print-route precedents; no new export infra for options A/B.
- **RBAC:** additive `FeatureKey` enum values feed the existing data-driven matrix — no new authorization mechanism.
- **Nav/shell:** add a "Diary / Notes" sidebar item (and later "Projects"); footer version tag/white-label unchanged.
- **Migration safety:** single additive migration (new tables + `ADD VALUE` enum); no data backfill; reversible by dropping the new tables (enum values are add-only in Postgres — acceptable). HARD HOLD: local commit only, no deploy.

---

*End of plan. Back-port the accepted decisions into `docs/PRODUCT.md` (Rule 1) and log D1–D6 in
`PENDING_DECISIONS.md` before any Phase 1 code is written.*
