# Pending Owner Decisions — FRMS

> [WHAT] / product / business decisions awaiting owner (FMO/Bonito) sign-off.
> Per the autonomous-loop contract: these NEVER block un-gated work — record here,
> keep building, re-surface each session until answered. Back-port the answer to
> docs/PRODUCT.md + DECISIONS_LOG.md once decided.

---

## PD-001 — Fisherfolk ID number convention for NEW registrations
- **Opened:** 2026-06-25 (during data-management adoption from the production FMO reporting tool)
- **Context:** The live FMO Calapan tool's 3,003 records use the real LGU ID format
  **`MR-CL-NNNNNN-YYYY`**. FRMS Batch 2a currently generates **`FF-YYYY-NNNN`**.
- **Decision needed:** Should *new* FRMS registrations adopt the production `MR-CL-NNNNNN-YYYY`
  convention (LGU continuity / matches existing physical IDs and printed cards) or keep the
  current generated `FF-YYYY-NNNN`?
- **Not blocking:** Imported legacy records **preserve their source ID exactly** regardless of
  this decision (legacy ID preservation rule, PRODUCT.md → Data Management & Normalization
  Standards). Only the *generator* for brand-new registrations is in question.
- **Impact if changed:** `generateNextIdNumber` in `apps/web/src/server/trpc/routers/fisherfolk.ts`
  (Batch 2a) would need a new pattern; ID Template variables `{{registration_number}}` unaffected.
- **Recommendation (for owner):** Adopt `MR-CL-NNNNNN-YYYY` for LGU continuity unless FMO
  prefers a clean new sequence — confirm the segment meaning (MR=municipality? CL=Calapan?
  6-digit running number? trailing year = registration year vs issue year).
- **Status:** ✅ ANSWERED 2026-06-26 — "no ID format, just make it ready for mixed of any ID
  format." Resolution: idNumber is a freeform per-tenant-unique string accepting ANY format;
  no mandated pattern; manual entry on registration + optional generate-suggest; legacy IDs
  preserved. Locked in DECISIONS_LOG. Implementation tracked as its own batch.

---

