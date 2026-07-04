# FRMS Telegram-Storage Migration Plan

> **Status:** PLAN ONLY — no code has been changed. Untracked working doc.
> **Author:** Architect (planning session), 2026-07-03.
> **Goal:** Move ALL FRMS fisherfolk media (photos + signatures, and the other
> media entities that ride the same storage package) off self-hosted MinIO/S3
> onto **Telegram-bot storage**, make Telegram the default backend going
> forward, keep MinIO working during migration (dual-read), and reclaim the
> ~100 GB VPS disk only after per-object verification. AWS S3 stays a
> future config-swap target.

---

## 0. Reference: what Marine-Guardian already proves in production

MG runs Telegram storage today for EarthRanger event photos. The proven pieces
this plan reuses almost verbatim:

| MG file | What it gives us |
|---|---|
| `packages/jobs/src/lib/telegram-storage.ts` | `uploadDocumentToTelegram()` (multipart `sendDocument`, returns `{messageId, fileId}`) + `fetchTelegramFileBytes()` (getFile → download, **bounded 429 retry honouring `retry_after`**, 20 MB cap note) + `getTelegramBotToken()`. Dependency-free (Node 22 `fetch`/`FormData`/`Blob`). |
| `scripts/archive-er-assets.ts` | Bulk archiver pattern: idempotent via a unique constraint, `--dry-run`, `--limit`, `--delay-ms` (default **1200 ms** between uploads = per-chat flood-wait guard), `withRetry()` exponential backoff, paged enumeration. |
| `apps/web/src/app/api/assets/[id]/route.ts` (+ `__tests__/route.test.ts`) | The proxied retrieval contract: **manual auth → rate-limit → tenant-scoped DB lookup (`id + tenantId`, 404 not 403 on miss) → 404 if no `telegramFileId` → `ASSET_DOWNLOAD` AuditLog written BEFORE fetch → `fetchTelegramFileBytes` → serve with `Cache-Control: private, max-age=86400, immutable`**. `telegramFileId` never leaves the server. |
| `apps/web/src/server/lib/asset-bytes.ts` | `resolveAssetBytes()` cache→Telegram→write-through core; optional R2 read-through behind `R2_CACHE_ENABLED`. |
| `scripts/telegram-verify.mjs` | One-time bot+channel verifier: resolves numeric `chat_id`, posts a test message/photo, prints the values to store in Server-Setups. |
| migration `20260627060000_telegram_asset_storage` | `tenants.telegram_channel_id TEXT` + `event_assets` ledger (`telegram_file_id`, `telegram_message_id`, `size_bytes`, `mime_type`, unique `(tenant_id, er_file_id)`). |

**We copy MG's `telegram-storage.ts` and `asset-bytes.ts` into FRMS almost
unchanged** and adapt only the persistence/lookup layer to FRMS's data model.

---

## 1. Current FRMS storage — ground truth (read from code)

