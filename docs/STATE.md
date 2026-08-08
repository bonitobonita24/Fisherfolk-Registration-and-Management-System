# FRMS — Project State

## Current State (2026-08-08 PM) — 🔐 Auth.js security bump DONE (LOCAL, branch, HARD HOLD)

[FOCUS: Fisherfolk-Registration-and-Management-System]

Owner-approved security task executed ("start planning then swarm"). Branch `fix/authjs-security-bump`
@ `5a1937a` (+ this governance commit), built in an isolated worktree so the running `frms_dev_app` (:44387)
was untouched.

**✅ DONE THIS SESSION:**
- `next-auth` → **5.0.0-beta.32**, `@auth/core` → **0.41.3**, `@auth/prisma-adapter` → **2.11.3**,
  `brace-expansion` override → **>=5.0.9**. Cleared 2 CRITICAL + 1 HIGH Auth.js advisories + brace-expansion ReDoS.
- **Zero source changes** (no auth-surface type breaks). Gates green: tsc · lint · 386 tests · build (41 routes).
- Independent re-audit confirmed old versions gone + brace-expansion out of graph.

**⏳ OPEN / owner-gated (next):**
- **Merge `fix/authjs-security-bump` → main + dev rebuild** — HARD HOLD; the dev rebuild is where the live
  3-tier login click-through (Rule 16) happens. Owner word required (push to main auto-triggers Model-A CI).
- **[WHAT] out-of-scope highs** — Next.js SSRF/DoS ×3 (`next@15.5.19`) + sharp/dompurify/undici. Bigger blast
  radius; separate owner decision on whether to do a Next.js bump.
- (still open from AM) main is 2 docs-commits ahead of origin (HARD HOLD); `frms_staging` torn down.

---

## Current State (2026-08-08 AM) — 🚀 AdminCN adoption SHIPPED TO PRODUCTION (frms.powerbyte.app)

[FOCUS: Fisherfolk-Registration-and-Management-System]

Owner authorized "push deploy it" → promoted to PROD. **Live and verified.**

**✅ SHIPPED THIS SESSION:**
- **Pushed `main` → origin** (`44b078c`) after full pre-ship gate (lint · typecheck · 386 tests · prod build all green). CI `docker-publish.yml` built + pushed the multi-arch image (`sha-44b078c`, 25m).
- **Promoted image → PRODUCTION** via `deploy/compose/push-to-prod.sh sha-44b078c`: prod DB backed up
  (`/root/frms-prod-backup-pre-pushtoprod-20260808-080127.sql.gz`, rollback point), image `sha-44b078c` →
  `latest`, prod app recreated, **"No pending migrations to apply"** (UI+middleware only, schema-clean),
  NO reseed. Prod running `frms:latest` revision `44b078c5d539` — the exact built commit.
- **Verified prod:** `/api/health` = 200, `/login` = 200, container Up (healthy), clean Next.js boot.
- **Dev rebuilt** off main (Rule 39) — `frms_dev_app` FRESH @ 14:05, health 200.
- **Staging finding:** the `frms_staging` stack is torn down (0 containers on VPS) — a future standup, not
  a blocker. `docker-publish.yml` is build-only (no auto staging deploy, by design since 2026-07-11).

**⚠ Note on CI:** `ci.yml` fails only on `pnpm audit --audit-level=high` (does NOT gate deploy). Real
finding: 2 CRITICAL Auth.js advisories on `next-auth@beta.31` (fail-open + homoglyph bypass) + HIGH
brace-expansion ReDoS → **queued as a next-session task** in PENDING_DECISIONS (owner-approved).

**⏳ OPEN / owner-gated:**
- **Rebuild `frms_staging` stack** if staging validation is wanted again (currently torn down).
- **Auth.js beta.32+ security bump** — queued next session (`20366cd`).
- **Non-blocking (2026-07-09):** M1–M4 PRODUCT.md back-ports + Fish Catch follow-ups.
- **Local `main` ~1 ahead of origin** (`20366cd` docs, unpushed) — HARD HOLD, harmless.

**Git state:** local `main` @ `20366cd` (origin/main @ `44b078c`, deployed to prod). Prod live. No staging.

---

## Current State (2026-08-08) — ✅ AdminCN adoption CONSOLIDATED onto local main (Phases A/D-1/D-2/E complete)

[FOCUS: Fisherfolk-Registration-and-Management-System]

Owner present, resumed session, chose **"Consolidate onto main (local only)"**. The completed AdminCN
adoption stack is now merged into local `main` — **no push, HARD HOLD intact.**

**✅ DONE THIS SESSION:**
- **Merged the AdminCN stack into local `main`** (`--no-ff`, merge commit `73fbf94`), preserving the phase
  history: `8cdd5da` framework sync V32.28→V32.45 · `7449fc6` adoption plan + D1–D4 · `c12db6a` Phase A
  (7 UI primitives) · `c363899` Phase D-1 (dashboard animated StatCard) · `e5e304c` Phase D-2 (RBAC surface
  reskin, styling-only). Merge also unites main's `isPublicPath` boundary-match hardening (`45df969`) — no
  file overlap, conflict-free.
- **Verified merged main:** `tsc --noEmit` on `apps/web` → exit 0. (D-2 already runtime-verified live with
  owner: roles/permission surfaces correct, 0 console errors, 13 tests green.)
- **Branch cleanup:** deleted the 3 merged AdminCN phase branches (`feat/admincn-phase-a-primitives`,
  `-d1-dashboard`, `-d2-rbac`). Left `chore/framework-sync-v32-45` — it holds 2 now-stale docs-only
  checkpoint commits (`d466a54`/`d8f4542`) not worth merging or force-deleting.

**⏳ PENDING / OPEN `[WHAT]` (all owner-gated, HARD HOLD):**
- **Push local `main`** — now ~13 commits ahead of origin (AdminCN stack + earlier import/hardening work).
  Pushing auto-fires a Model-A staging deploy; staging is deliberately offline. Awaits explicit owner word.
- **Deploy items (unchanged):** promote `/api/media` fix + San Rafael→Salong to staging/prod on refresh.
- **Non-blocking (2026-07-09):** M1–M4 PRODUCT.md back-ports + Fish Catch follow-ups.

**Git/HARD HOLD state:** on `main` @ `73fbf94`, ~13 ahead of origin/main, **unpushed**. HARD HOLD intact —
no push/deploy without explicit owner word. No staging/prod touched.

**NEXT un-gated work:** none — remaining items all need an owner `[WHAT]` (push/deploy) or are non-blocking
product back-ports.

---

## Current State (2026-08-07 late) — ✅ Framework synced V32.28→V32.45 + AdminCN adoption PLAN produced (full-auto)

[FOCUS: Fisherfolk-Registration-and-Management-System]

Owner directive (full-auto, owner asleep, full authority granted): plan AdminCN full-site adoption. Completed
BOTH un-gated milestones; the build itself is owner-gated on D1–D4 (planning-only per directive).

