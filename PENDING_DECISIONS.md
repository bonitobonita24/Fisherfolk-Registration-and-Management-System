# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

### 2026-09-01 — ⚠ FIS-12 migration drift — RELEASE-BLOCKER before any prod migrate (surfaced by full audit)

- [x] ✅ **RESOLVED (2026-09-01, owner chose "merge/rebase FIS-12 first") — MERGED into the release branch.**
  `git merge --no-ff feat/fis12-registration-status-model` → `feat/presentation-batch-0901` (`4aa229a`).
  `schema.prisma` auto-merged cleanly (`EXPIRED` enum value + location coords coexist); all 3 migrations now
  present in correct chronological order (`add_expired` → `backfill` → `add_location_coordinates`); the 2 docs
  conflicts (SESSION_LOG/TASK_QUEUE) resolved as a union (both histories kept). Verified: prisma validate ✓ ·
  tsc --noEmit ✓ (after `prisma generate`) · 416 unit tests ✓ (170 DB-gated skipped, 586 total — reconciles) ·
  lint-gated `next build` ✓. LOCAL / HARD HOLD (nothing pushed). Schema/migration history is now consistent for
  a future prod `migrate deploy`.
  - [x] ✅ **RESOLVED (2026-09-02, owner "yes all the way" after reviewing real prod counts) — SHIPPED to prod
    in v0.22.0.** Read-only prod check first showed **3,181 ACTIVE, 0 INACTIVE** (clean, no edge cases). Owner
    approved `ACTIVE→NEW` (INACTIVE→EXPIRED a no-op). Prod DB backed up (`frms-prod-backup-pre-pushtoprod-*.sql.gz`),
    `migrate deploy` applied all 3 migrations, backfill verified: **all 3,181 fisherfolk now `NEW`**. Reversible
    from the pre-migrate backup if ever needed.
  - 🔧 **Dev-workflow caveat (not a prod blocker):** `ALTER TYPE ... ADD VALUE` can trip Prisma `migrate dev`'s
    shadow-DB (enum-value-in-transaction). Prod uses `migrate deploy` (no shadow DB) so it is unaffected; only
    a fresh local `migrate dev` reset would hit it.

### 2026-08-27 — 🎨 Cargorix Wave 3 go/no-go (HARD HOLD — owner review gate)

- [x] ✅ **RESOLVED (2026-08-27, owner "that is all approved and good to go") — Cargorix Wave 3 DONE + verified.**
  Reskinned the 14 `components/shared/` wrappers to the Cargorix token idiom (floating-card/chip/radius),
  commit `354131a` on `feat/cargorix-stack-integrated`. **DefinitionGrid left byte-identical (FROZEN)** per the
  owner-signed "absolutely perfect" guardrail — `detail-field.tsx` untouched; `index.ts` barrel byte-stable;
  no prop/export/signature drift; no literal colors (tokens only). Verified: tsc 7/7 · lint · 410 tests · build ·
  **axe WCAG 2.2 AA = 0 violations across 10 routes (incl. dark)** · live detail render confirms DefinitionGrid +
  record-header + status-badge intact. Screenshots sent. LOCAL / HARD HOLD (nothing merged/pushed/deployed).
  **Roadmap now at Wave 4** (additive: ⌘K, theme customizer, density — all pre-approved) → Wave 5 (per-module
  polish + full-app axe + Rule-31 re-baseline). Both remain owner-gated go/no-go.

### 2026-08-14 — 🚀 Push / merge authorization (HARD HOLD)

- [x] ✅ **RESOLVED [WHAT] (2026-08-14, owner authorized both) — PUSHED + RELEASED `v0.11.0`.**
  Merged `feat/public-landing-page` → `main` (`--no-ff`, `ddc52ca`), applied consolidated release
  `v0.11.0` (CHANGELOG + version-sync across all packages + landing-footer + annotated tag `b4b8511`),
  then `git push --follow-tags origin main` (owner-confirmed version "yes it's OK"). `origin/main` now
  current, tag `v0.11.0` published → trips Model-A CI (docker-publish) + staging auto-deploy.
  Both prior open items (push main / merge+push landing page) are closed by this single release.

### 2026-08-14 — 🟣 "Calapan City" demo tenant seed — DEMO-STACK DEPLOY GATE (HARD HOLD)