**Package `@frms/storage`** (`packages/storage/src/`, prisma-free, pure S3):
- `client.ts` — lazy `S3Client` from `STORAGE_ENDPOINT` / `STORAGE_REGION` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET`, `forcePathStyle:true` (MinIO).
- `upload.ts` — `uploadFile()` (magic-byte + size validate → `PutObject` → `{key,bucket,sizeBytes,mimeType}`), `getFileDownloadUrl(key, requestingTenantId, expiresIn=3600)` (tenant-guard via `extractTenantFromKey`, then **presigned GET URL**), `deleteFile()`, `fileExists()`.
- `validation.ts` — `generateStorageKey(tenantId, entityType, filename)` → **`{tenantId}/{entityType}/{16-hex}.ext`**; `extractTenantFromKey()` = substring before first `/`. Allowed MIME: jpeg/png/webp/pdf. Max 15 MB.

**The media reference is stored INLINE as the key string on the domain models**
(no separate asset table today):
- `Fisherfolk.photo String?` and `Fisherfolk.signature String?` (schema lines 267-268) — **two media fields on one row**.
- `Vessel.vesselPhoto String? @map("vessel_photo")` (line 319).
- `Tenant.logoUrl`, `Tenant.mayorSignatureUrl` (branding; may or may not be in scope — see §9 note).
- Attachment-style entities via the upload router's `entityType` enum: `violation-evidence`, `ayuda-upload`, `kanban-attachment`, `id-template-bg` (keys stored on their respective rows / attachment records).

**tRPC `upload` router** (`apps/web/src/server/trpc/routers/upload.ts`):
- `uploadFile` (encoderProcedure) — base64 → buffer → `uploadFile()` → returns `{key, sizeBytes, mimeType, downloadUrl}`.
- `getDownloadUrl` (protectedProcedure — all same-tenant roles incl. Viewer/Bantay Dagat) — `{key}` → `getFileDownloadUrl(key, ctx.tenantId, 3600)` → `{url}`.
- `ENTITY_TYPES` + `MAX_BYTES_BY_ENTITY` (fisherfolk-photo/signature = 5 MB each).

**How media is displayed (the critical retrieval contract):**
- Client components call `trpc.upload.getDownloadUrl.useQuery({key})` and drop the returned URL straight into `<img src={url}>`. Confirmed in `fisherfolk/[id]/fisherfolk-detail-client.tsx` (photo + signature), `vessels/[id]/…`, `violations/[id]/…`, `components/shared/attachment-list.tsx`, `components/fisherfolk/photo-upload.tsx`, `signature-pad.tsx`, and the ID pipeline.
- **ID card generation is browser-side**: `components/id-card-renderer.tsx` renders `<img src={photoUrl}>` in print mode; `id-generator/*` and `idPrint.ts` list eligible records with their `photo`/`signature` keys and the client resolves each to a URL. No server-side byte fetching for ID cards — the browser fetches the URL with the session cookie.

**Runtime:** Next.js app-router, tRPC, Prisma, pnpm@10, Node ≥22 (global `fetch`/`FormData`/`Blob` available — same as MG, so **no new npm deps**). Current real tenant `calapan-city`, ~3,003 fisherfolk / ~2,979 photos in MinIO.

### 1.1 The one design gap vs MG (drives the whole adapter)

MG keeps a **separate `event_assets` ledger** and serves `<img src="/api/assets/{assetId}">`. FRMS keeps the **key string inline on the domain field** and serves a **presigned URL** resolved per-render. Telegram has **no presigned URLs** — bytes can only come back through a bot-token proxy. Therefore the migration must:

1. Introduce a **key → Telegram file-id map** (a ledger), because the domain field only holds an opaque key and we must not churn every domain model with telegram columns (Fisherfolk alone needs two).
2. Change what `getDownloadUrl` returns for the Telegram backend: **a proxied app URL** (`/api/media/…`) instead of a presigned S3 URL — this keeps the client `<img src={url}>` code and the tRPC contract **unchanged**.

This is the key FRMS-specific decision and is baked into §2–§5 below.

---

## 2. Adapter architecture (config-driven backend selection)

**Config:** `STORAGE_BACKEND = minio | telegram | s3` (default `minio` until cutover, then `telegram`). One env var; AWS S3 later is the same `S3Client` already in `client.ts` pointed at AWS creds — a pure config swap, no code.

**Introduce a `StorageAdapter` interface** in `@frms/storage` and keep the package **prisma-free** (mirrors MG's clean split — the low-level lib never touches the DB):

```
interface StorageAdapter {
  upload(input): Promise<UploadResult>      // UploadResult gains optional telegram metadata
  getDownloadUrl(key, tenantId, ttl): Promise<string>
  delete(key, tenantId): Promise<void>
  exists(key, tenantId): Promise<boolean>
}
```

- `S3Adapter` — today's `upload.ts` behaviour verbatim (serves MinIO **and** future AWS S3; both are `S3Client`).
- `TelegramAdapter`:
  - `upload()` → `generateStorageKey()` (unchanged key format) → `uploadDocumentToTelegram()` (see §4) → returns `UploadResult` **enriched** with `{ backend:"telegram", telegramFileId, telegramMessageId, telegramChatId, sizeBytes, mimeType }`. It does **not** write the DB.
  - `getDownloadUrl(key)` → returns a **proxied relative URL** `"/api/media?key=" + encodeURIComponent(key)` (no network, no DB — just formats the URL). The proxy route (§5) does the tenant-scoped ledger lookup + byte fetch.
  - `delete()` → best-effort: Telegram bot API cannot delete channel messages older than 48 h reliably, so `delete` marks the ledger row deleted (and optionally `deleteMessage` best-effort). Physical bytes persist in the channel — acceptable; note in DECISIONS_LOG.
- New pure module `packages/storage/src/telegram.ts` = **copy of MG `telegram-storage.ts`** (`uploadDocumentToTelegram`, `fetchTelegramFileBytes`, `getTelegramBotToken`, response types, 429 backoff constants).

**Ledger persistence lives in the app layer** (like MG's route + `asset-bytes.ts`), not in the package: the `upload` router writes the `MediaObject` row from the enriched `UploadResult`; the `/api/media` route reads it. This keeps `@frms/storage` dependency-clean and swappable.

**Backend resolution helper** `resolveBackend()` reads `STORAGE_BACKEND`; a thin factory returns the right adapter. `getDownloadUrl` is **dual-read aware** during migration (see §7): the proxy route decides Telegram-vs-MinIO per object from the ledger.

---

## 3. Channel model — RECOMMENDATION

**Single default channel + optional per-tenant override.**

- Env `TELEGRAM_DEFAULT_CHANNEL_ID` (numeric chat_id, e.g. `-100…`).
- Optional `Tenant.telegramChannelId String? @map("telegram_channel_id")`.
- **Resolution:** `tenant.telegramChannelId ?? process.env.TELEGRAM_DEFAULT_CHANNEL_ID` — override if set, else default. Fail loudly if neither is set.

**Why this differs from MG's pure per-tenant model:** MG's tenants are distinct
conservation organisations that each demand hard physical isolation, so MG
made `telegram_channel_id` mandatory-per-tenant. FRMS's tenants are **LGUs
operated under one Powerbyte account** (today just `calapan-city`); forcing a
new Telegram channel + bot-admin step on every LGU onboarding is friction with
no security payoff, because **tenant isolation is already enforced in Postgres**
(`MediaObject.tenantId` + the `{tenantId}/…` key prefix + the proxy route's
`tenantId` scope). The default channel gives **zero storage-reconfig
onboarding**; the per-tenant override is kept for the LGU that later wants
physical channel isolation (e.g. a data-sensitivity requirement). Every upload
caption embeds `tenantId` + `entityType` + storageKey so even a shared channel
is auditable and records are unambiguous.

---

## 4. Schema changes (additive, tenant-scoped)

Two additive changes; **no domain-field churn** (Fisherfolk.photo/signature etc. keep holding the key string):

**4a. `Tenant.telegramChannelId`** (optional override):
```
telegramChannelId String? @map("telegram_channel_id")
```

**4b. New `MediaObject` ledger** — the key→Telegram map, keyed by the stable storageKey:
```
model MediaObject {
  id                 String   @id @default(cuid())
  tenantId           String   @map("tenant_id")
  storageKey         String   @map("storage_key")           // == the {tenantId}/{entityType}/{hex}.ext stored on domain fields
  entityType         String   @map("entity_type")           // fisherfolk-photo | fisherfolk-signature | vessel-photo | …
  backend            String   @default("telegram")          // telegram | minio | s3  (per-object, enables dual-read)
  telegramChatId     String?  @map("telegram_chat_id")
  telegramFileId     String?  @map("telegram_file_id")
  telegramMessageId  BigInt?  @map("telegram_message_id")
  sizeBytes          Int?     @map("size_bytes")
  mimeType           String?  @map("mime_type")
  migratedAt         DateTime? @map("migrated_at")           // set when bulk-migrated + verified
  minioReclaimedAt   DateTime? @map("minio_reclaimed_at")    // set when the source object was deleted from MinIO
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  tenant             Tenant   @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, storageKey])   // idempotency for the migration + fast lookup
  @@index([tenantId])
  @@index([tenantId, backend])
  @@map("media_objects")
}
```
Add `mediaObjects MediaObject[]` to `Tenant`. Migration is a plain additive
`prisma migrate` (new table + one nullable column) — **safe on the live DB**,
no backfill required at migration time (backfill is the §6 script).

> **Design note — why a ledger, not inline telegram columns:** FRMS stores two
> media fields on Fisherfolk (photo + signature) and more on other models;
> inline `telegram_*` columns would multiply per field and force edits to every
> media-bearing model, `idPrint.ts` selects, and detail queries. A ledger keyed
> by the already-stored `storageKey` means **the domain models and all their
> queries are untouched** — only the upload write-path and the download
> resolve-path change. This is the cleanest adaptation of MG's pattern to
> FRMS's inline-key model.

---

## 5. Upload path (new media → Telegram)

`upload.uploadFile` router mutation, Telegram backend:
1. Validate (unchanged: MIME magic-bytes, per-entity size cap).
2. `generateStorageKey(tenantId, entityType, filename)` — **unchanged key format**.
3. Resolve channel = `tenant.telegramChannelId ?? TELEGRAM_DEFAULT_CHANNEL_ID`.
4. `uploadDocumentToTelegram({ botToken, chatId, bytes, filename, mimeType, caption })` where `caption = "{tenantId} · {entityType} · {storageKey}"`.
   - **Use `sendDocument`, not `sendPhoto`** (MG already does). `sendPhoto`
     recompresses to lossy JPEG and downsizes — unacceptable for ID photos and
     especially signatures. `sendDocument` preserves exact bytes and returns a
     stable `document.file_id`. **Flag/decision:** the task said
     "`sendPhoto`/`sendDocument`"; the recommendation is **sendDocument only**
     for fidelity. (Helper already falls back to `photo.at(-1).file_id` if
     Telegram coerces small JPEGs to a photo, but documents avoid that.)
5. Persist a `MediaObject` row `{tenantId, storageKey, entityType, backend:"telegram", telegramChatId, telegramFileId, telegramMessageId, sizeBytes, mimeType, migratedAt: now()}`.
6. Write the storageKey to the domain field as today (`Fisherfolk.photo = key`, etc.) — **no change to that write**.
7. Return `{ key, sizeBytes, mimeType, downloadUrl: "/api/media?key="+enc(key) }`.

**Retry / flood-wait:** wrap the `uploadDocumentToTelegram` call in
`withRetry()` (copied from MG, exp backoff). Telegram 429 on send returns
`retry_after`; honour it. The upload router already rate-limits per user, which
naturally paces interactive uploads well under the per-chat limit.

---

## 6. Retrieval — proxied endpoint (mirrors MG `/api/assets/[id]`)

New route `apps/web/src/app/api/media/route.ts` (query-param `?key=` because the
storageKey contains `/`; or `/api/media/[id]` keyed by `MediaObject.id` — either
works, `?key=` keeps the client change to a URL-format only). Contract copied
from MG:

1. **Manual auth** via FRMS's route-auth equivalent (tRPC bypassed) → 401.
2. **Rate-limit** via the existing `upload`/read tier → 429.
3. Parse `key`; **tenant-scope**: `MediaObject.findFirst({ where: { storageKey: key, tenantId: session.tenantId } })`. Also assert `extractTenantFromKey(key) === session.tenantId` (defence in depth). **404 (not 403)** on miss / cross-tenant.
4. **404** if `backend==="telegram"` and `telegramFileId` is null (not yet migrated) — dual-read (§7) instead falls back to MinIO here.
5. **AuditLog BEFORE fetch** — write a `MEDIA_DOWNLOAD` audit row (`action`, `userId`, `tenantId`, `entityType:"MediaObject"`, `entityId: mediaObject.id`, `changesJson:{ storageKey, entityType }`). Use FRMS's existing AuditLog model (the app already has `auditLogs` relation + audit infra; confirm the exact enum/action name at build — MG uses `ASSET_DOWNLOAD`, FRMS should add `MEDIA_DOWNLOAD`).
6. `resolveMediaBytes()` = **copy of MG `asset-bytes.ts`** → `fetchTelegramFileBytes({ botToken, fileId })` (429-retry inside). Optional R2 read-through later behind `R2_CACHE_ENABLED` (parked; MinIO/dev has ample bandwidth — not needed for cutover).
7. Serve `new NextResponse(bytes, { headers: { "Content-Type": row.mimeType, "Content-Disposition": inline-or-attachment by MIME allowlist, "Cache-Control": "private, max-age=86400, immutable" } })`. **`telegramFileId` never returned to the client.**
8. On Telegram failure → clean **502** (never a crash), matching MG.

**Client / tRPC impact — minimal:** `upload.getDownloadUrl` keeps returning
`{url}`; for Telegram objects `url = "/api/media?key="+enc(key)`. Every
`<img src={url}>` site (fisherfolk detail, vessel, violation, attachment-list,
photo-upload/signature-pad previews, `id-card-renderer`, id-generator) works
unchanged because they only ever consume a URL string. **ID-card print** works:
the browser fetches `/api/media?key=…` with the session cookie during print.

**20 MB cap:** getFile download is capped at 20 MB; FRMS photos ≤5 MB and
signatures are tiny PNGs, violation/ayuda evidence ≤15 MB — **all under 20 MB**.
A **self-hosted Local Bot API server is NOT needed.** (Only revisit if a future
entity needs >20 MB retrieval or >50 MB upload.)

---

## 7. Bulk migration script (idempotent · resumable · throttled · verified)

New `scripts/migrate-media-to-telegram.ts` (tsx), modelled on MG `archive-er-assets.ts`.

**Enumeration — cover every media field, not just fisherfolk:**
- `Fisherfolk.photo`, `Fisherfolk.signature` (primary volume).
- `Vessel.vesselPhoto`.
- Attachment/evidence keys: `violation-evidence`, `ayuda-upload`, `kanban-attachment`, `id-template-bg` (enumerate from wherever those keys are persisted — confirm the exact tables at build; the upload `entityType` enum is the checklist).
- **Decision flag:** `Tenant.logoUrl` / `Tenant.mayorSignatureUrl` — branding assets. Include or leave on MinIO? Recommend **include** for a clean cutover, but they may be external URLs not storage keys — verify per value (skip anything that isn't a `{tenantId}/…` key).

**Per object:**
1. Skip if a `MediaObject` row already exists for `(tenantId, storageKey)` with a non-null `telegramFileId` (**idempotent / resumable** — re-runs only touch unmigrated objects).
2. Read bytes from MinIO (`GetObject` via existing `S3Client`), detect MIME/size.
3. `uploadDocumentToTelegram()` to the resolved channel (caption = `{tenantId}·{entityType}·{key}`), inside `withRetry()`.
4. **Verify before marking done:** call `fetchTelegramFileBytes` **getFile HEAD** (resolve file_path) — or compare returned `file_size` to source size — to confirm the file is retrievable. Only then `upsert` the `MediaObject` row with `telegramFileId`, `telegramMessageId`, `sizeBytes`, `mimeType`, `backend:"telegram"`, `migratedAt: now()`.
5. `sleep(--delay-ms, default 1200)` between uploads (per-chat flood-wait guard).
6. Progress logging every N objects; on 429 honour `retry_after`.

**Flags:** `--dry-run` (enumerate + count + print plan, upload nothing),
`--limit N`, `--delay-ms`, `--entity <type>` (migrate one entity class at a
time), `--tenantId`. **Dry-run first** — it prints the exact object counts and
total bytes (the authoritative volume, since MinIO can't be counted from this
planning session).

**Volume + wall-clock estimate:** ~3,003 fisherfolk ⇒ up to ~3,003 photos +
~3,003 signatures ≈ **~6,000 fisherfolk media objects** (task confirms ~2,979
photos already in MinIO), plus a few hundred vessel/violation/ayuda objects ⇒
**~6,000–7,000 total**. At the safe 1,200 ms/upload cadence + a verify round
trip (~+0.3–0.5 s): **≈1.5–2.0 s/object ⇒ ~2.5–4 hours wall-clock** for a full
single-threaded backfill. Run it detached/overnight; it is resumable if
interrupted. (Throughput can be nudged by lowering `--delay-ms`, but 1,200 ms is
the proven-safe MG value — do not go below ~1,000 ms without watching for 429s.)

**Guarded disk-reclaim (separate, later step) — `scripts/reclaim-minio.ts`:**
- Runs ONLY after §8 DB backup is confirmed.
- For each `MediaObject` where `backend="telegram"` AND `telegramFileId != null` AND `migratedAt != null` AND `minioReclaimedAt == null`:
  1. **Re-verify** the object is retrievable from Telegram right now (getFile succeeds, size matches).
  2. Only then `DeleteObject` from MinIO for that storageKey.
  3. Set `minioReclaimedAt = now()`.
- `--dry-run` + `--limit` + progress. **Never deletes an object it did not just
  verify in Telegram.** This is what actually frees the ~100 GB VPS disk.

---

## 8. Cutover & rollback

**Dual-read window (default during migration):**
- The `/api/media` route (and `getDownloadUrl`) resolve **per object**: if a
  `MediaObject` row has `telegramFileId` → serve from Telegram; else fall back
  to the MinIO presigned URL (today's path). New uploads go to Telegram
  immediately once `STORAGE_BACKEND=telegram`; historical objects serve from
  MinIO until the backfill reaches them. **No broken images at any point.**
- Feature flag: `STORAGE_BACKEND` gates the **write** path; the **read** path is
  data-driven by the ledger, so read never depends on the flag alone.

**Cutover sequence:**
1. Ship schema (§4) + adapter (§2) + upload path (§5) + `/api/media` (§6) with `STORAGE_BACKEND=minio` still (Telegram code dormant, MinIO unchanged) → verify green.
2. Flip `STORAGE_BACKEND=telegram` in dev → new uploads land in Telegram, reads dual-serve. Exercise upload + view + ID print end-to-end (Playwright, all pages per fleet discipline).
3. Run the bulk backfill (§7) → all history now Telegram-backed.
4. **Owner-gated** promotion to staging/prod (HARD HOLD — no deploy without explicit owner word).
5. Only after prod is verified green AND DB backup taken: run guarded MinIO reclaim (§7) to free disk.

**Rollback:** if Telegram misbehaves, set `STORAGE_BACKEND=minio` — new uploads
resume to MinIO; all not-yet-reclaimed objects still serve from MinIO (ledger
fallback). Because reclaim is the LAST, separately-gated step, **MinIO remains a
complete fallback for the entire dual-read window.** Do not reclaim until you
would accept Telegram as sole store.

---

## 9. Risks & DR

**Top 3:**
1. **The `telegramFileId` ↔ record map in Postgres is the single point of
   failure.** Once MinIO is reclaimed, a lost/rolled-back DB = orphaned bytes in
   Telegram with no way to associate them to a fisherfolk. **MANDATE: verified DB
   backup + tested restore BEFORE any reclaim run** (Backrest/S3 offsite per
   Server-Setups; the `MediaObject` table must be in the backup set). Never
   reclaim without a fresh, restorable snapshot.
2. **Telegram ToS / ban / rate exposure.** A bot pushing ~6–7k documents to one
   channel could trip anti-abuse; a bot ban would make all bytes unfetchable
   while DB is intact. Mitigations: 1,200 ms throttle + bounded 429 retry
   (proven in MG); do the backfill as a slow overnight run; keep MinIO as
   fallback until confidence is high; consider the per-tenant override channel
   if volume grows. Recovery lever: if the source is still in MinIO (pre-reclaim)
   nothing is lost.
3. **Flood-wait / partial-batch stalls.** Handled by `retry_after`-honouring
   backoff + resumability (skip already-migrated), so an interrupted or
   throttled run resumes cleanly. Verify-before-mark prevents a throttled/failed
   upload from being recorded as done.

**Secondary:** `sendPhoto` recompression (avoided by using `sendDocument`);
Telegram `deleteMessage` 48 h limit (delete = soft-delete in ledger); 20 MB
getFile cap (all FRMS media under it).

**RA 10173 (PH Data Privacy Act) note — record in DECISIONS_LOG at build time:**
Storing citizen PII media (fisherfolk photos + signatures) on Telegram's
third-party infrastructure is a data-residency/processor exposure the owner has
**explicitly accepted as a temporary measure**, with the stated plan to migrate
to **AWS S3 when funded** (a pure `STORAGE_BACKEND=s3` config swap under this
same adapter). This is a gov/LGU app under Rule 33 / `privacy.md`; the acceptance
+ remediation timeline must be logged in the app's `DECISIONS_LOG` and surfaced
in `PRODUCT.md` §12 (Compliance). Not a code blocker; a documented risk
acceptance.

---

## 10. Phased, worker-executable task list

Each task is independently testable. Sonnet workers; PM verifies ground-truth.

| # | Phase | Task | Done/verify |
|---|---|---|---|
| **T1** | Schema | Add `Tenant.telegramChannelId` + `MediaObject` model (§4) + additive migration. | `prisma migrate` clean on a copy; table + column exist; no domain-field change. |
| **T2** | Lib | Copy MG `telegram-storage.ts` → `packages/storage/src/telegram.ts` (`uploadDocumentToTelegram`, `fetchTelegramFileBytes`, `getTelegramBotToken`, 429 backoff). Keep package prisma-free. | Unit test upload+fetch against a scratch channel (mock `fetch`); 20 MB + 429 paths covered. |
| **T3** | Adapter | Introduce `StorageAdapter` interface + `S3Adapter` (extract today's `upload.ts`) + `TelegramAdapter` + `resolveBackend()`/factory on `STORAGE_BACKEND`. `getDownloadUrl` returns proxied URL for telegram. | Backend-switch unit tests; S3 path byte-identical to today. |
| **T4** | Upload | Wire `upload.uploadFile` router: telegram branch → `sendDocument` (via `withRetry`) → write `MediaObject` → keep writing key to domain field → return proxied `downloadUrl`. | Upload a photo in dev with `STORAGE_BACKEND=telegram`; row created; file in channel; caption has tenantId. |
| **T5** | Retrieval | New `app/api/media/route.ts` (auth→rate-limit→tenant-scoped ledger→404 rules→`MEDIA_DOWNLOAD` AuditLog-before-fetch→`resolveMediaBytes`→serve `private,immutable`; 502 on failure). Copy MG `asset-bytes.ts` → `resolveMediaBytes`. Add `MEDIA_DOWNLOAD` audit action. | Port MG route tests: 401/429/404(missing)/404(no fileId)/200 headers/audit shape+ordering/tenant-scope/no-fileId-leak. |
| **T6** | Read wiring | Make `upload.getDownloadUrl` dual-read: telegram object → proxied URL; else MinIO presigned. Confirm every `<img src>` site + ID-card print render unchanged. | Playwright: fisherfolk detail photo+signature, vessel, violation, attachment-list, id-generator print — all render. |
| **T7** | Verify tool | `scripts/telegram-verify.mjs` (copy MG) to resolve numeric chat_id + post test doc; produce the values for Server-Setups. | Prints bot username + chat_id; test doc appears in channel. |
| **T8** | Migration | `scripts/migrate-media-to-telegram.ts`: enumerate all media entities, idempotent skip, throttle (1200 ms), `withRetry`, verify-before-mark, `--dry-run/--limit/--entity/--tenantId`, progress. | `--dry-run` prints exact counts; small `--limit 5` run migrates+verifies 5; re-run skips them. |
| **T9** | Cutover | Flip `STORAGE_BACKEND=telegram` (dev), run full backfill overnight, end-to-end exercise all media pages. | 0 broken images; all fisherfolk photos+signatures load via `/api/media`; ID print works. |
| **T10** | Reclaim | `scripts/reclaim-minio.ts`: re-verify-in-Telegram → `DeleteObject` → set `minioReclaimedAt`. Gated behind confirmed DB backup. `--dry-run/--limit`. | Dry-run lists reclaimable set; after real run, MinIO bucket size drops ~100 GB; every deleted object re-verified first. |
| **T11** | Docs/compliance | DECISIONS_LOG (RA 10173 acceptance + AWS-S3-when-funded), PRODUCT.md §12, CHANGELOG_AI, IMPLEMENTATION_MAP; env docs for the 2 new secrets. | Docs present; `check-env` passes. |

**Sequencing / parallelism:** T1→T2→T3 gate everything. T4 & T5 parallel after
T3. T6 after T5. T7 anytime (needs only the bot+channel). T8 after T4/T5. T9
after T6/T8. **T10 strictly last, after §9 DB backup.** T11 alongside.

**Secrets (Server-Setups SOPS, `LGUCalapan-Hostinger/secrets/`, e.g.
`frms-telegram.enc.yaml`):**
- `TELEGRAM_BOT_TOKEN` — BotFather token; bot must be **admin** of the storage channel.
- `TELEGRAM_DEFAULT_CHANNEL_ID` — numeric chat_id from T7 verify.
- (optional, later) `R2_CACHE_ENABLED` + R2 creds if a read-through cache is ever added.
- Point FRMS `CLAUDE.md` at this Server-Setups location; **do not copy secrets into the repo.**

---

## 11. FRMS-vs-MG deltas that needed a design decision (summary for the owner)

1. **Inline key vs ledger** — FRMS stores the key on `Fisherfolk.photo/signature` (2 fields/row) + other models, unlike MG's dedicated `event_assets`. **Decision: add a `MediaObject` ledger keyed by the existing storageKey** so no domain model / query changes. (§1.1, §4)
2. **Presigned URL vs proxy** — FRMS renders `<img src={presignedUrl}>`; Telegram has none. **Decision: `getDownloadUrl` returns a proxied `/api/media?key=…` URL for telegram objects** — client + tRPC contract unchanged. (§2, §6)
3. **`sendDocument` not `sendPhoto`** — fidelity for ID photos/signatures (Telegram recompresses photos). **Decision: sendDocument only.** (§5)
4. **Channel model** — single default + optional per-tenant override, vs MG's mandatory per-tenant (§3), because FRMS tenants are LGUs under one operator and DB tenant-scope already isolates.
5. **Scope beyond fisherfolk** — the same storage package backs vessel/violation/ayuda/kanban/id-template media; the migration must enumerate all of them, and branding assets (`logoUrl`/`mayorSignatureUrl`) need a keep-or-migrate call. (§7)
6. **Delete semantics** — Telegram can't reliably delete channel messages >48 h; `delete` becomes a soft-delete in the ledger. (§2)
```