**✅ DONE THIS SESSION:**
- **Framework sync V32.28 → V32.45** (governance-only, zero app source) via `prep-sync` →
  `sync-to-project.sh` → `deploy.sh`. Branch `chore/framework-sync-v32-45` @ `8cdd5da` (LOCAL). Landed
  `admincn-starter.md` (#39), `starter/admincn/` (222-file slice, +root `starter/admincn/`), Scenario 49,
  +8 other new deliverables; root CLAUDE.md → V32.45.1 (AIEF:MANAGED state block preserved, no PRIMER
  regression). `.bak` backups cleaned.
- **Stale/contaminated `chore/framework-sync-v32-31` branch force-deleted** (owner-authorized, HARDHOLD-OK) —
  it was off pre-Aug main and would have reverted the masterlist import work.
- **AdminCN adoption plan** → `docs/ADMINCN_ADOPTION_PLAN.md` @ `7449fc6` (LOCAL). Gap-diff shows FRMS is
  LOW-DELTA: token reskin already in main (`globals.css` 2026-07-04), shell already AdminCN-shaped → mostly
  additive component + selective view-graft, effort S–M. Includes INHERIT-not-REPLACE contract, fake-db→tRPC
  graft, 5 phases, Scenario-49 gate bar.

**⏳ PENDING / OPEN `[WHAT]` (cold-start reads these first — all in PENDING_DECISIONS.md):**
- **AdminCN build is GATED on 4 owner decisions D1–D4** (app-shell keep-vs-migrate · theme fixed-vs-customizer ·
  view-adoption scope · ordering). My recommendations are in the plan §3. NO build starts until answered.
- **Owner-gated deploy items (HARD HOLD, unchanged):** merge `feat/masterlist-batch-import` +
  `fix/api-media-middleware-bypass` to main (together); promote `/api/media` fix to staging+prod; San
  Rafael→Salong merge to staging+prod; push local `main` (1 commit ahead) + `docs/session-save-import-reconcile`.
- **Non-blocking (2026-07-09):** M1–M4 PRODUCT.md back-ports + Fish Catch follow-ups.

**Git/HARD HOLD state:** on `chore/framework-sync-v32-45` @ `7449fc6` (2 commits: sync + plan, LOCAL/unpushed).
`main` still 1 ahead of origin (handoff doc, unpushed). Many parked feature branches. **HARD HOLD intact — no
push/deploy/merge-to-main without explicit owner word.** No staging/prod touched.

**NEXT un-gated work:** none that doesn't require an owner `[WHAT]` — the AdminCN build waits on D1–D4, all
deploy/merge items are owner-gated. Loop should `--hold` and re-surface D1–D4 until the owner answers.

---

## Current State (2026-08-07) — ✅ Import-reconcile follow-ups cleared + CI restored + v0.10.1 shipped

All 5 carried-over 2026-08-06 follow-ups resolved this session (see `.sessions/slot-23/next-session` +
memory `project_followups_done_0807`):
- **CI docker-publish FIXED** — pinned `pnpm@10.0.0` in `apps/web/Dockerfile` (both stages). Released
  **v0.10.1** (patch), pushed origin/main `1a0c301`. **docker-publish run 31172106097 = SUCCESS** — auto-deploy
  restored (manual docker save/load no longer needed).
- **Staging stack** taken down (owner-decided), volumes preserved.
- **VILLANUEVA dup** deleted on DEV + PROD (prod → 3089; 0 relations; prod backed up); staging inherits via
  refresh-deploy.
- **Fuzzy near-name pairs** reviewed (`docs/DEDUP_REVIEW_2026-08-07.md`) — 0 real dups, all differ by DOB.
- **`for_importation/` (436MB PII)** deleted.

**Open (owner-gated):** merge `docs/session-save-import-reconcile` → main (docs; a push); M1–M4 PRODUCT.md
back-ports; 2 tiny optional items. **HARD HOLD** intact — no further push without owner word.

evidence:
  contract: "v0.10.1 CI fix acceptance: docker-publish workflow builds+publishes green (it failed on the pnpm --frozen-lockfile step for weeks), and the VILLANUEVA duplicate is gone from prod."
  check_command: "gh run view 31172106097 --json conclusion  # + prod fisherfolk count"
  captured_output: "CI run 31172106097 conclusion=success (prev v0.10.0 run failed at 35s on pnpm install). Prod fisherfolk count = 3089 (was 3090); only id_number 2024-175205000-07796 remains for VILLANUEVA, M-JAY ALEJO."

---

## Prior State (2026-07-12) — 🚀 PRODUCTION LIVE + GREEN (PD-006 fully executed, Full Auto)

- **PROD STOOD UP & VERIFIED** → https://frms.powerbyte.app (owner-approved target: Powerbyte-Hostinger,
  real official masterlist). `/api/health` **200**; **superadmin login QA PASS**; dashboard renders
  **3,016 official fisherfolk** + demographics/analytics + full RBAC nav (Role Builder) + footer `v0.9.0`.
  - Image `bonitobonita24/frms:latest` = `:prod-sha-6b0fd31` (promoted from verified `staging-latest`).
  - Stack `/etc/komodo/stacks/frms-prod` (proj `frms_prod`) — postgres/valkey/minio, ports DB **5438** /
    Redis **6385** / MinIO **9014-15**; bucket `frms-prod` (download). 16 migrations applied.
  - Secrets `Server-Setups/secrets/frms-prod-app.enc.env` (SOPS+age, `ca8ef8f`). DNS `frms`(proxied)+
    `frms-storage`(DNS-only) → 72.62.74.203. 3 canonical `staging_prod` accounts + real masterlist seeded.
  - Vault: dev/staging/prod/demo all on the canonical universal-login scheme → **vault reseed satisfied**.
  - Deferred (optional, non-blocking): real photos/signatures upload (3,016 missing — text-only by design);
    CSP whitelist for Cloudflare Insights beacon; PRODUCT.md back-ports (Rule 1 — human-only).
- Open items now = **owner-only** PRODUCT.md back-ports + product-grain preference flips. See PD-006 (resolved).

---

## Prior State (2026-07-11) — STAGING STOOD UP + GREEN · PD-006 origin push

- **Origin push COMPLETE**: local main (65 commits) + tag `v0.9.0` → `origin/main` (`eeb9577`), then
  deploy commit `bada32f`. **0 ahead of origin.** CI green; image `bonitobonita24/frms:staging-latest`
  (multi-arch) on Docker Hub.
- **STAGING LIVE + VERIFIED GREEN** → https://frms-staging.powerbyte.app
  - `/api/health` 200 · `/login` 200 · **3-tier login QA ALL PASS** (tenant_superadmin / tenant_manager /
    tenant_admin, correct session roles).
  - Stack `/etc/komodo/stacks/frms-staging` (proj `frms_staging`) on Powerbyte-Hostinger (72.62.74.203).
    Ports DB 5437 / Redis 6384 / MinIO 9012-13. DNS `frms-staging`(+`-storage`) → VPS.
  - SOPS `Server-Setups/secrets/frms-staging-app.enc.env`; 5 migrations applied (incl RBAC 3-tier);
    3 canonical `staging_prod` accounts seeded from vault; **no real PII** (Rule 33). Turnstile test keys.
  - `deploy/staging-refresh-and-deploy.sh` added (data-first gate, first-run guard until `frms_prod` exists).
- **Vault reseed = VERIFY-ONLY** (owner choice) — keys confirmed present, no live cred rotated.
- **PROD (FMO) untouched** — manual promotion only; no `frms_prod` stack yet.
- Open items = deferred owner `[WHAT]`s only (PRODUCT.md back-ports M1–M5 + Cand N, Report-Hub grain
  flips, optional follow-ups, prod promotion, vault reseed to deployed apps). See PENDING_DECISIONS.md +
  memory `project_staging_standup_0711`. Tests 893/893 green, tsc+lint clean.

---

## Current State (2026-07-09) — overnight feature batch (Full Auto)

Branch `feat/household-management` (UNPUSHED, HARD HOLD) now also carries the 2026-07-09 batch:
- **M0** — full verification sweep GREEN + 2 UI fixes (`21db3e3`).
- **M1 — Ayuda beneficiary mass-selection multi-filter COMPLETE + verified** (`3dca6f6`→`62f3e32`, 6
  commits + spec + plan). 7-facet mix-and-match bulk enrollment, add-all/add-selected/bulk-remove,
  distributionUnit-aware. Browser-QA'd on rebuilt dev :44387 with DB-cross-checked counts (Lazareto=372,
  vessel-owner=61 matched exactly); axe WCAG 2.2 AA = 0 violations; 282 tests + build green. Back-port
  drafted as candidate M. See CHANGELOG_AI 2026-07-09 M1 entry.
- **NEXT (queued, reboot per milestone):** M2 Fish Catch activity (BFAR spec ready at
  `docs/superpowers/specs/2026-07-09-fish-catch-research.md`), M3 fish-catch charts, M4 universal Report
  hub, M5 showcase updates.

## Prior State (2026-07-08)

Branch `feat/household-management` — **ToDo (Kanban + Calendar) feature COMPLETE, 7 commits shipped**:
schema (`cbe79ed`), router+assignable-users (`471002a`), helpers (`deb061e`), Kanban→ToDo rename+routing
(`e2e07b2`), Calendar month-grid view (`c5fe255`), reusable `<MakeTodoDialog>`/`<LinkedTodos>`
(`07302a4`), detail-page wiring on Fisherfolk/Vessel/Violation/Ayuda (`11914e2`). typecheck ✅ lint ✅
build ✅; kanbanTask (5) + todo-source (12) tests pass. Spec:
`docs/superpowers/specs/2026-07-08-todo-kanban-calendar-design.md`, plan:
`docs/superpowers/plans/2026-07-08-todo-kanban-calendar.md`. **Not yet done**: full-app Playwright
browser QA sweep of the `/todo` Kanban/Calendar surfaces; branch not yet merged to `main` (owner-gated
per HARD HOLD); `docs/PRODUCT.md` back-port drafted in `docs/BACKPORT_CANDIDATES.md` (candidate L)
awaiting owner application (Rule 1).