- [x] ✅ **RESOLVED [WHAT] (2026-08-14, owner: "deploy the demo + prune the old one; official demo = the
  Calapan City tenant at `/demo`") — DEPLOYED + VERIFIED.** Released **v0.12.0** (merge demo-seed branch +
  `DEMO_SEED_PASSWORD` env override; tsc + 393 tests green; pushed `08ee976`, CI image built) → old demo
  backed up (`/root/frms-demo-backup-pre-calapan-demo-*.sql.gz` on the VPS; held old calapan-city demo +
  6 IDT test tenants) → demo volumes WIPED (old demo fully pruned) → stack up on `demo-latest`=`sha-08ee976`
  → fresh `migrate deploy` → full seed chain re-run remotely with **`--tenant demo`** (slug = `/demo`, name
  "Calapan City", `admin@demo.com` = vault demo cred via `DEMO_SEED_PASSWORD`): 500 fisherfolk (validated
  photo pool) · 300 vessels · 60 violations · 4 ayuda/~530 benef · 120 catches · 25 kanban + long-tail, all
  media on Telegram (bot token added to demo env; new UI uploads still MinIO). Playwright smoke: **8/8 PASS,
  0 console errors** at `frms-demo.powerbyte.app/demo`. Notes: notifications list shows 16 (display cap,
  same as dev); density map can't plot generic "Barangay 1–12" names (cosmetic); households=6 (hardcoded
  target — the tracked household-limit enhancement still open below).

### 2026-08-12 — 🔀 Two local CGC-driven refactor branches — owner review + merge/push (HARD HOLD)

- [x] ✅ **RESOLVED [WHAT] (2026-08-13, owner "Merge all 3 to main, LOCAL only") — MERGED, no push.**
  All 3 held branches `--no-ff` merged into local `main` (refactor/dedupe-cellvaluetostring `594636f`,
  refactor/report-hub-decompose `b18e97e`, fix/traefik-label-drift `79693f0`). Merged tree verified green
  (tsc clean; 59/59 tests incl. new report-hub-config characterization). `main` now 11 ahead of origin,
  **LOCAL only / HARD HOLD — no push, nothing deployed** (push remains a separate future owner decision;
  a push would trip Model-A auto-deploy, staging deliberately offline). Original branches retained.
  - `refactor/dedupe-cellvaluetostring` (`594636f`) — export `cellValueToString` from `src/lib/import/excel.ts`,
    drop 2 byte-identical script copies (−66 lines).
  - `refactor/report-hub-decompose` (`b18e97e`) — split `ReportHub` CC 90→41 into config/filters/results +
    pure unit-tested `getFacetVisibility` (7 new tests). Orchestrator logic byte-identical.
  - Still OPEN (`[HOW]`, no gate — say the word): a **pre-existing category-checkbox bug**
    was PRESERVED in refactor 2 (`selected={categoryIds}` IDs vs `options`=names → never renders checked;
    filter still applies). One-line fix available on a separate branch. Next-hotspot options: `BulkFilterDialog`
    CC 69, `buildReport` CC 64.

### 2026-08-11 — 🔒 Two pre-existing Traefik-label defects in prod+stage compose templates

- [x] ✅ **RESOLVED [HOW] (2026-08-12, owner "resolve it yourself") — labels aligned to server static config.**
  Verified the true resolver name from `Server-Setups/Powerbyte-Hostinger/setup/traefik/traefik.yml`
  (`certificatesResolvers.letsencrypt`, lowercase) — the server FRMS prod actually deploys to. Applied to
  `deploy/compose/{prod,stage}/docker-compose.app.yml` on branch `fix/traefik-label-drift` (`79693f0`):
  (1) `certresolver=letsEncrypt` → `letsencrypt`; (2) added explicit `tls=true` on the websecure router.
  `scripts/lint-deploy.sh` C2 + C3 now PASS (exit 0; only 2 pre-existing non-blocking env-var warnings remain).
  LOCAL only / HARD HOLD — no push, no deploy. Merge to `main` folds in with the decision-#1 branches when owner
  authorizes.

### 2026-08-08 — 🔐 Auth.js beta.32+ bump (CRITICAL fail-open) — MERGED + dev-verified; PROD chain still open

