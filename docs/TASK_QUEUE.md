# Task Queue — Fisherfolk Registration & Management System

Fleet-standard task backlog (`task-capture-discipline.md`). Status: **TODO 🔴 · PARTIAL 🟡 · DONE ✅**.
Captures owner-dumped asks AND agent-found out-of-scope items. Distilled spec only — never raw prose.
Not a decisions log — owner-gated `[WHAT]`s live in `PENDING_DECISIONS.md`.

> **Authoritative queue = the Squirlnote board** (`mcp__squirlnote__*`, project FIS). This file mirrors it.
> **Reconciled 2026-09-08 (loop slot 12)** against the live board + git: the board has exactly **4 Pending**
> (all gated/blocked — below), **0 On-Going**, and **27 For Review** (agent-done, awaiting owner Done). The
> long stale 🔴 batch that used to sit here was **already shipped to prod v0.22.0→v0.28.0** — collapsed into
> "✅ Shipped (historical)" so this file no longer lists false un-gated work. Detail for shipped items lives in
> git tags + `docs/SESSION_LOG.md` + `docs/STATE.md`.

## 🔴 / 🟡 Open

### ⛔ Gated / blocked — the 4 live Squirlnote Pending (NONE un-gated; the loop must DEFER, not build)

- ⛔ **FIS-10 — Aquaculture sub-registration (subcategories + fields).** "Aquaculture" already a canonical
  category (`lib/normalize/types.ts`). NEW = subcategory taxonomy + aquaculture-only fields: brackish
  (fishpond/fishpen/fishcage/fishcorral) + freshwater (backyard variants); capture land area, lease-or-owned,
  commodity type, culture method (poly/monoculture); operators register (not non-operator landowners).
  ⛔ **ORDINANCE-GATED** — full impl pending the January ordinance amendments; build structure now, activate later.
  [WHAT]: new Prisma model vs JSON extension; which fields required. `source: owner meeting 2026-07-09` `feature` `db`
- ⛔ **FIS-34 — Refresh landing showcase screenshots (real browser) + redeploy demo.** Feature the new
  maps/location-capture surfaces headless can't capture (software-WebGL composites map canvas black); overwrite
  `public/showcase/*.png`. ⛔ **BLOCKED** — needs a real GPU browser + demo/EC2 access (Server-Setups migration).
  `owner 2026-09-01` `design`
- ⛔ **FIS-23 — Retarget demo + staging CI/CD deploys to the new AWS box (post-relocation).** Demo/staging now
  run on the AWS box, not the old Hostinger `push-to-demo.sh` target. ⏳ **NEEDS OWNER** — the actual box/EIP
  value (`13.213.232.194` vs `18.138.220.90` vs other) before I touch deploy config; actual deploy stays
  access-gated. `agent-found` `infra`
- ⛔ **FIS-37b — Mobile device bring-up + sideloadable APK.** Device/emulator QA (login round-trip, camera QR
  scan, single-React runtime check) → EAS `android-apk` build → sideload. ⛔ **BLOCKED** — no physical device on
  this WSL seat. Owner runs `apps/mobile/README.md` bring-up when ready. `feature` `mobile`

### 🔴 Agent-found — un-gated [HOW] (fix anytime; does NOT block web deploy)

- 🔴 **`@frms/mobile` lint fails in CI (`expo lint` → "all files matching glob are ignored").** Pre-existing,
  arrived with the FIS-37 M1 mobile merge (prod is web-only, unaffected — `docker-publish.yml` builds
  `apps/web/Dockerfile` only and is independent of `ci.yml`). Root cause: ESLint 8.57 resolves `expo lint`
  in legacy mode and ignores the flat `apps/mobile/eslint.config.js`; forcing `ESLINT_USE_FLAT_CONFIG=true`
  did not help (expo CLI passes its own `src` glob). Fix = align the mobile lint invocation to the flat
  config (expo SDK 57 lint setup) so `pnpm turbo run lint` is green on main. `agent-found 2026-09-08` `chore` `mobile`

### 🟡 Built / drafted — LOCAL / HARD HOLD, awaiting owner integration decision (owner-gated, not un-gated)

- 🟡 **FIS-37a — Expo mobile app Phase M1 MERGED to `main`** (`a4a9055`); gate green on merged tree (typecheck
  8/8 · 428 tests · build 1/1). Carries 2 monorepo-wide install changes (`.npmrc` hoisted + react 19.2.3 pin);
  apps/web re-verified GREEN. On `main` (part of the 12-ahead HARD HOLD). Squirlnote → For Review. Owner call: push.