### Completed this session (ToDo Kanban+Calendar governance docs, 2026-07-08)

- **`docs/CHANGELOG_AI.md`** (updated) — appended a consolidated entry summarizing all 7 ToDo feature
  commits, attributed CLAUDE_CODE.
- **`docs/DECISIONS_LOG.md`** (updated) — appended `ToDo (Kanban + Calendar) — [HOW] locked
  implementation decisions` section (DB model unchanged on rename, kept MoveMenu, hand-built calendar,
  lowercase sourceEntityType enum + in-tenant validation, assignee defaults to current user,
  /kanban→/todo redirect).
- **`docs/BACKPORT_CANDIDATES.md`** (updated) — appended candidate L (ToDo Kanban+Calendar, DRAFT,
  awaiting owner application) proposing new PRODUCT.md content under an Operations/Task-Management
  section (or extending the existing Kanban entity description).
- **`docs/STATE.md`** (this file) — current-state block updated to reflect the ToDo feature complete
  on feat/household-management.

---

## Prior State (2026-07-08, superseded above)

Branch `feat/household-management` — **Household Management feature COMPLETE, all 9 tasks shipped**:
schema (`4b0995e`), router (`6e1da3a`), nav+list (`e83493d`), create wizard (`de6a42a`), detail/edit
(`fd572d0`), membership badge (`1a3eb7a`), ayuda per-household (`5132016`), dashboard+reports counts
(`2e2eadd`), demo seed (`3d1897a`). typecheck ✅ lint ✅ build ✅; household + ayuda tests pass (12)
against dev DB; demo seed verified idempotent on dev. Spec: `docs/superpowers/specs/2026-07-08-household-management-design.md`,
plan: `docs/superpowers/` (9-task plan, referenced in memory `project_household_build_0708`).
**Not yet done**: full-app Playwright browser QA sweep of the new `/households` surfaces; branch not
yet merged to `main` (owner-gated per HARD HOLD); `docs/PRODUCT.md` back-port drafted in
`docs/BACKPORT_CANDIDATES.md` (candidate K) awaiting owner application (Rule 1).

### Completed this session (Household Management governance docs, 2026-07-08)

- **`docs/CHANGELOG_AI.md`** (updated) — appended a single consolidated entry summarizing all 9
  Household Management tasks with commit SHAs, attributed CLAUDE_CODE.
- **`docs/DECISIONS_LOG.md`** (updated) — appended `Household Management — [HOW] locked implementation
  decisions` section (category-for-counts = head's, head-is-member invariant, HH-#### numbering,
  ayuda distributionUnit set at creation only, no backfill, delete unlinks members).
- **`docs/BACKPORT_CANDIDATES.md`** (updated) — appended candidate K (Household Management, DRAFT,
  awaiting owner application) proposing new PRODUCT.md content under Fisherfolk Registration /
  Ayuda Programs / Data Entities.
- **`docs/STATE.md`** (this file) — current-state block updated to reflect feat/household-management
  branch + all 9 tasks complete.

---

## Prior State (2026-07-05, superseded above)

Branch `swarm/dashboard-redesign` is the active feature branch for the SET-2 Dashboard Redesign wave.
SD ✅ complete. **S1 ✅ complete** (schema index). **S2 ✅ complete** (registration lifecycle backend). **S3 ✅ complete** (top-section UI). **S4 ✅ complete** (group tiles). **S5 ✅ complete** (lower charts → 3 grouped Card tiles; typecheck ✅ lint ✅ build ✅). **S6 ✅ complete** (QA/WCAG gate). PRODUCT.md untouched. AdminCN Reskin wave (swarm/admincn-reskin) is fully remediated and dev-verified; merge is owner-gated.

### Completed this session (S5 — Lower charts → 3 grouped Card tiles, 2026-07-05)

- **`apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx`** (updated) — lower charts region (rows 3-5) refactored from 5 separate Card components in 3 row-divs into EXACTLY 3 grouped Card tiles:
  - **Tile A (Barangay Distribution)**: Distribution by Barangay bar chart + status breakdown pill row (ACTIVE/NEW/RENEWED counts from already-loaded `stats`; semantic `<ul>`/`<li>` markup; `aria-label`; shimmer on load OR error).
  - **Tile B (Demographics)**: Gender Distribution donut + Age Group Distribution bar, side-by-side (`md:grid-cols-2`), sub-labeled.
  - **Tile C (Activity Categories)**: Activity Category horizontal bar + Activity Category by Barangay bar, side-by-side; `bgyFilter` Select preserved inside Tile C (reverted to `h-7 w-[160px]` for touch-target compliance); `aria-labelledby="cat-by-bgy-heading"` added to ChartContainer.
- All 5 existing charts present; all tRPC queries preserved; all `hsl(var(--chart-n))` colors unchanged.
- `isError: statsError` destructured from `getStats.useQuery` — pills row shows shimmer on error instead of disappearing silently.
- **Code-review gate**: ran (2 finder angles × 5 candidates; 4 CONFIRMED in-scope); fixed all 4: (1) `role="group"` → `<ul>`/`<li>` semantic list (WCAG 4.1.2); (2) error state for pills — shimmer on `statsError`; (3) `aria-labelledby` on cat-by-bgy ChartContainer (WCAG 1.3.1); (4) SelectTrigger h-6/w-140 → h-7/w-160 (WCAG 2.5.8 touch target). 1 deferred out-of-scope: `activeFisherfolk` year-scope mismatch (backend S2 concern, not layout).
- **Validation**: typecheck ✅, lint ✅, build ✅.

### Completed this session (S4 — Group tiles, 2026-07-05)

- **`apps/web/src/app/[tenant]/dashboard/registration-type-select.tsx`** (NEW) — shadcn Select with ALL|NEW|RENEWED options; `aria-label="Filter by registration type"` on trigger; type-safe discriminated guard on `onValueChange` callback.
- **`apps/web/src/app/[tenant]/dashboard/fisherfolk-group-tile.tsx`** (NEW) — headline = ACTIVE+NEW+RENEWED (D1); NEW·RENEWED fraction from `getStats`; "vs last year" slot renders placeholder text only (NEVER fabricated %; guarded behind `!statsLoading`); internal BarChart of `getFisherfolkCategoryBreakdown` driven by `registrationType`+`year`; all chart colors via `hsl(var(--chart-n))`.
- **`apps/web/src/app/[tenant]/dashboard/vessel-group-tile.tsx`** (NEW) — headline = sum of `getVesselCategoryBreakdown` counts; BarChart of vessel types with per-Cell `hsl(var(--chart-n))` colors; no year filter / no NEW·RENEWED fraction (D3: Vessel lacks `registrationYear`).
- **`apps/web/src/app/[tenant]/dashboard/violations-group-tile.tsx`** (NEW) — headline = `stats.activeViolations`; no chart (per scope).
- **`apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx`** (updated) — added `registrationType` state (default "ALL"); mounts RegistrationTypeSelect + FisherfolkGroupTile + VesselGroupTile + ViolationsGroupTile in right column where S3 left `{/* S4: group tiles mount here */}`.
- **Code-review gate**: ran (2 finder angles × 6 candidates; 1 verifier pass); 6 candidates: 5 refuted (statuses mutually exclusive so no double-count; D1/D3 spec decisions; vesselChartConfig follows existing categoryConfig pattern; inline Shimmer not a twin-file violation); 1 confirmed and fixed (placeholder text unconditionally rendered during loading → wrapped in `!statsLoading` guard).
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `0040c43` on `swarm/dashboard-redesign`.

### Completed this session (S2 — Backend tRPC: registration lifecycle, 2026-07-05)