## PD-002 — Edit Request Workflow: which Fisherfolk fields are editable via request? 🔴
- **Opened:** 2026-06-25 (Batch 3c scoping — Edit Request Workflow, PRODUCT.md flow #3)
- **Context:** Backend is already scaffolded — `EditRequest` Prisma model + `editRequest.ts` router
  (list/getById/create/approve/reject) exist and work. PRODUCT.md flow #3 says encoder "modify
  fields → submit as edit request" but does **not enumerate which Fisherfolk fields** an encoder
  may change via request.
- **Decision needed:** The editable-field whitelist for the encoder Edit form. Options: (a) all
  profile fields except system/ID/audit fields; (b) a restricted set (e.g. contact, address,
  category, civil status) with identity fields (name, DOB, sex, RSBSA/ID number) admin-direct-only;
  (c) a custom list FMO specifies.
- **Blocks:** the encoder-facing Edit form UI (cannot build a field-level diff/edit form without the
  whitelist). Does NOT block the admin-side review (the diff viewer is field-agnostic — renders
  whatever `fieldChanges` JSON contains).
- **Recommendation:** (b) — identity/ID fields admin-direct-only, everything else via request.
- **Status:** ✅ ANSWERED 2026-06-26 — "all fields, just add to the history whatever field has
  been changed." Resolution: whitelist = full `fisherfolkUpdateSchema` field set; fieldChanges
  records only changed keys (= the history). Locked in DECISIONS_LOG.

---

## PD-003 — Notification channel for Edit Request (and system notifications generally) 🟡
- **Opened:** 2026-06-25 (Batch 3c scoping)
- **Context:** PRODUCT.md flow #3 says "Admin receives notification" on submit and "Encoder notified"
  on approve/reject, but the **delivery channel is unspecified**.
- **Decision needed:** in-app notification center, email (SMTP — tenant SMTP settings exist), SMS, or
  a combination? This also sets the pattern for ALL future system notifications (renewals,
  violations, etc.).
- **Blocks:** wiring notification triggers in editRequest create/approve/reject. Does NOT block the
  approve/reject actions themselves (those already apply changes + audit).
- **Recommendation:** in-app notification center first (no external cost/dependency), email opt-in
  later via existing tenant SMTP.
- **Status:** ✅ ANSWERED 2026-06-26 — "in-app & email but SMS just prepare." Resolution: in-app
  + email ACTIVE (email via tenant SMTP); SMS = prepared interface/stub + config flag, inactive.
  Becomes the standard for all future system notifications. Locked in DECISIONS_LOG.

---

## PD-004 — Edit Request: approval-bypass scope + resubmit/history behavior 🟡🟢
- **Opened:** 2026-06-25 (Batch 3c scoping)
- **Context:** PRODUCT.md flow #3 says records "missing basic info (photo/signature) can be edited
  without approval to complete the record," and that on resubmit of a previously-rejected change the
  "system shows previous rejection history."
- **Decisions needed:** (1) Does the no-approval bypass cover ONLY photo/signature, or any
  currently-empty required field? (2) Resubmit model — create a NEW EditRequest each time (history =
  query prior rejected requests for that fisherfolk+fields), or append to an existing record?
- **Blocks:** exception-routing logic in create() + the rejection-history UI. Lower priority — core
  approve/reject flow works without these.
- **Recommendation:** (1) photo/signature + any empty required field; (2) new EditRequest per submit,
  history via query — simplest + fully auditable.
- **Status:** ✅ RESOLVED 2026-06-26 (owner delegated "how should I answer this?" → agent
  recommendation adopted as provisional default; owner may flip): (1) bypass = missing photo/signature
  + any currently-empty required field (changing populated fields always needs approval); (2) new
  EditRequest per submit, rejection history via query. Locked (provisional) in DECISIONS_LOG.

---

## PD-005 — RBAC: custom-role permission-matrix + role-builder UI scope 🟤
- **Opened:** 2026-07-10 (Full-Auto M3 RBAC 3-tier retrofit)
- **Context:** M3 lands the fleet 3-tier backbone (tenant_manager / tenant_superadmin / tenant_admin
  + domain roles). The fleet standard also defines a data-driven CUSTOM-role layer below tenant_admin:
  a `feature_registry`, a `role_permissions(tenant_id, role_id, feature_key, view, write, update, delete)`
  matrix, a `hasPermission()` resolver wired at tRPC + route middleware + sidebar, and a
  tenant_superadmin-only role-builder screen.
- **Decision needed:** Is the custom-role matrix + role-builder in scope for FRMS now, or deferred?
  It is a large, self-contained milestone; FRMS currently ships fixed domain roles that meet LGU needs.
- **Recommendation (agent [HOW] lean):** DEFER to a later milestone — ship the 3-tier backbone +
  two-way succession first (Chunks B/C), which is the auth-critical core. Build the matrix only if/when
  a tenant needs bespoke roles. No code until owner confirms scope.
- **Status:** ✅ **APPROVED by owner 2026-07-11** ("do all the deferred on next session reboot loop").
  BUILD the custom-role system: `feature_registry` + `role_permissions(tenant_id, role_id, feature_key,
  view, write, update, delete)` matrix + `hasPermission()` resolver wired at tRPC (`matrixProcedure`) +
  route middleware (deny-by-default) + sidebar nav filter + a `tenant_superadmin`-only role-builder
  screen (shadcn only, WCAG 2.2 AA gate). Guardrails: custom roles ≤ tenant_admin ceiling; NEVER grant
  Billing/User-Management; only tenant_superadmin/tenant_manager may create/edit/assign. plan-first-dispatch,
  TDD, LOCAL commits only (its own remote push rides PD-006). Large — expect multiple reboot chunks.

## PD-006 — Remote push / staging / prod promotion for the RBAC + v0.9.0 work 🟤
- **Opened:** 2026-07-10
- **Context:** All 2026-07-10/11 work (v0.9.0 versioning, RBAC 3-tier A–D, data import, M4 merge) is
  LOCAL commits on main under HARD HOLD — local main is 56+ ahead of origin/main. RBAC enum migration +
  PII data import both touch auth/PII.
- **Status:** ✅ **APPROVED by owner 2026-07-11** ("do all the deferred"). Execute AFTER all local work
  (PRODUCT.md back-ports + vault reseed + PD-005 matrix) is committed to main, so the pushed build is
  complete. SEQUENCE (deploy-discipline + staging data-first gate — never skip, never deploy red):
  1. Push local `main` → `origin/main` (triggers staging auto-deploy, "Model A").
  2. **Staging data-first gate** (`deploy/staging-refresh-and-deploy.sh` if present, else
     `~/.claude/rules/staging-refresh-gate.md`): refresh staging DB from a PROD copy FIRST → pull
     candidate image → `prisma migrate deploy` (the RBAC partial-unique + rename migrations rehearse on
     prod-shaped data) → bring up → health-verify GREEN.
  3. Only on staging GREEN → **manual prod promotion** (re-tag verified build → prod channel → deploy →
     verify prod domain). Back up prod DB first. NEVER auto.
  4. Demo (`*-demo`) is separate — push only if owner asks; migrate-but-never-reseed.
  ⚠ Prod is the highest-risk, outward-facing step — if staging is NOT green, HALT and re-surface, do not
  force prod. Tag the release `v0.9.0` → `v0.9.0-rc.1` on staging, drop suffix on prod promotion.
- **✅ RESOLVED / EXECUTED 2026-07-12 (Full Auto).** Owner confirmed prod target via AskUserQuestion:
  **host = Powerbyte-Hostinger → `frms.powerbyte.app`** (+ `frms-storage.powerbyte.app`); **data = real
  official masterlist**. First-time prod standup completed end-to-end:
  1. Image `bonitobonita24/frms:latest` + `:prod-sha-6b0fd31` promoted from verified `staging-latest`.
  2. Prod secrets `frms-prod-app.enc.env` minted (SOPS+age) → Server-Setups `ca8ef8f`. Ports DB5438/
     REDIS6385/MinIO9014-15.
  3. Cloudflare DNS: `frms.powerbyte.app` (proxied) + `frms-storage.powerbyte.app` (DNS-only) → 72.62.74.203.
  4. VPS stack `/etc/komodo/stacks/frms-prod` (proj `frms_prod`) — postgres/valkey/minio + `frms-prod`
     bucket (download policy). 16 migrations applied; 3 canonical `staging_prod` accounts seeded.
  5. **Real masterlist seeded: 3,016 official fisherfolk** (seed-remote.sh prod, rc=0, 0 skipped).
  6. App `prod-sha-6b0fd31` deployed. **`/api/health` 200; superadmin login QA PASS; dashboard renders
     3,016 records + full RBAC nav + footer v0.9.0.** Data-first gate N/A (no prior prod to refresh from).
  - Deferred (optional, NON-blocking): real photos/signatures upload (3,016 missing — text-only import
    by design); CSP whitelist for Cloudflare Insights beacon (benign console error). Prod = the v0.9.0 line.

## PD-007 — Telegram photo backfill: full upload + PROD cutover ✅ RESOLVED 2026-07-16 (was OWNER-GATED prod data op)
- **Opened:** 2026-07-14 (Telegram-storage migration Path A).
- **Context:** M1 (ledger schema), M2 (`/api/media` serve + upload plumbing), and M3 (backfill tool) are DONE +
  verified + committed LOCAL (main 4 ahead of origin, HARD HOLD). Dry-run proved demo MinIO→Telegram byte-identical
  on real data. Prod currently has 3,016 fisherfolk with NO photos (text-only seed); the ~5,988 real photo/sig/vessel
  objects live in demo MinIO. Getting them into prod (Telegram-backed) is a PRODUCTION DATA IMPORT + a prod code deploy.
- **Decision needed (explicit owner "push to production"):** authorize the full prod cutover — because it (a) pushes
  M2/M1 code to prod via the deploy pipeline, and (b) uploads ~5,988 real fisherfolk PII photos to Telegram permanently
  (RA 10173 — owner-accepted temp measure until AWS-S3-when-funded), and (c) writes to the prod DB (Fisherfolk.photo +
  MediaObject rows).
- **Sequence when authorized:** push→staging data-first gate→prod deploy · add TELEGRAM_BOT_TOKEN+CHANNEL_ID to prod
  SOPS env · check prod DB role RLS attrs (append `?options=-c row_security=off` if non-BYPASSRLS) · Phase A full upload
  (~100+ min) · back up prod DB · Phase B `apply-prod --confirm` (match by id_number/mfvrNumber) · verify `/api/media`
  renders prod photos. Then M5 (MinIO reclaim + docs).
- **Status:** ✅ RESOLVED 2026-07-16 — owner authorized the prod cutover; executed end-to-end.
- **Resolution / evidence:**
  - Code deploy + `TELEGRAM_BOT_TOKEN`+`CHANNEL_ID` in prod SOPS env + `/api/media` read path: DONE & verified live (prior session, 2026-07-14).
  - **Phase A upload:** 5,988/5,988 objects in Telegram (bot @frms_assets_bot, channel `-1004351286489`), manifest `.backfill/manifest.json`.
  - **Phase B `apply-prod --confirm`** (2026-07-16, tenant `calapan-city` `cmrgkv64y0000gmr71qraaj7i`): **matched=5,970 · updated=5,970 · skippedAlreadySet=0 · skippedUnmatched=18** (the 18 = demo-only `DEMO-QA-*` fisherfolk + `DEMO-MFVR-*` vessels absent from the real masterlist — expected). Operation is null-only fill (never overwrites) → purely additive, no prod-data-loss risk.
  - **Prod DB verified:** 2,979 fisherfolk photos + 2,991 signatures set = 5,970 fields; `media_objects` = 5,970 rows all `backend=telegram` (fully reconciles). 37 real fisherfolk remain photo-null (no source asset existed — nothing to link).
- **Prod storage — CONFIRMED fully Telegram (2026-07-16):** `frms-prod` runs `STORAGE_BACKEND=telegram` (stack `.env` + app runtime), bot + channel `-1004351286489` wired, and prod MinIO `/data` holds **0 object files** (120K, `.minio.sys` only) — prod never stored a photo in MinIO. Nothing to reclaim; prod is 100% Telegram-backed.
- **M5 demo-MinIO reclaim — CLOSED (won't do), owner decision 2026-07-16:** owner accepts the demo stack keeping its ~188 MB on MinIO (fixed demo dataset, won't grow over time; a demo account). Demo is NOT cut over to Telegram and its MinIO objects are NOT deleted. Only PRODUCTION is required to be Telegram-backed (satisfied above).