- 🟡 **FIS-37c — bantay_dagat + admins may file violations.** `violation.create` `adminProcedure` →
  `matrixProcedure("violations","write")` (CREATE only; update/lift stay admin). Live-DB proven 4/4. Branch
  `feat/fis37c-violation-create-authz` (`51bfd83`), UNMERGED/LOCAL. Squirlnote → For Review. Owner call: merge.
- 🟡 **FIS-32 — PRODUCT.md back-port candidates O (FIS-35 Calendar) + P (FIS-36 Field Diary)** drafted paste-ready
  in `docs/BACKPORT_CANDIDATES.md`, branch `docs/fis32-backport-candidates` (`0b43bac`). Rule 1 — owner pastes into
  PRODUCT.md (human-only). Squirlnote → For Review.
- 🟡 **FIS-33 #3 — map-marker a11y approach (still open [WHAT]).** Member + network map markers not
  keyboard-focusable + share generic name "Map marker" (WCAG 2.1.1/4.1.2, moderate). Owner picks: focusable pins
  with per-pin names OR a keyboard-list alternative. (#1 target-size + #2 focus-restore already shipped; a
  keyboard-list alternative shipped v0.24.0.) `owner 2026-09-01` `a11y`

## ✅ Shipped (historical — reconciled 2026-09-08; detail in git tags + SESSION_LOG)

Everything below was built, verified, and **shipped to production** — no longer open work. Kept as a compact ledger.

- ✅ **v0.28.0 (2026-09-05)** — FIS-35 Calendar-of-Activities home · FIS-36 Field Diary/Notes · FIS-37 mobile
  auth server foundation (+ Expo M1 merged 2026-09-08). Prod `sha-ab4abd4`, verified live.
- ✅ **v0.27.0 (2026-09-04)** — FIS-38 dashboard double-count fix (6362→3181) · FIS-39 app-shell scrollbar fix ·
  FIS-8 Phase D family-aware reporting (616 tests). Prod `sha-289086d`.
- ✅ **v0.26.0 (2026-09-03)** — FIS-6 audit-log view · FIS-7 user-management (superadmin/manager-only) · FIS-8
  Phase C multi-family UI · FIS-14 = RSBSA (no code). Prod `sha-70b55b5`.
- ✅ **v0.23.0 / v0.24.0 / v0.25.0 (2026-09-03)** — FIS-8 A/B/C multi-family + ayuda grain · FIS-9 violation count
  label · FIS-11 employment/income · FIS-13 authed QR verify · FIS-15 3-yr renewal reminder · FIS-16 mayor =
  viewer (no code) · FIS-31 landing shipped-feature callouts · FIS-33 #1/#2/#3 a11y.
- ✅ **v0.22.0 / v0.22.1 (2026-09-01/02)** — presentation batch FIS-17..30 (detail density, category chips,
  renewal date, household member maps + municipal network map, location capture across 5 entities, distinct
  category colors, zoomable media) · FIS-12 status model NEW/RENEWED/EXPIRED + backfill (3181 ACTIVE→NEW) ·
  FIS-17 tab-bar scrollbar restyle · geolocation Permissions-Policy fix (`geolocation=(self)`).
- ✅ **v0.19.0–v0.21.0 (2026-08-28→30)** — Cargorix design-language reskin (Waves 0–5) + FIS-3/FIS-4 app-wide
  shared-component consistency + FIS-5 a11y (aria-hidden→inert) + FIS-2 MEMORY.md compaction.

## ✅ Done recently (branch-level, not yet folded above)

- ✅ **FIS-4 / FIS-3 Cargorix consistency** — shared ListToolbar/ListPagination/FormSection/UnderlineTabs
  app-wide (axe 0 across 19 routes, 416 tests). Shipped v0.20.0/v0.21.0.
- ✅ **Import + reconcile ledger** (2026-08-24→26) — 08-14-26 masterlist to dev+prod+legacy FMO app; FMO↔FRMS
  reconcile (both 3181); `/fisherfolk/new` 400→404; host-aware tenant links; import-script telegram ledger fix.

> **Not FRMS-code tasks (business/proposal — tracked elsewhere):** maintenance pricing vs HR system · pitch
> slides · cloud-cost justification · re-registration letter · person-assigned study items. **Parking lot:**
> staff whereabouts/activity tracking.