- **`apps/web/src/server/lib/registration-lifecycle.ts`** (NEW) — `resetAnnualRegistrations(db, tenantId, currentRegistrationYear)`: idempotent `updateMany` bulk-resets ACTIVE/RENEWED fisherfolk from prior years to INACTIVE. Callable from tRPC mutations and future crons.
- **`apps/web/src/server/lib/__tests__/registration-lifecycle.test.ts`** (NEW) — 3 DB-gated integration tests: deactivates old ACTIVE, idempotent (second call → count 0), skips current-year records.
- **`apps/web/src/server/trpc/routers/fisherfolk.ts`** (updated) — INACTIVE guard added to `renew` mutation: throws `PRECONDITION_FAILED` unless `existing.status === "INACTIVE"`, placed after NOT_FOUND check and before active-violation check.
- **`apps/web/src/server/trpc/routers/__tests__/fisherfolk.test.ts`** (updated) — TDD: 2 new tests ("blocks renew when not INACTIVE", "allows renew when INACTIVE") added before existing tests; 3 existing renew tests updated to pass `{ status: "INACTIVE" }`.
- **`apps/web/src/server/trpc/routers/dashboard.ts`** (updated) — `getStats`: optional `year` param (defaults to `tenant.currentRegistrationYear`), adds `newFisherfolk`/`renewedFisherfolk` counts, drops `totalUsers`/`pendingEditRequests`. Added `resetAnnualRegistrations` (adminProcedure), `getFisherfolkCategoryBreakdown` (protectedProcedure, registrationType ALL|NEW|RENEWED + optional year), `getVesselCategoryBreakdown` (protectedProcedure, groupBy vesselType).
- **`apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx`** (updated) — 2-line patch: KPI tiles updated to `newFisherfolk` / `renewedFisherfolk` from new `getStats` shape.
- **Code-review gate** (medium, 3 CONFIRMED findings fixed): (1) `getFisherfolkCategoryBreakdown` ALL branch `{}` status filter → fixed to `{ status: { in: ["NEW","RENEWED","ACTIVE"] } }` to exclude INACTIVE/ARCHIVED; (2) dead `year` input param on `getVesselCategoryBreakdown` → removed (Vessel has no `registrationYear` per D3); (3) latency finding (sequential tenant lookup before Promise.all) — noted, non-blocking, deferred.
- **Validation**: typecheck ✅, lint ✅, tests 178 passed / 62 skipped (DB-integration tests skip without DATABASE_URL).
- Dispatch ratio: sonnet_writes/opus_writes = S2 executed (Sonnet workers + Opus PM review).

### Completed this session (SD — Dashboard Redesign governance docs, 2026-07-05)

- **`docs/DECISIONS_LOG.md`** (updated) — appended `SET-2 Dashboard Redesign — [HOW] locked implementation decisions` section with sub-decisions (a) sequential wave S1→S6, (b) additive schema index only, (c) annual-reset via registration-lifecycle.ts helper + renew INACTIVE guard, (d) getStats shape change (add new/renewed, drop totalUsers/pendingEditRequests), (e) new category-breakdown procedures + optional year param, (f) "vs last year" placeholder (no fabricated %), (g) WCAG 2.2 AA hard gate on all new surfaces. PRODUCT.md untouched (Rule 1).
- **`docs/CHANGELOG_AI.md`** (updated) — appended SD wave summary entry with S1–S6 session descriptions.
- **`docs/STATE.md`** (this file) — current-state block updated to reflect swarm/dashboard-redesign branch + SD complete.
- Commit on `swarm/dashboard-redesign`.

### S5 QA Gate Results (2026-07-04) — findings below all REMEDIATED in this commit

Validation gates: typecheck ✅ lint ✅ build ✅. WCAG axe: ❌ FAIL (gov hard gate not met).

**Axe violations (WCAG 2.2 AA — gov hard gate):**
- `button-name` (critical, 6 nodes): density map Switch toggles missing `aria-label` in `barangay-density-map.tsx` lines 486–536. Pre-existing (commit d580650). Fix: add `aria-label` to each `<Switch>`.
- `color-contrast` (serious, 2 nodes):
  - Active nav link (`.bg-accent`): #fafafa on #009488 teal = 3.59:1 (need 4.5:1). Introduced by S1+S2. Fix: darken `--accent` lightness or use `--accent-foreground` with higher-contrast token.
  - `<kbd>⌘K</kbd>` in header with `opacity-60`: #6d6d6d on #1f1f1f = 3.18:1 (need 4.5:1). Introduced by S3. Fix: remove `opacity-60` or use explicit higher-contrast color.

**Code review defects (medium effort, 2 agents):**
- `app-shell.tsx`: `onToggleSidebar` prop never passed to `<Header>` — desktop sidebar toggle button is never rendered (CONFIRMED). Known deferral from S3; needs fix in a follow-up session.
- `dashboard-client.tsx`: `activeSpark` renders an empty 0% progress bar when `stats=undefined` (error/loading state), inconsistent with `totalSpark` which is `undefined` in same state. Fix: guard `activeSpark` same as `totalSpark`.
- `globals.css`: `--chart-3` dark mode = `196 72% 23%` → #104e65, contrast 1.97:1 vs dark card background. Near-invisible in dark mode. Fix: increase lightness to ~45%.

**Playwright walkthrough (dark mode, 1512px, encoder role):**
- Dark mode: ✅ (`class="dark"`, `color-scheme: dark`)
- 6-across KPI strip at xl viewport: ✅ (all 6 KPIs in one row with real data)
- Sidebar AdminCN grouped nav (OVERVIEW/RECORDS/OPERATIONS): ✅
- RBAC filtering (no ADMINISTRATION for encoder): ✅
- Header: toggle button ✅, search ⌘K ✅, notifications ✅, theme toggle ✅, avatar QE ✅
- Theme toggle dark↔light: ✅ (verified round-trip)
- Settings + Sign out in avatar dropdown: ✅
- Density map: ✅ (heatmap + toggles rendered)
- Console errors from app origin: ✅ 0 errors (warnings only — CSS/map)
- KPIs with real data: ✅ (3,007 total, 3,006 active, 80 vessels, 8 violations, 3 users, 0 pending)
- Screenshots: `test-artifacts/s5-dashboard-dark-before.png`, `test-artifacts/s5-dashboard-xl-dark.png`, `test-artifacts/s5-dashboard-dark-after.png`

### Completed this session (S4 — Dense dashboard analytics layout)

- **`apps/web/src/app/[tenant]/dashboard/kpi-card.tsx`** (NEW) — local compact KPI card:
  - `text-[10px]` uppercase label, `text-2xl font-bold` value, `size-4` lucide icon.
  - Optional `sparkline` slot rendered below value; suppressed when `loading === true`.
  - Inline shimmer (`animate-pulse rounded bg-muted`) — no Skeleton component needed.
