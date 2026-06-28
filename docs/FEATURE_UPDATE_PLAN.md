# Phase 7 Feature Update — attachments + profile relations

**Branch:** `feat/attachments-profile-relations` (stacked on `feat/violations-ayuda-kanban-crud`, which is
PR #3 / unmerged). UNMERGED, HARD HOLD — owner merges/deploys.
**Requested:** 2026-06-28 by owner (verbal TODO; PRODUCT.md back-port owed — see DECISIONS_LOG).

## Owner decisions (locked 2026-06-28)
- **Violator entry (item 2):** type-ahead picker for REGISTERED fisherfolk **+ free-text name** for
  violators NOT in the system (stored as `Violation.violatorName`, no FK link).
- **Kanban attachments (item 1):** ADD real attachment support to Kanban tasks (new `KanbanAttachment`
  model + upload UI), then seed demo files.
- **File types:** Images (jpeg/png/webp) + PDF only. **15 MB** max per file.

## Loop protocol (same as CRUD plan)
1. Anti-thrashing scope check. Read ONLY files for the current batch.
2. Do the FIRST unchecked batch. Dispatch parallel `spec-executor`s for independent files (R7).
3. Verify `cd apps/web && pnpm exec tsc --noEmit` clean. Do NOT run `pnpm build`/`pnpm dev`.
4. Commit (Rule 23 — this branch). Check off here. Reboot between batches.
5. When ALL batches checked: rebuild dev image + browser-QA all flows, then close.

## Env / infra facts
- frms dev DB: postgres `localhost:44377/frms_dev`; migrate via `pnpm --filter @frms/db db:migrate`.
- Storage (`@frms/storage`) already allows `application/pdf` + image/jpeg|png|webp w/ magic-byte check.
  Ceiling `MAX_FILE_SIZE_BYTES` was 10 MB → bumped to 15 MB in Batch A.
- Upload router `apps/web/src/server/trpc/routers/upload.ts`: per-entity size limits; entity types enum.
- Reusable: `components/shared/file-upload.tsx`, `<StatusBadge>`, `upload.getDownloadUrl`.
- Existing: `Violation.evidenceImages String[]` (legacy image keys), `AyudaUpload` model (ayuda files).

## Batches

### Batch A — Upload + schema foundation ✅ DONE (commit pending)
- [x] schema.prisma: `Violation.violatorName String?`; new `ViolationAttachment` + `KanbanAttachment`
  models (mirror `AyudaUpload`: filePath/originalFilename/mimeType/fileSize/uploadedBy, parent-cascade);
  `attachments` relations on Violation + KanbanTask; back-relations on User; `AyudaUpload.mimeType String?`.
- [x] storage `validation.ts`: `MAX_FILE_SIZE_BYTES` 10→15 MB.
- [x] upload router: entity types `violation-evidence`, `ayuda-upload`, `kanban-attachment` added;
  `MAX_BYTES_BY_ENTITY` per-entity map (15 MB new doc entities; 5 MB photo/signature/vessel).
- [x] Migration `20260628150127_add_attachments_and_violator_name` applied (additive only) + generate; tsc clean.

### Batch B — Violations ✅ DONE
- [x] item 2: violator = registered picker OR free-text name (violatorName) — toggle in file form + create proc.
- [x] item 2a: upload images+PDF (ViolationAttachment) via shared `AttachmentUpload` in file form;
  render on detail via shared `AttachmentList` (img inline, pdf link). Shared components reused by Batch D.
- [x] item 2b: status badge ACTIVE=red, LIFTED=green (color override on detail + list columns; global map unchanged).
- NOTE: lint caught 1 unused-arg ESLint error tsc missed (CRUD lesson confirmed) — fixed. tsc + next lint clean.

### Batch C — Fisherfolk profile ✅ DONE
- [x] item 3: removed ADDRESS field from detail (kept barangay).
- [x] item 3a: "Latest Violations" section (red/green status) linked to violation detail.
- [x] item 3b: "Ayuda Received" section (program + received/added date + status) linked to ayuda program.
- [x] item 3c: "Registered Vessels" section (multiple, ACTIVE) with vessel info linked to vessel detail.
- NOTE: getById already included vessels+violations; only added ayudaBeneficiaries. tsc + next lint clean.

### Batch D — Ayuda uploads ✅ DONE
- [x] item 4: multi image/PDF upload (15 MB) on program detail — "Program Files" card with shared
  `AttachmentUpload` (entityType ayuda-upload) + Save; render via shared `AttachmentList` (img/pdf).
  Backend: `AyudaUploadType.DOCUMENT` added; `getProgramById` includes uploads; `addUploads` +
  `removeUpload` adminProcedures; image→EVENT_PHOTO, pdf→DOCUMENT. `AttachmentList` gained optional
  `onRemove` (admin-only remove; violations detail unchanged). tsc + next lint clean.

### Batch E — Demo files seed ✅ DONE
- [x] item 1: 8 demo assets in `packages/db/demo-assets/` (PIL-generated labeled PNG/JPG + PDFs);
  idempotent linker `packages/db/scripts/seed-demo-files.ts` (`pnpm --filter @frms/db db:seed-demo-files`)
  uploads via @frms/storage + creates ViolationAttachment/KanbanAttachment/AyudaUpload rows + sets
  vessel.vesselPhoto. Ran against dev DB. Idempotent via `{ none: {} }` / `vesselPhoto: null`.

## Status: ✅ ALL BATCHES COMPLETE (A–E). Remaining: rebuild dev image from this branch + browser-QA;
## then PRODUCT.md back-port (owner) + merge decision (HARD HOLD — owner).
## NOTE: dev container frms_dev_app is a BAKED image (built from feat/violations-ayuda-kanban-crud at T4);
## must rebuild from this branch to QA the new UI (per CRUD T4 lesson — not hot-reload).
