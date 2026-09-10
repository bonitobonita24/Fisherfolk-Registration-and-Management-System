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

- ✅ **`@frms/mobile` lint fails in CI — FIXED (2026-09-09, `1722c9f`).** Root cause: apps/mobile was
  scaffolded with a flat `eslint.config.js` but never got its own `eslint`+`eslint-config-expo` devDeps →
  resolved a hoisted eslint@8.57 (legacy mode) → "all files ignored". Fix: added eslint@^9 (matches web) +
  eslint-config-expo@~57.0.2; converted 2 manual fetch effects to react-query; cleared stale disables.
  **CI `Turbo lint` task now GREEN.** Lesson `expo.eslint.flat-config-missing-deps-legacy-fallback`.
- ✅ **CI `Dependency vulnerability audit` — GREEN (owner authorized merge+push, 2026-09-10).** Merged both
  critical branches into `fix/ci-dep-audit-criticals` → `main`.
  ⚠ **Correction to the 2026-09-09 claim below ("merging both greens the CI audit job") — it did NOT.**
  With both criticals merged, `pnpm audit --audit-level=high` still exited non-zero on **8 pre-existing HIGH**
  advisories. Cleared in `b2142d6`: `sharp`→0.35.4 (⚠ its existing `<0.35.0` override floor was STALE —
  lesson `pnpm.overrides.stale-floor-still-vulnerable`), `nodemailer`→9.1.1, `deepmerge-ts`→8.0.2,
  `browserslist`→4.28.9, `js-yaml`→4.3.2 (existing override covered only the 5.x range). All floors bounded
  below the next major. `image-size` (2 HIGH) has **no patched version published** — build-time-only DoS
  parsers via metro/expo, never at runtime in prod → excepted via `pnpm.auditConfig.ignoreGhsas`; revisit
  when upstream ships a fix. **Gate: audit EXIT 0 · typecheck 8/8 · lint 6/6 · 428 tests · build ✓.**
  (1) ✅ **`next` RCE GHSA-p293-qw3h-jr36** → branch `fix/next-security-patch-15-5-24` (`f030a9b`). pnpm
  override `next@<15.5.24`: `>=15.5.24 <16.0.0` → `next@15.5.25` (bounded below 16 — an unbounded floor
  wrongly pulled `next@16.3.4`; lesson `pnpm.overrides.unbounded-floor-pulls-major`). Windows-only RCE, so
  prod Linux was never exploitable. Gate: typecheck 8/8 · build ✓ · 428 tests.
  (2) ✅ **`maplibre-gl@5.24.0` critical XSS** → branch `fix/maplibre-gl-v6-xss` (`19aaf77`). Bumped to
  `^6.8.0` (patched `>=6.4.1`). The 5→6 major was flagged [WHAT]; **investigation resolved it to [HOW]** —
  our API surface (Map/Marker/NavigationControl/GeoJSONSource/AttributionControl/MapMouseEvent across 4
  components) is unaffected by every v6 breaking change (setData called single-arg w/ ignored return; no
  `map.transform`; WebGL2 universal). Gate: typecheck 8/8 · build ✓ · 428 web + 21 db tests · maplibre
  advisory cleared. ⚠ Residual (device-gated): real-browser visual render of the 4 maps — not verifiable
  headless on this seat (software WebGL composites black). `agent-found 2026-09-09` `security` `bug`
  ✅ **Merged + pushed to `main` 2026-09-10 on owner's word.** Residual map visual-render check stays
  device-gated (tracked under FIS-37b).

### 🟡 Built / drafted — LOCAL / HARD HOLD, awaiting owner integration decision (owner-gated, not un-gated)

- ✅ **FIS-37a / FIS-37c / FIS-32 — SHIPPED to prod as v0.29.0 (owner "proceed with #1", 2026-09-08).**
  `origin/main == 3feca30`, tag `v0.29.0`. FIS-37c (`matrixProcedure("violations","write")`, create-only) is
  LIVE on prod — bantay_dagat + admins can now file violations; prod endpoints 200. FIS-37 mobile M1 client
  integrated into the repo (not web-deployed; device bring-up = FIS-37b, blocked). FIS-32 back-port candidates
  landed in `docs/BACKPORT_CANDIDATES.md` (still owner-pastes into PRODUCT.md — Rule 1). Migrate deploy = no
  pending migrations. See CHANGELOG v0.29.0 + `feat/fis37c-violation-create-authz` graft `05f68d4`.
- ✅ **FIS-33 #3 — map-marker a11y.** RESOLVED (verified 2026-09-10) — the **keyboard-accessible list alternative**
  was chosen and shipped (not focusable pins), alongside #1 target-size + #2 focus-restore. Evidence:
  `apps/web/src/app/[tenant]/households/[id]/household-member-map.tsx:341-427` and
  `apps/web/src/app/[tenant]/households/network/municipal-network-map.tsx:591-696`
  (`role="region"` + `aria-label="Map locations (list view)"` + `<ul>`), tag `v0.24.0`; branch
  `feat/fis33-map-marker-a11y-list` merged into `main`. `owner 2026-09-01` `a11y`

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