- **`apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx`** (updated) — AdminCN dense layout:
  - 6-across KPI strip: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3` using local `KpiCard`.
  - `totalSpark`: mini CSS bar chart of top-5 barangay counts (h-8, aria-hidden); guarded against empty/zero data.
  - `activeSpark`: progress bar at `activeRatio`% clamped to 100%; shown only when data loaded.
  - Density map + Registration Status in 3-col grid (`lg:col-span-2` + 1/3 col).
  - Chart heights reduced: `h-[320px]` → `h-[220px]`, `h-[300px]` → `h-[200px]`.
  - Card padding: `CardHeader p-3 pb-2`, `CardContent p-3 pt-0`; gaps `gap-6` → `gap-3`; root `space-y-8` → `space-y-4`.
  - All real tRPC queries preserved; `hsl(var(--chart-n))` colors maintained throughout.
  - `StatCard` kept for "Data Completeness" clickable links (Missing Photo/Signature).
- **`apps/web/src/app/[tenant]/dashboard/page.tsx`** (updated): `text-2xl` → `text-lg font-semibold`; `space-y-6` → `space-y-4`.
- **Code-review gate**: ran (medium effort, 2 angles × 6 candidates); 3 in-scope bugs fixed:
  (1) `activeSpark` rendered during loading state → suppressed sparklines in `KpiCard` when `loading === true`;
  (2) `activeRatio` unclamped → `Math.min(100, ...)` applied;
  (3) zero-count totalSpark guard → added `.some(d => d.count > 0)` check.
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `5cb0db9` on `swarm/admincn-reskin`.

### Completed this session (S3 — Header/topbar reskin)

- **`apps/web/src/components/header.tsx`** (updated) — AdminCN topbar:
  - Added `onToggleSidebar?: () => void` to HeaderProps (S2 app-shell's `toggleSidebar`; optional — no break to existing callers).
  - Mobile `md:hidden` Menu button (calls `onMenuClick` → Sheet drawer) always rendered at all times.
  - Desktop `hidden md:flex` PanelLeft button (calls `onToggleSidebar`) conditionally shown when prop provided.
  - Search: `<button>` styled as ⌘K search bar — replaced `<Input type="search" readOnly>` to avoid WCAG 4.1.2 screen-reader forms-mode bug.
  - Right section: NotificationBell → ThemeToggle → avatar dropdown; `gap-1` tight spacing; `ml-auto` pushes to edge.
  - All preserved: signOut, Settings link, name/role display, initials logic, ThemeToggle functional.
  - h-14 height, `px-3` tight padding, `bg-card` surface — AdminCN style maintained.
  - ⚠ **Pending wire-up**: `app-shell.tsx` still omits `onToggleSidebar={toggleSidebar}` (the function exists in S2 app-shell but is not yet passed to Header — out of S3 scope per hard rules). Next session touching app-shell should add `onToggleSidebar={toggleSidebar}` to the `<Header>` call.
- **Code-review gate**: ran medium effort (2 angles × 6 candidates); 2 in-scope bugs fixed: (1) mobile drawer trigger lost when `onToggleSidebar` truthy → fixed by always rendering mobile Menu button separately; (2) `readOnly` Input WCAG 4.1.2 violation → replaced with `<button>`. 1 deferred (app-shell wiring, out of scope).
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `33a40a1` on `swarm/admincn-reskin`.

### Completed this session (S2 — Sidebar + app-shell reskin)

- **`apps/web/src/components/sidebar.tsx`** (updated) — AdminCN grouped nav:
  - Brand block (h-14): icon-only when collapsed (no overflow), icon+text+collapse button when expanded.
  - Grouped sections: UPPERCASE 10px muted labels (Overview/Records/Operations/Administration) preserved verbatim with all items + RBAC filter (`item.roles.includes(role)`) unchanged.
  - Active-item style: `bg-accent text-accent-foreground` + 4px left primary indicator bar.
  - Density: `py-1.5` nav items (from `py-2`), `space-y-0.5` gaps, group padding reduced.
  - Desktop collapse: `isCollapsed` prop — icon-rail mode (icon-only nav items + Tooltip for labels), dividers between groups, expand button in footer slot.
  - WCAG: `aria-expanded` on toggle/expand buttons, `aria-label` on icon-only links and collapsed logo link, tooltips via shadcn TooltipProvider.
  - New props: `isCollapsed?: boolean` (default false), `onToggle?: () => void`.
  - Bug fix from code-review: toggle button moved out of collapsed header (overflow fix); aria-expanded added.
- **`apps/web/src/components/app-shell.tsx`** (updated) — app shell:
  - Desktop sidebar: `w-56` expanded (from `w-60`), `w-14` collapsed; `sidebarCollapsed` state + `toggleSidebar` function.
  - Passes `isCollapsed` + `onToggle` to desktop Sidebar.
  - Mobile Sheet: `w-56` (matched to expanded desktop width; was `w-60`); no collapse props (correct).
  - Main padding: `p-3 md:p-4` (from `p-4 md:p-6`).
  - Note: `onToggleSidebar` prop for Header deferred to S3 (S3 adds the prop to HeaderProps + adds header toggle button).
- **Code-review gate**: ran (medium effort, 8 angles); 3 in-scope bugs fixed: collapsed header overflow (restructured), aria-expanded on toggle/expand buttons, mobile Sheet width inconsistency (w-60→w-56). Deferred: pathname.startsWith prefix-collision (pre-existing, not this session's bug); re-render on collapse (out of scope, children optimization); no CSS width transition (not required by spec).
- **Validation**: typecheck ✅, lint ✅, build ✅.

### Completed this session (S1 — AdminCN theme tokens)

- **`apps/web/src/app/globals.css`** (updated) — AdminCN palette applied:
  - `.dark`: pure-neutral surfaces (bg 0 0% 4%, card/popover 0 0% 9%), teal accent (175 100% 29%), orange ring/chart-1 (20 100% 47%), teal chart-2 (175 100% 29%), neutral secondary/muted (0 0% 15%), --primary orange preserved.
  - `:root` (light): white background, near-black foreground, same teal accent + chart set, neutral borders.
  - Tailwind HSL-triplet contract maintained; --radius (0.625rem) preserved; no hex values.
- **Code-review gate**: ran (low effort); verdict = clean, 0 findings.
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `7652d61` on `swarm/admincn-reskin`.

### Completed this session (SD — AdminCN Reskin governance docs)

- **`docs/DECISIONS_LOG.md`** (updated) — appended `2026-07-04 AdminCN Reskin wave` section with
  sub-decisions (a) app shell + theme reskin to AdminCN pattern (dark default kept, neutral-dark
  surfaces, teal/orange accent via --accent + --chart-1..5, orange --primary preserved), (b) density
  pass (6-across KPI strip, tighter padding/gaps, reduced chart heights), (c) implementation split
  (S1–S5 + SD). PRODUCT.md untouched (Rule 1).
- **`docs/CHANGELOG_AI.md`** (updated) — appended SD wave summary entry.
- **`docs/STATE.md`** (this file) — current-state block updated.
- Commit on `swarm/admincn-reskin`.

### Completed previous session (S7 — Page assembly, RBAC tab gating)

- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (updated) — RBAC tab gating:
  - Admins/super_admins (`canManage=true`): `defaultValue="editor"`, Template Editor tab visible.
  - Encoders (`canManage=false`): `defaultValue="select"`, Template Editor tab + TabsContent hidden entirely.
  - `TabsList` gains `aria-label="ID Generator sections"` for WCAG keyboard nav.
  - `page.tsx` unchanged (already computes `canManage` from `session?.user?.role`); nav-items.ts unchanged (roles already correct).
  - ID-released state confirmed wired in `SelectAndPrint` (S5 work, unchanged).
- **Code-review gate**: ran (2 finder angles); both returned `[]` — clean.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `47d391b` on `swarm/id-generator`.

### Completed this session (S6 — PVC Sheet Layout + print rendering)

- **`apps/web/src/app/[tenant]/id-generator/_components/pvc-sheet.tsx`** (new) — `<PvcSheet>` component: 200×300mm PVC sheet, 4 FRONT+BACK pairs; back face mirrored via `scaleX(-1)` for film back-printing; dashed-border placeholders for empty slots; `@page { size: 200mm 300mm; margin: 0 }` print CSS with visibility isolation (`body * hidden` + `#pvc-sheet-root * visible`) + `position: fixed` sheet; Print button calls `window.confirm` → `idPrint.recordPrint` → `toast.success` → `window.print()`; `PRINT_SCALE = 96/25.4` px/mm; sheet geometry: SHEET_PAD_V_MM=26mm, SHEET_PAD_H_MM=12mm, ROW_GAP_MM=8mm; uses `trpc.idTemplate.getById` + `trpc.idPrint.getSubjectPrintData` for template + resolved data; `[data-print-hide]` hides screen controls on print; WCAG: `role="region"`, aria-labelled pairs, `aria-hidden` on decorative elements.
- **`apps/web/src/server/trpc/routers/idPrint.ts`** (updated) — new `getSubjectPrintData` procedure (encoderProcedure): resolves all template variable keys for FISHERFOLK (photo/signature/qrCode/categories with single-round-trip batch category fetch) and VESSEL (vesselPhoto/qrCode/dimensions). Fix: deleted category IDs silently omitted from `{{categories}}` field instead of printing raw CUID strings.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-card-renderer.tsx`** (updated) — fixed `photo`/`signature`/`qr` element types to render actual `<Image>` from `data` prop in print mode (previously showed gray placeholders); image-kind `variable` elements now also render as `<Image>` in print mode via `data[variableKey]`.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (updated) — replaced S5 placeholder with `<PvcSheet selection={printSelection} onBack={() => setPrintSelection(null)} />`.
- **Code-review gate**: ran (2 finder agents × 8 angles); 1 in-scope finding fixed: deleted category CUID fallback (`.map(id => categoryNameById.get(id) ?? id)` → filter-and-omit). Verified refuted: Prisma select syntax (actual code uses `field: true`); negative padding (26mm positive); window.confirm WCAG (spec-required). Plausible/deferred: Ctrl+P blank-print bypass; window.print() catch message; hardcoded photo/sig/qr vs variable branch.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `49140a3` on `swarm/id-generator`.

### Completed this session (S5 — Select & Print subject list + validation gate + ID-released state)

- **`apps/web/src/app/[tenant]/id-generator/_components/select-and-print.tsx`** (new) — `<SelectAndPrint>` component: Tabs (FISHERFOLK | VESSEL-coming-soon); FISHERFOLK tab has template picker (ACTIVE templates from `idTemplate.list`); multi-select table driven by `idPrint.listEligible` showing name, photo thumbnail (or "Missing" text), signature present/missing, ID-Released badge (text: Released / Not Released), NEW/RENEWED registration badge, and READY/INCOMPLETE print-status with explicit "Missing photo/signature" text; disabled checkboxes with aria-label for blocked rows; "Select all ready" bulk action; running subject + sheet count (uses `ID_CARD_GEOMETRY.maxPairsPerSheet`); "Proceed to Layout" calls `onProceedToLayout(PrintSelection)`. VESSEL tab shows "coming soon" Card. `useEffect` resets `selectedIds` on `templateId` change to prevent stale ghost selections. WCAG: `<table>` with `<caption>` + `scope="col"`, aria-labeled checkboxes, all status badges carry text.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (new) — `<IdGeneratorClient>` client wrapper: Tabs (Template Editor | Select & Print); `forceMount` + `data-[state=inactive]:hidden` on both `TabsContent` to preserve selection state across tab switches; `printSelection` state holds `PrintSelection | null` for S6 PvcSheetLayout to consume; S6 placeholder card with shadcn Button (variant=link) for "← Back to selection".
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** (updated) — renders `<IdGeneratorClient canManage={canManage} />` instead of `<TemplateEditor>` directly; description updated.
- **Exported types for S6**: `PrintSubject` and `PrintSelection` from `select-and-print.tsx`.
- **Code-review gate**: ran (3 agents × 8 angles); 4 in-scope findings fixed: stale `selectedIds` on template change (useEffect); `sheetsNeeded` hardcoded `4` → `ID_CARD_GEOMETRY.maxPairsPerSheet`; raw `<button>` → shadcn `Button variant=link`; JSX block comment removed. Deferred: `registrationType` UPDATE case (no data signal in `listEligible`; bucket-A follow-up); StatusBadge reuse (cosmetic divergence).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `030429f` on `swarm/id-generator`.

### Completed this session (S4b — ElementInspector + TemplateForm save/load + TemplateManager)

- **`apps/web/src/app/[tenant]/id-generator/_components/element-inspector.tsx`** (new) — `<ElementInspector>` side panel; edits selected element props live: xMm/yMm/widthMm/heightMm (mm number inputs, step 0.1), zIndex, delete-element; text elements get content input; text/variable elements get fontFamily, fontSizePt, fontWeight (Select 400/500/600/700), color (native color picker + hex text with `#RRGGBB` validation), align (3-button group with `aria-pressed`); icon elements get emoji input. All inputs WCAG-labelled (Label+htmlFor). NaN inputs silently retained (no silent clamp-to-default).
- **`apps/web/src/app/[tenant]/id-generator/_components/template-form.tsx`** (new) — `<TemplateForm>` header row: name Input + templateType Select (FISHERFOLK|VESSEL) + status Select (ACTIVE|ARCHIVED) + Save/Update Button (disabled on empty name or while saving); all fields WCAG-labelled.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-manager.tsx`** (new) — `<TemplateManager>` Table of all tenant templates (name/type/status/updated); Edit (calls `onEditTemplate` → loads into editor), Duplicate (`idTemplate.duplicate`), Archive (`idTemplate.update` status→ARCHIVED, ACTIVE-only), Delete (confirmation Dialog + `idTemplate.delete`); admin-gated via `canManage` prop (server-auth value from page.tsx, following violations/ayuda pattern); all action buttons aria-labelled.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-editor.tsx`** (updated) — integrated all three new components; added `formValues` state + `templateId`; wired `trpc.idTemplate.create/update/duplicate` mutations with toast + list invalidation; `loadTemplate(id)` uses `utils.idTemplate.getById.fetch()` to imperatively load+hydrate canvas state; `duplicate` button in canvas header (admin-gated); **code-review bug fixes**: `updateSelectedElement` and `deleteSelectedElement` now read `activeSide`/`selectedElementId` from inside the setState updater (prevents stale-closure wrong-side/wrong-element write).
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** (updated) — now `async`; calls `auth()`, computes `canManage = role === "super_admin" || role === "admin"` with safe optional chain (`session?.user?.role`); passes `canManage` to `<TemplateEditor>`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** (fixed) — geometry test corrected to match current schema (86×54mm cut, 88×56mm bleed) after prior commits 12dbdd1/51d0b88 reverted the S4a geometry override without updating the test.
- **Code-review gate**: ran (3 angles × parallel agents); 3 in-scope findings fixed: stale-closure in `updateSelectedElement`/`deleteSelectedElement` (both `activeSide` and `selectedElementId` now read from setState updater `s`, not render closure); `session?.user.role` → `session?.user?.role`; `fontSizePt` NaN guard changed from silent-clamp-to-8 to no-op (preserves existing value). Deferred out-of-scope: `loadTemplate` unchecked IdElement[] cast from DB JSON (application-layer Zod parse would surface schema drift; mitigated by server-side schema validation on save); `duplicate.isPending` shared across all rows (UX-only, acceptable).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.

