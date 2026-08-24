# Task Queue — Fisherfolk Registration & Management System

Fleet-standard task backlog (`task-capture-discipline.md`). Status: **TODO 🔴 · PARTIAL 🟡 · DONE ✅**.
Captures owner-dumped asks AND agent-found out-of-scope items. Distilled spec only — never raw prose.
Not a decisions log — owner-gated `[WHAT]`s live in `PENDING_DECISIONS.md`.

## 🔴 / 🟡 Open

_(none)_

## ✅ Done recently

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
