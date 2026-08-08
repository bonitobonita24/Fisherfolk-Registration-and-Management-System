# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

### 2026-08-07 — ⭐ OWNER DIRECTIVE (from AIEF seat) — START PLANNING AdminCN adoption across the ENTIRE FRMS site

- [x] ✅ **APPROVED 2026-08-07 (owner "yes all approved", full-auto).** D1–D4 = my recommendations:
  **D1** keep FRMS custom shell · **D2** keep fixed brand + per-tenant override (optional admin-only customizer)
  · **D3** prioritized view subset (RBAC users/roles/permissions, dashboard widgets, settings/profile,
  kanban/todo) · **D4** fold into swarm branches, Phase A (component reconciliation) first. Build IN PROGRESS
  (Phases A→E), LOCAL / HARD HOLD. Base branch: `chore/framework-sync-v32-45`.
- [x] ✅ **AdminCN full-site adoption — BUILD COMPLETE + CONSOLIDATED onto local `main` (2026-08-08).**
  Phases A (7 UI primitives) / D-1 (dashboard animated StatCard) / D-2 (RBAC surface reskin, styling-only) /
  E (verification) all done and verified live (owner present); merged `--no-ff` into local `main`
  (`73fbf94`), tsc green. **Push HELD (HARD HOLD)** — pushing `main` auto-fires staging deploy; staging is
  offline. Only remaining owner `[WHAT]` here is when to push/deploy. Original plan detail below (kept for record).
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
- [ ] 🔵 (cosmetic) Co-author trailer `Claude Opus 4.8` vs global `(1M context)` variant — future commits only.
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
