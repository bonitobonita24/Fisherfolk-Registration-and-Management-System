# Task Queue — Fisherfolk Registration & Management System

Fleet-standard task backlog (`task-capture-discipline.md`). Status: **TODO 🔴 · PARTIAL 🟡 · DONE ✅**.
Captures owner-dumped asks AND agent-found out-of-scope items. Distilled spec only — never raw prose.
Not a decisions log — owner-gated `[WHAT]`s live in `PENDING_DECISIONS.md`.

## 🔴 / 🟡 Open

- 🟡 **Server `redirect()` 308 on demo custom-domain (low prio, deferred).** The 12 RSC `redirect()` guard-bounces
  (`layout.tsx`, `[tenant]/page.tsx`, register/new pages, admin/kanban) still emit slug-prefixed targets, so on the
  masked demo host they take one extra 308-inverse-mask hop. Left as-is with the host-aware-links work: they fire
  rarely (not per-click), are auth-critical, and the middleware already routes primary custom-domain traffic with
  clean paths. Fix later with the async `tenantHref()` helper if desired. `agent-found 2026-08-26`

## ✅ Done recently

- ✅ **Host-aware in-app links — kill demo custom-domain 308-on-click.** New `src/lib/tenant-href*` helpers
  (`useTenantHref()` client hook + `tenantHref()` server helper + pure `computeTenantPrefix`/`joinTenantPath`);
  migrated ~45 nav sites (client `<Link>`/`router.push` + server `<Link>`) so links are clean on a masked
  custom-domain host and slug-prefixed `/{slug}/...` on subdirectory hosts (prod unchanged, invariant unit-tested).
  `notificationHref()`/`sourceEntityLink()` now return tenant-relative paths. Verified: tsc 0, lint clean, 410 tests
  (8 new), live dev nav sweep (22 links slug-prefixed, 0 slugless, 0 console errors). Branch
  `feat/tenant-host-aware-links` `266449b`, LOCAL/HARD HOLD. (owner-approved "central helper + migrate", 2026-08-26)
- ✅ **`/fisherfolk/new` returned 400 → now 404 (agent-found bug).** `/{tenant}/fisherfolk/new` matched the `[id]`
  route with id="new"; the tRPC `getById` `.cuid()` input rejected it as BAD_REQUEST (400). Guarded the detail + edit
  server routes with a cuid check → clean `notFound()` (404). Verified live (HTTP 404). Branch
  `fix/fisherfolk-invalid-id-404` `2ed5cb9`, LOCAL/HARD HOLD. (2026-08-26)
- ✅ **Merged `feat/import-tool-dir-arg` → main** (`--no-ff`, `a057545`); LOCAL, unpushed (HARD HOLD). (2026-08-26)

- ✅ **Backfilled the 73 FRMS-only fisherfolk into the live FMO app** (records added directly in FRMS after the
  original migration). FMO SQLite 3108→**3181** (73 INSERT OR IGNORE; 1 skipped = VILLANUEVA already present under
  its old ID); 146 images fetched from FRMS's Telegram store into FMO `uploads/`. Verified: 73/73 with
  image+signature, images HTTP 200, **FMO total now == FRMS 3181, 0 real people missing either way**. Live DB
  backed up first (`fisherfolk.sqlite.bak-pre-frms73-*`). (owner-approved, 2026-08-24)
- ✅ **Import `08-14-26` masterlist → OLD live app `fmo.powerbyte.app` too.** Old app still in use (FRMS not yet
  publicly launched), so the same 92 people were added there: SQLite `data/fisherfolk.sqlite` 3016→3108 (92
  INSERT OR IGNORE via container PHP PDO; category booleans/DOB/barangay mapped to FMO conventions) + 184 files
  into `uploads/` (6093→6277). Verified: 92/92 with image+signature, images serve HTTP 200 on the live site.
  Live DB backed up first (`fisherfolk.sqlite.bak-pre-0814masterlist-20260824-130524`). (owner-approved, 2026-08-24)
- ✅ **Import `08-14-26` masterlist batch → dev + prod.** 92 new fisherfolk (+94 photos +94 signatures) from
  `_tempfiles/08-14-26/`, via generalized `import-tempfiles.ts --dir`. Verified BOTH envs: 94/94 records with
  photo+signature, 188/188 telegram media_objects ledger rows, total 3089→3181. Render proven: dev in-browser
  (image/jpeg 40KB via /api/media); prod bot getFile→HTTP 200 40043 bytes. Prod DB backed up first
  (`frms-prod-backup-pre-masterlist-import-20260824-005753.sql.gz`). (owner-approved both envs, 2026-08-24)

- ✅ **Legacy `fmo.powerbyte.app` reconcile.** Old PHP/SQLite app (3016 recs) is 100% already in FRMS; the lone
  "missing" (VILLANUEVA M-JAY ALEJO, malformed ID `2024-17505000-007796`) already exists under corrected ID
  `2024-175205000-07796` with media. No import needed. (2026-08-24)
- ✅ **Fixed latent ledger bug in import scripts (telegram path).** `import-tempfiles.ts` Phase 2/3 used the
  S3-only `uploadFile` → uploaded to MinIO + wrote no `media_objects` row → telegram `/api/media` 404. Now
  branches on `getStorageBackend()`: telegram → `TelegramAdapter` + ledger upsert; minio/s3 → uploadFile.
  (branch `feat/import-tool-dir-arg`, 2026-08-24)
