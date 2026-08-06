# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

### 2026-08-04 — Masterlist import + image fix + full audit (durable detail: [[next_session_barangay_salong_merge]])

- [x] ✅ **DONE (2026-08-06) — Barangay "San Rafael" → "Salong" full merge (DEV).** Merged all 41
  `fisherfolk.barangay='San Rafael'` → `'Salong'` (tenant `calapan-city` `cmrnmmivz0000gmcxggvp9b04`);
  Salong now 67, 0 "San Rafael" remain. Re-added lost `BarangayAlias` (San Rafael→Salong) to live dev DB
  AND to `packages/db/prisma/seed.ts` so it survives future resets (branch `chore/barangay-salong-merge`,
  LOCAL). MAP legacy alias kept. 🔒 Staging/prod merge = separate owner-gated step (below).
- [ ] 🔒 **Apply the same San Rafael→Salong merge to STAGING + PROD?** (owner-gated) — DEV done; the
  same UPDATE + alias re-add would run against staging/prod `calapan-city`. Owner's call when to promote.
- [ ] 🔒 **Merge the 2 local branches to `main`?** (owner-gated) — `feat/masterlist-batch-import` @ `43f7ab6`
  (importer + DOB-parse fix + backfill) and `fix/api-media-middleware-bypass` @ `685eaa9` (broken-images
  middleware fix). Both off main, unpushed, tsc-clean. Must land together.
- [ ] 🔒 **Promote the `/api/media` middleware fix to STAGING + PROD** (owner-gated, HIGH IMPACT) — the bug
  breaks EVERY Telegram-backed image in-browser on staging/prod too, once viewed. Fix ready.
- [ ] 🔒 **Delete `for_importation/` (~280MB PII image dump)?** On disk, gitignored on the importer branch.
  Offer to remove once the import is confirmed good (like `.tempfiles`).
- [ ] 🔵 (optional) Middleware `isPublicPath` `startsWith` → exact-match `/api/media` (future `/api/media-admin`
  would else be silently public). Latent, not active.
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
