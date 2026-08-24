# Task Queue — Fisherfolk Registration & Management System

Fleet-standard task backlog (`task-capture-discipline.md`). Status: **TODO 🔴 · PARTIAL 🟡 · DONE ✅**.
Captures owner-dumped asks AND agent-found out-of-scope items. Distilled spec only — never raw prose.
Not a decisions log — owner-gated `[WHAT]`s live in `PENDING_DECISIONS.md`.

## 🔴 / 🟡 Open

- 🟡 **Import `08-14-26` masterlist batch → dev + prod.** 92 new fisherfolk (+94 photos +94 signatures) from
  `_tempfiles/08-14-26/`. Tool: generalized `apps/web/scripts/import-tempfiles.ts` (`--dir`) + telegram-ledger
  fix. Dev DONE+verifying; prod pending (owner-approved both envs). Done-criterion: 94/94 records present with
  photo+signature + media_objects ledger rows, on dev AND prod; browser render confirmed. `<source: owner 2026-08-24>`

## ✅ Done recently

- ✅ **Legacy `fmo.powerbyte.app` reconcile.** Old PHP/SQLite app (3016 recs) is 100% already in FRMS; the lone
  "missing" (VILLANUEVA M-JAY ALEJO, malformed ID `2024-17505000-007796`) already exists under corrected ID
  `2024-175205000-07796` with media. No import needed. (2026-08-24)
- ✅ **Fixed latent ledger bug in import scripts (telegram path).** `import-tempfiles.ts` Phase 2/3 used the
  S3-only `uploadFile` → uploaded to MinIO + wrote no `media_objects` row → telegram `/api/media` 404. Now
  branches on `getStorageBackend()`: telegram → `TelegramAdapter` + ledger upsert; minio/s3 → uploadFile.
  (branch `feat/import-tool-dir-arg`, 2026-08-24)