### Completed this session (S4a — Editor canvas + IdCardRenderer + palette + background upload)

- **`packages/shared/src/schemas/id-template.ts`** — `ID_CARD_GEOMETRY` corrected to 87×56mm content / 91×60mm bleed (owner override from S1 86×54mm; comment + DECISIONS_LOG entry added).
- **`apps/web/package.json`** — added `@dnd-kit/core@6.3.1`, `@dnd-kit/modifiers@9.0.0`, `@dnd-kit/utilities@3.2.2`, `@radix-ui/react-tabs`.
- **`apps/web/src/components/ui/tabs.tsx`** — shadcn Tabs component installed.
- **`apps/web/src/server/trpc/routers/upload.ts`** — added `"id-template-bg"` entity type (5 MB cap) to `ENTITY_TYPES` and `MAX_BYTES_BY_ENTITY`.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-card-renderer.tsx`** (new) — reusable presentational `<IdCardRenderer>` component; dnd-kit-free; `renderElement` render-prop pattern for editor injection; `mode='edit'` variables as labelled placeholders; `mode='print'` variables resolved from `data`; exports `elementPositionStyle` + `pxFromMm` + `ElementVisual` for reuse.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-canvas.tsx`** (new) — `<TemplateCanvas>` wraps IdCardRenderer(mode=edit) in a dnd-kit `DndContext`; each element is a `useDraggable` with `restrictToParentElement` + 0.5mm `createSnapModifier` (both memoised); epsilon drag-delta guard (sub-pixel residual protection); `KeyboardSensor` with arrow-key nudge (WCAG 2.2 keyboard drag); `useReducedMotion()` WCAG 2.2 SC 2.3.3.
- **`apps/web/src/app/[tenant]/id-generator/_components/element-palette.tsx`** (new) — `<ElementPalette>` showing static elements (Text, Photo, Signature, QR) + all `TEMPLATE_VARIABLES` grouped by FISHERFOLK/VESSEL/SHARED; click adds to active side; `uid()` with secure-context fallback for non-HTTPS dev envs.
- **`apps/web/src/app/[tenant]/id-generator/_components/background-upload.tsx`** (new) — `<BackgroundUpload>` per side; reuses `trpc.upload.uploadFile` with `entityType="id-template-bg"`; thumbnail preview + remove.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-editor.tsx`** (new) — `<TemplateEditor>` orchestrator; side-keyed EditorState (front/back `SideState`); side-specific `useCallback` handlers eliminating stale-closure wrong-side-write bug; shadcn Tabs front/back toggle; selected element info panel; state only (no persistence — S4b saves).
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** — updated to mount `<TemplateEditor />`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** — geometry assertions updated to 87/56.
- **`docs/DECISIONS_LOG.md`** — appended decision (g): geometry correction 87×56mm owner override.
- **Code-review gate**: ran (3 angles × parallel agents); in-scope findings fixed: epsilon delta guard (sub-pixel float residual), snapModifier useMemo (mid-drag re-registration), wrong-side-write closure bug (side-specific useCallback), uid() secure-context fallback; deferred: style render-prop argument discarded (cosmetic, out-of-scope).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `9995e5d` on `swarm/id-generator`.

### Completed this session (S3 — IDPrintBatch model + idPrint router)

- **`packages/db/prisma/schema.prisma`** — added `IDPrintBatch` model (id, tenantId, templateId, templateType, printedById, printedAt, idCount, summaryJson, createdAt); added `PRINT` to `AuditAction` enum; added inverse relations on Tenant, User, IDTemplate.
- **`packages/db/prisma/migrations/20260701120000_add_id_print_batch/migration.sql`** — CREATE-ONLY additive migration: `ALTER TYPE "AuditAction" ADD VALUE 'PRINT'` + `CREATE TABLE "id_print_batches"` + 3 FK constraints + 2 indexes.
- **`packages/shared/src/types/enums.ts`** — added `PRINT` to `AuditAction` const object.
- **`packages/shared/src/schemas/id-print.ts`** (new) — `idPrintValidateSchema`, `idPrintRecordSchema`, `idPrintSubjectSchema` Zod schemas + TypeScript types.
- **`apps/web/src/server/trpc/routers/idPrint.ts`** (new) — 4 procedures:
  - `listEligible` (encoderProcedure): tenant-scoped fisherfolk/vessel list with `ready` boolean.
  - `validateSelection` (encoderProcedure): per-ID photo/signature check; not-found IDs treated as blocked.
  - `recordPrint` (encoderProcedure): subject-type/template-type mismatch guard → template tenant+type check → server-side re-validation (including not-found detection) → `$transaction(IDPrintBatch.create + AuditLog(PRINT))`; returns `{id, idCount}` minimal surface.
  - `todaysPrinted` (encoderProcedure): PHT midnight boundary (not server UTC); viewer FORBIDDEN.
- **`apps/web/src/server/trpc/root.ts`** — registered `idPrint: idPrintRouter`.
- **`apps/web/src/server/trpc/routers/__tests__/idPrint.test.ts`** (new) — 13 DB-integration tests (skip in CI): validateSelection flags missing photo/sig/not-found/cross-tenant; recordPrint writes batch+audit, blocks on missing media + not-found + mismatch, viewer FORBIDDEN; todaysPrinted tenant-scoped + PHT start-of-day + rolled-up counts.
- **Code-review gate**: ran (4 angles × parallel agents); 7 in-scope findings fixed: RBAC (todaysPrinted→encoderProcedure), re-validation not-found detection, subjectType/templateType mismatch bypass, raw IDs in error message, narrowed return surface, templateType cross-check on template lookup, PHT timezone.
- **Validation**: typecheck ✅ (0 errors), lint ✅, test ✅ (178 pass / 50 skip-DB, 13 new tests).

### Completed this session (S2 — ID Generator router hardening)

- **`apps/web/src/server/trpc/routers/idTemplate.ts`** — hardened with L5 AuditLog writes and `duplicate` mutation:
  - `create`: writes `auditLog(CREATE, after=created)` after the DB insert.
  - `update`: reads `existing` for before-snapshot; writes `auditLog(UPDATE, before, after)`.
  - `archive`: reads `existing`; writes `auditLog(UPDATE, before, after)` (AuditAction has no ARCHIVE; UPDATE is the correct action per fisherfolk.ts convention).
  - `delete`: deletes first, then writes `auditLog(DELETE, before=existing)` — order fixed to avoid phantom audit entries on delete failure.
  - `duplicate` (new): tenant-scoped load → create copy with `name "<source> (copy)"`, `status: ARCHIVED` (IDTemplateStatus only has ACTIVE|ARCHIVED; ARCHIVED avoids getActive collisions); writes `auditLog(CREATE, after=copy)`.
  - All mutations retain the `if (!ctx.tenantId) FORBIDDEN` guard.
- **`packages/shared/src/schemas/id-template.ts`** — added `idTemplateDuplicateSchema = z.object({ id: z.string().cuid() })`.
- **`apps/web/src/server/trpc/routers/__tests__/idTemplate.test.ts`** (new) — 16 DB-integration tests (skip when no DATABASE_URL): create/update/archive/delete each write the correct AuditLog; duplicate produces ARCHIVED copy that does not collide with `getActive`; cross-tenant `getById`/`update`/`duplicate` all return NOT_FOUND; non-admin (encoder/viewer) FORBIDDEN on all mutations.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 37 skip-DB), 16 new tests correctly skipped in CI.
- **Code-review gate**: ran (3 angles × parallel agents); 1 in-scope finding fixed (delete mutation order: audit-before-delete → delete-first-then-audit to avoid phantom audit entries); 2 out-of-scope deferred findings (non-atomic audit tradeoff + TOCTOU before-snapshot — both are fleet-wide patterns matching fisherfolk.ts).

### Completed this session (S1 — ID Generator shared schemas)

- **`packages/shared/src/schemas/id-template.ts`** — fully rewritten (26→145 lines):
  - `idElementSchema`: Zod discriminated union on `type` field with 7 members (`text`, `variable`, `image`, `icon`, `photo`, `signature`, `qr`). Common base: `id`, `xMm`, `yMm`, `widthMm`, `heightMm`, `rotation` (default 0), `zIndex`. Text/variable members add typography mixin (`fontFamily`, `fontSizePt`, `fontWeight` 400|500|600|700, `color` hex-6 regex, `align` left|center|right). Variable adds `variableKey` from catalog enum. Image adds `url`. Icon adds optional `emoji`/`url`.
  - `ID_CARD_GEOMETRY` typed const: content 86×54mm, bleed 90×58mm, bleed margin 2mm, sheet 200×300mm, 4 pairs/sheet.
  - `TEMPLATE_VARIABLES` catalog: 15 FISHERFOLK vars + 11 VESSEL vars + 3 SHARED vars; each entry `{key, label, group, kind}`.
  - `templateVariableKeySchema` Zod enum derived from catalog.
  - `idTemplateCreateSchema` / `idTemplateUpdateSchema` — `frontElements`/`backElements` upgraded from `z.array(z.record(z.string(), z.unknown()))` to `z.array(idElementSchema)`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** — 19 Vitest unit tests covering: all 7 element types pass; default rotation; rejection of unknown type / missing mm fields / bad hex / unknown variableKey / non-URL; geometry constant correctness; bleed = content + 2×margin; variable catalog completeness and all keys pass templateVariableKeySchema.
- **Validation**: typecheck ✅ (0 errors), test ✅ (178 pass / 21 DB-skip, 19 new), lint ✅, db:generate ✅ unaffected.
- **Code-review gate**: ran; 1 in-scope finding (icon validation gap — `.refine()` inside discriminatedUnion returns ZodEffects, Zod v3 requires ZodObject members) documented in code comment; deferred to application layer in S2+. 3 out-of-scope deferred items logged.

### Completed this session (SD — ID Generator docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 ID Generator entry with 6 locked sub-decisions (a–f): (a) typed discriminated-union element schema (text/variable/image/icon/qr/photo/signature, mm-based, 86×54mm/90×58mm); (b) Template Editor adminProcedure + dnd-kit DOM/CSS-mm NOT canvas; Select & Print = encoder+admin; (c) DOM+@media print, 200×300mm PVC sheet, back mirrored scaleX(-1), empty dashed placeholders; (d) Select & Print checkout blocks missing photo OR signature; (e) IDPrintBatch entity per print run; (f) printing decoupled from 'ID Released' (markIdReleased stays separate Wave 1 action). Two open [WHAT] questions flagged for owner (vessel IDs scope, Daily-Ops widget timing).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added Batch 4 — ID Generator / ID Card Printing section (schema/entities, template editor, select & print, open [WHAT] questions); updated DECISIONS_LOG.md count 16→17.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S0)

- **Prisma schema** — `RegistrationRenewal` model added; `Fisherfolk` extended with `idReleasedAt`/`idReleasedById`/`idReleasedBy`/`renewals`; inverse relations wired on `User` and `Tenant`.
- **Migration** — `20260701000000_registration_renewal_and_id_released` (additive: CREATE TABLE + 2 ADD COLUMN).
- **Prisma client** regenerated (v6.19.3).
- **Typecheck** passes (0 errors).

### Completed this session (SD — docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 entry with 5 locked sub-decisions (a–e): ID-release manual staff action, NEW/RENEWED badge derivation from `_count.renewals`, renew mutation rules (encoder role + active-violation block + AuditAction.RENEW), new entities (RegistrationRenewal + Fisherfolk.idReleasedAt/idReleasedById), activity timeline sanitization policy (action/actor/timestamp only, no diffs, protectedProcedure).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added NEW/RENEWED badge row to Batch 1b list table; added 4 pending (⏳ S1+) rows to Batch 3 profile table for renew mutation, markIdReleased mutation, renewal timeline panel, and right-side activity timeline.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S1 — tRPC backend wave)

- **Shared Zod schemas** — `fisherfolkRenewSchema`, `fisherfolkMarkReleasedSchema`, `fisherfolkActivityQuerySchema` added to `@frms/shared`.
- **`fisherfolk.renew`** (encoderProcedure) — active-violation PRECONDITION_FAILED guard; duplicate-year CONFLICT guard (inside `$transaction`); creates `RegistrationRenewal` + flips `status→RENEWED` + `auditLog(RENEW)` all atomic in one transaction.
- **`fisherfolk.markIdReleased`** (encoderProcedure) — idempotent (early-return if already set); `$transaction` wraps `fisherfolk.update` + `auditLog(UPDATE)`.
- **`fisherfolk.getActivity`** (protectedProcedure) — tenant+entity scoped; sanitized output `{id, action, actorName, createdAt}` — no before/after diffs.
- **`list` select** extended: `+idReleasedAt`, `+_count.renewals` for badge derivation.
- **`getById` include** extended: `+renewals` (take:20, desc) with `renewedBy{name,email}`.
- **Tests** — 5 DB-integration tests in `src/server/trpc/routers/__tests__/fisherfolk.test.ts` (skip in CI; run locally with DATABASE_URL).
- Commit `a9f48c5` on `swarm/registration-status-timeline`.

### Completed this session (S2 — list badge columns)

- **`FisherfolkListItem` interface** extended with `idReleasedAt: string | null` and `renewalCount: number`.
- **Registration-Type column** added to fisherfolk list: derives NEW (renewalCount===0) or RENEWED (renewalCount>0); renders `<StatusBadge>` with explicit color override (green/orange) — does NOT fall through to `statusColorMap`.
- **ID-Release column** added: idReleasedAt null → gray "Not Released" badge; non-null → green "Released" badge with tooltip showing the formatted release date.
- **`fisherfolk-list-client.tsx`** updated to explicitly map tRPC items to `FisherfolkListItem`, converting `idReleasedAt` (Date|null via superjson → ISO string|null) and `_count.renewals` → `renewalCount`.
- lint/build/typecheck all green; code-review gate ran (1 in-scope finding fixed: `String()` → direct pass-through for non-Date idReleasedAt values).
- Commit on `swarm/registration-status-timeline`.

### Completed this session (S3 — profile UI wave)

- **Two-column shell** — `grid gap-6 lg:grid-cols-[1fr_320px]` wrapping LEFT main column (Profile + Renewal History + related records) and RIGHT `<aside aria-label="Activity timeline">` placeholder Card (S4 will render the feed).
- **Registration status line** in header: 0 renewals → NEW (green badge) + "New registration"; ≥1 → RENEWED (orange badge) + "Last renewed [date]"; always shows original `dateJoined`.
- **Renewal History Card** (left column): lists `record.renewals` (year · renewedAt · who · notes); empty state "No renewals yet."
- **ID-Release line** inside Profile Card fields: Released (date + who) or "ID not yet released" from `record.idReleasedAt` / `record.idReleasedBy`.
- **Action buttons** (encoder/admin/super_admin only via `trpc.user.me`): Renew Registration (disabled+tooltip when active violation; uses shared `ConfirmDialog`; on success invalidates `getById`; toast on success/error; dialog stays open on error via re-throw); Mark ID Released (hidden once `idReleasedAt` set; uses `ConfirmDialog`).
- **`getById` router** extended: added `idReleasedBy: { select: { name, email } }` to support "Released by [name]" display.
- **Code review fixes**: used shared `ConfirmDialog` instead of inline Dialog (removes redundant open/loading state); added visible placeholder Card to `<aside>` to prevent empty landmark WCAG issue; dialog stays open on mutation error (re-throw pattern).
- lint/typecheck/build all green.

### Completed this session (S4 — activity timeline aside)

- **`fisherfolk-activity-timeline.tsx`** (new client subcomponent under `[id]/`) — queries `fisherfolk.getActivity`; renders semantic `<ol>/<li>` feed (newest-first); each entry: WHO (actorName), WHAT (label + aria-hidden icon), WHEN (`<time dateTime>`); `lg:sticky lg:top-4`; loading skeleton (WCAG: `role="status"` + sr-only text + `aria-hidden` ol); empty state; `motion-reduce:animate-none` on pulse animations.
- **`fisherfolk-detail-client.tsx`** — aside placeholder replaced with `<FisherfolkActivityTimeline id={id} />`.
- lint/build both green.

### Completed this session (S5 — QA / validation gate)

- **typecheck** ✅ (0 errors), **lint** ✅ (0 warnings), **test** ✅ (159 pass / 21 skip-DB), **build** ✅
- **db:generate** ✅ (Prisma v6.19.3); **S0 migration** confirmed additive-only (ADD COLUMN + CREATE TABLE, no DROP/ALTER)
- **WCAG 2.2 AA** — code-level audit green: list badge columns (text-not-color-only, StatusBadge renders label text); profile registration-status badge + accompanying text + `<ul aria-label="Renewal history"><li>` + RBAC-gated action buttons with aria-labels + disabled tooltip `tabIndex+aria-label`; activity timeline `<ol aria-label="…"><li>` + `<time dateTime>` + `aria-hidden` icons + `role="status"` skeleton + `motion-reduce:animate-none`; `<aside aria-label="Activity timeline">`.
- **RBAC** — `renew` and `markIdReleased` are `encoderProcedure` (FORBIDDEN for viewer/bantay_dagat); `renew` writes RegistrationRenewal + flips status→RENEWED + AuditAction.RENEW atomically; `markIdReleased` idempotent; `getActivity` tenant-scoped, sanitized output (no before/after).
- **Code-review fixes applied** (2 in-scope findings):
  1. `fisherfolk-detail-client.tsx` — added `utils.fisherfolk.getActivity.invalidate({ id })` to `handleRenew` and `handleMarkReleased` (stale timeline fix)
  2. `fisherfolk.ts:574` — `log.user?.name ?? log.user?.email ?? null` defensive null-guard
- **Playwright smoke** — 17/17 checks pass (port 44387): list New/Renewed + Released/Not-Released badges ✅; profile status badge + Renewal History card + Activity Timeline aside ✅; Renew flips badge→RENEWED + renewal-history row inline ✅; timeline RENEW entry visible after reload ✅ (inline reactivity gap confirmed — addressed by S5 code-review fix). ⚠ Migration drift: dev DB frozen at June 29 migration; smoke agent applied S0 migration manually — `prisma migrate deploy` MUST run on any QA env before testing.

### Open / pending

- `formatAbsolute`/`formatDate` shared utility extraction (multi-file duplication) — deferred refactor (bucket A follow-up)
- `hasActiveViolation` is derived from `violations take:5` in getById — if a fisherfolk has >5 violations and the 6th is active, the Renew button won't show disabled (server still blocks; UX degrade only). Fix: add `activeViolationCount` field to getById (deferred).
- Performance indexes (deferred from S0 code review): `@@index([tenantId, renewalYear])` on RegistrationRenewal; index on `fisherfolk(id_released_by_id)`
- TOCTOU on violation check in `renew` (violation.count is pre-transaction; low-probability race) — architectural fix deferred
- `_count.renewals` on `list` runs a COUNT subquery on all list callers including autocomplete dropdowns — consider splitting to a lean `listSummary` for dropdowns (deferred, needs API split)

### Main branch state

`main` is clean at `08f9054` (back-port candidates A–I). All prior PRs (#1–#9) merged.

### Deployment gate

HARD HOLD — no staging/production deploy until owner explicitly authorizes.