- [x] ✅ **DONE (2026-08-09) — MERGED to local `main` (`473b6ee`) + dev rebuilt + login VERIFIED.** Owner
  chose "Merge + rebuild dev (verify login), LOCAL only". `tenant_superadmin` login click-through green on
  the rebuilt dev (beta.32), 0 console errors → auth pipeline intact, does not fail open. Build-trap fixed
  (`.dockerignore` nested-node_modules clobber — lesson `docker.dockerignore.nested-node_modules-clobber`).
- [x] ✅ **DONE (2026-08-09, owner "yes do #1") — SHIPPED TO PROD.** Pushed main → origin (`3d619b4`) → CI built
  the image → `push-to-prod.sh sha-3d619b4` (prod DB backed up, manifest retag, app recreate, migrate no-op).
  **frms.powerbyte.app now runs beta.32**, container healthy @ revision `3d619b4`; health/login/NextAuth-runtime
  all green (`/api/auth/session` → clean `null`, fail-closed). **2 CRITICAL CVEs mitigated in production.**
  Required a CI fix mid-ship: build was hitting the 30-min timeout (uncached multi-arch/arm64) → switched to
  amd64-only + 45m (`fix/ci-build-timeout-amd64`), build 30.3min→5.2min.
- [x] ✅ **DONE (2026-08-09) — `.dockerignore` hardening.** `node_modules` → `**/node_modules` so the
  deps-stage install stays authoritative and `COPY . .` can never overwrite it with the 7 nested host
  module trees (apps/web + packages/*). Branch `chore/dockerignore-nested-node-modules` @ `adfb7d6`,
  LOCAL / HARD HOLD. Verified: fresh amd64 `docker build` completes green (full turbo build + image
  export, 417MB). Merge to `main` = owner's call (a `main` push would auto-trigger the Model-A staging
  deploy — currently deliberately offline).
- [x] ✅ **DONE (2026-08-08 PM) — bump applied on `fix/authjs-security-bump` @ `5a1937a` (LOCAL, HARD HOLD).**
  `next-auth` → 5.0.0-beta.32 · `@auth/core` → 0.41.3 · `@auth/prisma-adapter` → 2.11.3 · `brace-expansion`
  override → >=5.0.9. All 3 Auth.js advisories (2 CRIT + 1 HIGH `getToken`) + brace-expansion ReDoS cleared
  (independent re-audit confirmed). Zero source changes; tsc/lint/386-tests/build all green. **Runtime 3-tier
  login click-through deferred to the owner-gated merge+dev-rebuild** (dev = baked Docker image; rebuild off
  branch replaces the running app). Out-of-scope highs (Next.js SSRF/DoS, sharp, dompurify, undici) surfaced
  as a separate [WHAT]. Awaiting owner word to merge → main + rebuild dev.
- [x] 🔴 **Upgrade `next-auth` beta.31 → `>=5.0.0-beta.32` + `@auth/core` → `>=0.41.3`.** Surfaced by the
  CI dep-audit on the 2026-08-08 ship. Two **CRITICAL** Auth.js advisories on the current pinned version:
  - **GHSA-8fpg-xm3f-6cx3** — config errors can cause existence-based auth checks to **FAIL OPEN** (auth
    object populated with an error). Serious for a gov app holding citizen PII.
  - **GHSA-7rqj-j65f-68wh** — email normalizer validates before Unicode normalization → **homoglyph `@`
    bypass**. Also hits `@auth/core@0.41.2` via `@auth/prisma-adapter` (patched `>=0.41.3`).
  - (also HIGH `brace-expansion` ReDoS, transitive via `exceljs > archiver` → bump to `>=2.1.2`.)
  - **Task scope:** beta version bump on the auth-critical path → own branch, full verify pass (login /
    3-tier RBAC / session flows re-exercised, tsc/lint/tests green), then LOCAL commit. NOT a drive-by.
    Owner-approved to do next session (2026-08-08). HARD HOLD on push as usual.


### 2026-08-07 — ⭐ OWNER DIRECTIVE (from AIEF seat) — START PLANNING AdminCN adoption across the ENTIRE FRMS site

- [x] ✅ **APPROVED 2026-08-07 (owner "yes all approved", full-auto).** D1–D4 = my recommendations:
  **D1** keep FRMS custom shell · **D2** keep fixed brand + per-tenant override (optional admin-only customizer)
  · **D3** prioritized view subset (RBAC users/roles/permissions, dashboard widgets, settings/profile,
  kanban/todo) · **D4** fold into swarm branches, Phase A (component reconciliation) first. Build IN PROGRESS
  (Phases A→E), LOCAL / HARD HOLD. Base branch: `chore/framework-sync-v32-45`.
- [x] 🚀 **AdminCN full-site adoption — SHIPPED TO PRODUCTION (2026-08-08, owner "push deploy it").**
  Phases A/D-1/D-2/E complete + verified → merged to `main` (`73fbf94`) → pushed origin (`44b078c`, pre-ship
  gate green) → CI built `sha-44b078c` → promoted to PROD via `push-to-prod.sh` (prod DB backed up, no
  migrations, no reseed). **Live + verified: frms.powerbyte.app health 200, login 200, revision `44b078c5d539`.**
  Dev rebuilt off main (Rule 39). Staging stack is torn down (build-only CI, no auto staging deploy) — future
  standup if wanted, not a blocker. Original plan detail below (kept for record).
- [x] **⭐ AdminCN full-site adoption — PLAN APPROVED, BUILD IN PROGRESS (2026-08-07).**
  Owner chose FRMS to formally adopt **AdminCN** (shadcn/studio Pro admin template) — full-site, UI/design layer ONLY.
  **Produce the PLAN first, then wait for owner approval before executing** (planning task, not a build go-ahead).
  - ✅ **DONE 2026-08-07 (full-auto): HARD PREREQUISITE cleared.** Framework synced **V32.28 → V32.45**
    (`prep-sync` → `sync-to-project.sh` → `deploy.sh`), governance-only, zero app source. Branch
    `chore/framework-sync-v32-45` @ `8cdd5da` (LOCAL / HARD HOLD). `.ai_prompt/admincn-starter.md` (#39),
    `starter/admincn/` (222-file slice), and **Scenario 49** are now present. Stale contaminated
    `chore/framework-sync-v32-31` branch force-deleted (would have reverted Aug import work).
  - ✅ **DONE 2026-08-07 (full-auto): adoption plan produced** → `docs/ADMINCN_ADOPTION_PLAN.md`. Gap-diff
    complete: FRMS's token reskin is ALREADY in `main` (`globals.css` 2026-07-04) + shell is already
    AdminCN-shaped → genuinely **low-delta (S–M)**, mostly additive. **Owner: review the plan, then answer
    D1–D4 below before ANY UI build begins.** Build is NOT started (planning-only per directive).
  - ⏳ **OWNER `[WHAT]` — 4 scope decisions gate the build (my recs in the plan):**
    - **D1 App-shell:** keep FRMS's custom shell (👍 recommend — low delta, RBAC+tenant baked in) vs migrate to
      shadcn `Sidebar` default-layout (effort L, higher risk).
    - **D2 Theme:** keep fixed orange/teal/navy brand + per-tenant override (👍 recommend) vs adopt 11-preset
      `ThemeCustomizer` (optionally admin-only).
    - **D3 View-adoption scope:** prioritized subset — RBAC users/roles/permissions, dashboard widgets,
      settings/profile, kanban/todo (👍 recommend) vs all 41 screens.
    - **D4 Ordering:** fold into the `swarm/admincn-reskin` + `swarm/dashboard-redesign` branches + annual-reset
      fast-follow (👍 recommend Phase A component-reconciliation first) — confirm before dispatch.
  - **✅ LOW DELTA (from the rollout tracker):** FRMS already did a manual **AdminCN-style dark reskin (SET-1)** +
    **dashboard redesign (SET-2)**, merged to LOCAL `main` (unpushed). So this **formalizes** the existing reskin onto
    the official V32.43 starter — likely just a **theme-preset swap + component-extra reconciliation**, NOT a full
    re-skin (effort S–M). The plan should DIFF the current FRMS UI against the AdminCN slice and adopt only the delta.
  - **Scope/discipline:** UI/design layer ONLY — keep tRPC + Prisma + Auth.js v5; reconcile the default-layout sidebar
    shell + theme preset + component set; any newly-adopted view grafts off `fake-db` onto FRMS's real tRPC/Prisma
    (5-state + RBAC preserved); Rule-12 tokens win value conflicts; verify-all-pages (gov app → axe WCAG 2.2 AA gate
    stays green); PLAN-FIRST (PM+Architect); commit LOCAL / HARD HOLD.
  - **Priority reconcile:** the unpushed SET-1/SET-2 `main` work + the annual-reset UI fast-follow still stand —
    fold this into them, don't duplicate. Confirm ordering with the owner before dispatch.
  - Reference: AIEF `docs/planning/V32.44_ADMINCN_FLEET_ROLLOUT_TRACKER.md` (FRMS = effort S–M, priority Medium).

### 2026-08-04 — Masterlist import + image fix + full audit (durable detail: [[next_session_barangay_salong_merge]])

- [x] ✅ **DONE (2026-08-06) — Barangay "San Rafael" → "Salong" full merge (DEV).** Merged all 41
  `fisherfolk.barangay='San Rafael'` → `'Salong'` (tenant `calapan-city` `cmrnmmivz0000gmcxggvp9b04`);
  Salong now 67, 0 "San Rafael" remain. Re-added lost `BarangayAlias` (San Rafael→Salong) to live dev DB
  AND to `packages/db/prisma/seed.ts` so it survives future resets (branch `chore/barangay-salong-merge`,
  LOCAL). MAP legacy alias kept. 🔒 Staging/prod merge = separate owner-gated step (below).
- [x] ✅ **RESOLVED (2026-08-07, owner "all approved" + verified already-done) — San Rafael→Salong on PROD.**
  Read-only prod check (`frms_prod_postgres`): **0** `San Rafael` rows, **67** `Salong`, alias row present
  (created 2026-08-06). Prod records were already barangay-normalized at seed/import time → the rename is a
  **no-op on prod**. No mutation run. Staging is offline; it inherits correct data on its next prod-refresh.
- [x] ✅ **RESOLVED (2026-08-07) — "Merge the 2 local branches" is ALREADY IN `main`.** Cross-check: `main`
  already contains the masterlist import + backfill scripts, the `/api/media` middleware bypass, and the
  `BarangayAlias` seed (landed via v0.10.0/v0.10.1, Aug 6–7). `feat/masterlist-batch-import` (`3f1b553`) and
  `fix/api-media-middleware-bypass` (`685eaa9`) are **stale Aug-4 snapshots** — merging them would REVERT the
  releases. Left in place as superseded; **do not merge**.
- [x] ✅ **RESOLVED (2026-08-07, verified live) — `/api/media` fix is already on PROD.**
  `GET https://frms.powerbyte.app/api/media?key=…` → **401** (self-auth reject), not the old **307** redirect →
  middleware bypass is deployed and working. No re-deploy needed.
- [x] ✅ **DONE (2026-08-07) — Deleted `for_importation/` (436MB PII image dump).** Purged after import
  confirmed good; documented in the 2026-08-07 follow-ups completion.
- [x] ✅ **DONE (2026-08-07) — Middleware `isPublicPath` boundary-match hardening.** `startsWith(p)` →
  `pathname === p || startsWith(p + "/")` for all PUBLIC_PATHS (closes the latent `/api/media-admin` bypass).
  tsc + lint green. Commit `59cd415`, merged to LOCAL `main` (`45df969`). **HELD from push** — pushing `main`
  auto-triggers a Model-A staging deploy that would resurrect the deliberately-offline staging stack; the change
  is non-urgent latent hardening. Push on owner's word / when staging returns.
- [x] 🔵 (cosmetic) Co-author trailer — RESOLVED [HOW] 2026-08-10: use the standard global trailer (`Co-Authored-By: Claude Opus 4.8`) on future commits. No back-fill.
- ✅ DONE this session: imported 74 new fisherfolk + 148 Telegram assets to DEV (3016→3090); fixed broken
  images (dev rebuild + middleware); full audit → DOB drop on 26/74 found + fixed (code + dev backfill).
  Lessons logged (exceljs date/serial, middleware public-paths, dev-freshness).

---

- [] 2026-07-09 — **M4 Universal Report Hub — product-grain defaults (non-blocking).** The Full-Auto
  loop built the Report Hub with sensible technical defaults; each below is a `[WHAT]` the owner may
  flip. None blocked the build.
  1. **Browser-PDF path:** "PDF export" = the existing `window.print()` → "Save as PDF" flow (no new
     server-PDF dependency). Flip only if a true server-rendered PDF is required.
  2. **Time-series bucket granularity:** monthly buckets for violation / ayuda / fish-catch over-time
     charts. Flip to weekly/yearly if preferred.
  3. **Household size-distribution bands:** 1, 2–3, 4–5, 6+. Flip if the FMO uses official bands.
  4. **Ayuda report grain:** reports over `AyudaBeneficiary` rows (ledger-useful), not program-level
     summary. Flip if a program-level roll-up is wanted instead.
  5. **Default scope with no facet selected:** unfiltered / tenant-wide (respects existing Viewer+ gate).
     Confirm no extra per-role PII-scope restriction is required.
  - Back-port of the whole Report Hub feature to `docs/PRODUCT.md` is a further owner `[WHAT]`
    (Rule 1) — batched with the other M1/M2/M3 back-port candidates.

- [] 2026-07-09 — **Overnight batch M1–M3 — PRODUCT.md back-ports + Fish Catch product follow-ups
  (non-blocking).** The Full-Auto loop shipped M1–M5 with sensible technical defaults; each below is a
  `[WHAT]` for the owner. None blocked the build; all code is local/UNPUSHED on `feat/household-management`.
  1. **PRODUCT.md back-port (Rule 1) — batch all at once:** M1 Ayuda mass-selection multi-filter (=
     back-port **candidate M**, DECISIONS_LOG), M2 Fish Catch activity, M3 Fish Catch analytics, M4 Report
     Hub. PRODUCT.md is human-only — owner back-ports, defers, or logs `spec-divergent`.
  2. **Fish Catch — Species master table + Settings CRUD (optional):** M2 shipped free-text `commonName`
     + `COMMON_FISH_SPECIES` datalist (no master table). Add a normalized Species model + Settings CRUD if
     the FMO wants a controlled species vocabulary. Flip = a new small feature, not a fix.
  3. **ToDo ↔ Fish Catch source-linking (optional):** add `fishCatch` to the ToDo `SourceEntityType` so
     a "Make ToDo" button can link to a fish-catch record (skipped on the M2 detail page). Small additive wire-up.
  4. **App-wide hover color-contrast theme pass (🟡 pre-existing, NOT an M4 regression):** outline buttons'
     `hover:bg-accent` teal-on-white measures ~3.59:1 (< WCAG 4.5:1) on hover only. App-wide theme issue —
     candidate for a dedicated theme/contrast pass, owner-scheduled.

_(all prior owner `[WHAT]` decisions resolved as of 2026-06-30; the two 2026-07-09 items above are the
only open follow-ups — both non-blocking, batch outcome ✅ COMPLETE)_

## Resolved

- [x] 2026-06-30 — **Merge PR #5 — WCAG 2.2 AA accessibility fixes** (`feat/a11y-wcag-audit`) →
  DONE. Owner merged; squash-landed to `main` @ `bf8306f` (alongside PR #6 hydration/favicon
  @ `eda7614`). CI green. Gov hard-gate (Rule 33) satisfied. Ref: [[project_a11y_wcag_audit]].


- [x] 2026-06-30 — **PRODUCT.md back-port — custom-domain support** → DONE.
  Owner authorized the agent to apply candidate J directly (Rule 1 waived for this
  one change, logged in `docs/DECISIONS_LOG.md`). Back-ported to PRODUCT.md ## Tenancy
  Model, ## Domain / Base URL Expectations, and the Tenant entity under ## Data Entities
  (lines 315 / 401 / 461). Candidate J marked ✅ BACK-PORTED in
  `docs/BACKPORT_CANDIDATES.md`; committed `c74bccb`. No further action.

- [x] 2026-06-29 — **Live middleware wiring for custom-domain masking** → DONE.
  `apps/web/src/middleware.ts` now wires `resolveTenantRoute` + `parseCustomDomainMap`
  per docs/MULTITENANCY.md §Activation: parses `TENANT_CUSTOM_DOMAINS` once per runtime
  and rewrites a matching Host to `/<slug>/...` before auth. **Inert** while the env var
  is empty (resolver returns rewriteTo=null) — zero behaviour change, data boundary
  unchanged. Verified: tsc + lint clean, 159 tests, build OK. Merged to main `3ca67bf`,
  pushed. First real activation must still run the MULTITENANCY.md §Verify checklist
  against a live domain.

- [x] 2026-06-29 — **Merge / push the UI rehab branch** → owner **loosened the HARD HOLD**:
  "I don't have any staging nor production yet deployed so it's safe to push to main."
  Resolution: integrate the finished stack into `main` and push. `feat/ui-rehab-pro` fast-forwarded
  `main` (brings PR #3 CRUD, PR #4 attachments, data-management, + all rehab); `feat/deploy-seed`
  (PR #2) merged for the seed scripts; PR #1 (csp) closed as **superseded** by the ported `e5ef970`.
  No live deploy occurs (no staging/prod stack exists yet). HARD HOLD now lifted for this project.

- [x] 2026-06-29 — Palette direction → **modern dark, orange + navy** (owner picked after a light
  "Deep Sea Teal" trial); greenish chart accent retuned to navy. Shipped in the rehab.

### AdminCN reference-slice untrack — remove the committed vendored slice (framework V32.48.1) (2026-08-10, broadcast from AIEF seat)
- [x] ✅ **DONE (2026-08-10) — untracked on branch `chore/untrack-admincn-slice`.** `git rm -r --cached starter/admincn` (222 files, `git ls-files starter/admincn` → 0; working copy stays on disk) + added `starter/admincn/` to `.gitignore` manually (did NOT run the full `deploy.sh` sync — that's the separate owner-gated V32.48 item). Verified zero app imports from the slice. LOCAL / HARD HOLD.
- [x] ~~**[HOW] Untrack the vendored `starter/admincn/` AdminCN reference slice**~~ (un-gated mechanical cleanup — no owner decision needed; execute on this seat at your convenience).
  - **Why:** framework **V32.48.1** (`deploy.sh`) now gitignores the vendored `starter/admincn/` slice — it is a local cherry-pick REFERENCE (re-copied on each framework sync), never meant to be committed, and is non-compiling reference material. This app currently has **222 slice files tracked in git**, duplicating ~37 of your own `components/ui` components.
  - **Fix (run on THIS app's seat, LOCAL only — HARD HOLD, no push required for it to take effect):**
    `git rm -r --cached starter/admincn && git commit -m "chore: untrack AdminCN reference slice (framework V32.48.1)"`
    The working copy stays on disk (deploy.sh re-copies it each sync); only git tracking is removed. Then re-run the framework sync (`deploy.sh`) so the `starter/admincn/` line lands in this app's `.gitignore` (V32.48.1 adds it automatically).
  - **Verify:** `git ls-files starter/admincn | wc -l` → 0 after. Mark `- [x]` when done.
  - Answer: _(seat executes)_

---

## Site Access & Tenancy Bootstrap Standard rollout — owner-gated (opened 2026-08-16/17)

Phase 0 (global authoring) + Phase 1 (FRMS reference impl) are DONE and validated, all LOCAL/HARD HOLD.
The following require the owner's explicit word — the full-auto loop must DEFER, never act:

- [x] ✅ **RESOLVED (2026-08-17, owner "yes I authorize the gated items", scope = FRMS only) — FRMS MERGED +
      PUSHED + RELEASED v0.15.0.** Merged `feat/site-access-tenancy-standard` → main (`--no-ff` `e3dad45`),
      applied consolidated release **v0.15.0** (CHANGELOG + version-sync across 7 packages + landing-footer,
      annotated tag), `git push --follow-tags` → `origin/main == 9594ced`. Verified pre-push: typecheck 7/7,
      402 tests, build 5/5. **AIEF `feat/v32.50-site-access-standard` DELIBERATELY HELD** for its own seat
      (owner chose "FRMS only") — still an open item, see below.
- [x] ✅ **RESOLVED (2026-08-17, owner authorized, fresh generated passwords) — VAULT EDITED.** Added
      `tenant_billing` (tenantbilling@) + `tenant_tech` (tenanttech@) universal PLATFORM accounts + demo
      `superadmin@demo.com` (net-new; admin@demo.com retained) to
      `Server-Setups/secrets/universal-login-credentials.enc.yaml`. Decrypts clean; committed LOCAL only
      (`b4178da`, Server-Setups main, no push). Feeds seed env vars `TENANTBILLING_PASSWORD`/`TENANTTECH_PASSWORD`.
- [x] ✅ **RESOLVED (2026-08-17, owner "promote prod + demo now") — PROD + DEMO PROMOTED to v0.15.0 / `sha-9594ced`.**
      CI built the image → `push-to-prod.sh sha-9594ced` (DB backed up, retag, single migration
      `add_platform_scope_role_matrix` applied, reseed-never) + `push-to-demo.sh sha-9594ced` (same).
      Both healthy on revision `9594ced`; endpoints 200 (`/`, `/login`, `/tm/login`, `/demo`, `/demo/login`).
      Prod-101-behind is CLEARED (prod now current). Staging data-first gate bypassed per owner word (staging
      torn down / build-only).

**OWNER-AUTHORIZED 2026-08-27 — but CROSS-SEAT (not executable from the FRMS seat):**

> Owner ("on the next session do this Cargorix redesign and the two open PENDING_DECISIONS")
> has AUTHORIZED both below. They stay `[ ]` here because they are **not FRMS-seat work** —
> each must be executed from its OWN seat. The authorization travels to those seats; a FRMS
> session should surface them as authorized-but-belonging-elsewhere and NOT attempt them.

- [ ] **AIEF framework standard merge** — ⚠ AIEF SEAT. Merge AIEF `feat/v32.50-site-access-standard` → main +
      push. Owner-authorized 2026-08-27. Do this from the Powerbyte-AIEF seat (never from FRMS).
- [ ] **Phase 2 — per-app site-access adoption** — ⚠ PER-APP SEAT. Implement the site-access standard in
      Marine-Guardian / Orqafy / FerryBook / CueLane (broadcast notes already in each app's memory).
      Owner-authorized 2026-08-27; owner decides ordering. Done in EACH app's OWN seat, never cross-repo from FRMS.
- [x] ✅ **RESOLVED (2026-08-17, owner "yes merge & ship") — MERGED + PUSHED + RELEASED v0.15.1 + PROMOTED to
      PROD + DEMO.** Both branches merged `--no-ff` to `main` (`abce6c3` landing+badge, `5cdb90c` seed script),
      re-verified merged (typecheck 7/7 · lint · **572 tests** · build), released **v0.15.1** (`4cd1bfe`, CHANGELOG
      + version-sync 7 pkgs + footer + tag), `git push --follow-tags` → `origin/main == 4cd1bfe`. CI built
      `sha-4cd1bfe`; promoted via `push-to-prod.sh` + `push-to-demo.sh` (DB backed up each, no pending migrations —
      code-only, reseed-never). Both live + healthy on `sha-4cd1bfe`: `/api/health` 200, `/tm` → 307→login (new
      landing route confirmed deployed), all routes green. Dev rebuilt off main (Rule 39). The `/tm` BILLING/TECH
      UX is now FIXED live everywhere (no-access panel + real tier badge), and the seeded accounts authenticate.
- [x] ✅ **RESOLVED (2026-08-17, owner "do B", scope confirmed: prod + demo; skip superadmin@demo.com) —
      PLATFORM ACCOUNTS SEEDED ON PROD + DEMO.** New scoped idempotent script
      `packages/db/scripts/seed-platform-accounts.ts` (branch `chore/seed-platform-accounts` `4aa3b6e`,
      LOCAL) lifts ONLY the `tm` platform tenant + BILLING/TECH SUPPORT CustomRoles + grants + the
      `tenantbilling@`/`tenanttech@` users from `prisma/seed.ts` (byte-faithful upserts; touches NO
      tenant/LGU/demo data; hard-refuses without real vault passwords). Ran against both live DBs via the
      `push-to-prod.sh` SSH-tunnel pattern (DB backed up first each: `frms-{prod,demo}-backup-pre-platform-seed-*.sql.gz`;
      vault passwords injected via `sops -d --extract`, never echoed). Verified on BOTH: `tenantbilling@` =
      tenant_manager/ACTIVE/tier=BILLING/grants=`billing`; `tenanttech@` = tenant_manager/ACTIVE/tier=TECH SUPPORT/
      grants=`data_overrides,tech_support`. The `/tm` BILLING/TECH logins now authenticate live.
      - **`superadmin@demo.com` SKIPPED** (owner decision 2026-08-17): the live demo tenant already has its one
        allowed `tenant_superadmin` (`demo-super@calapan-demo.local`, Rule 34); superadmin@demo.com stays a vault
        TARGET, revisit later. No code, no live mutation for it.
      - **Note:** prod/demo run v0.15.0 (no A/landing UX yet), so a BILLING login there still hits the OLD
        `/tm/tenants` 403-loop until the `/tm` UX branch below ships to those envs. Account seeding (this item)
        is complete and independent.
