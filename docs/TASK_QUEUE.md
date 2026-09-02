# Task Queue — Fisherfolk Registration & Management System

Fleet-standard task backlog (`task-capture-discipline.md`). Status: **TODO 🔴 · PARTIAL 🟡 · DONE ✅**.
Captures owner-dumped asks AND agent-found out-of-scope items. Distilled spec only — never raw prose.
Not a decisions log — owner-gated `[WHAT]`s live in `PENDING_DECISIONS.md`.

## 🔴 / 🟡 Open

### 2026-09-01 presentation batch (owner-dumped). Map decision: barangay-level + draggable capture. ALSO targets Production (separate owner-gated release; ayuda/vessels/violations dormant in prod for now).

> STATUS 2026-09-01: FIS-17..24 ✅ built+verified+committed (`faa591b`); FIS-25 🟡 flagship (Fisherfolk)
> built+committed (`0394a97`), other 4 entity forms pending. Badge dedupe `d843dc4`. Renewal backfill
> `<this commit>`. Branch `feat/presentation-batch-0901`; deploying to demo. tsc/lint/416 tests/build green.

- 🔴 **FIS-17 — Detail fields ~30% larger + tighter density (ALL detail pages).** Shared `components/shared/detail-field.tsx`: bump `DetailField` label (`text-xs`) + value (`text-sm`) ~30%; tighten `DefinitionGrid` (`gap-x-6 gap-y-4`) + `FieldRail` (`space-y-4`). Propagates to all 6 detail pages (fisherfolk/households/vessels/violations/ayuda/fish-catches). Done: bigger + closer-spaced, axe AA 0 new, all 6 pages visually QA'd. `owner 2026-09-01` `design` `ui`
- 🔴 **FIS-18 — Fisherfolk sidebar: replace "Status" with Category/categories.** `fisherfolk-detail-client.tsx:372` — swap `DetailField label="Status"` for resolved `categoryIds`→`Category` name+color chip(s). `owner 2026-09-01` `design` `ui`
- 🔴 **FIS-19 — Rename "Registration Year"→"Renewal Date" + history icon + RENEWED header badge.** Profile tab: relabel field, show latest `renewals[].renewedAt` (— if none), history icon opens all past renewal dates (`RegistrationRenewal` table). Add "RENEWED" badge beside ACTIVE in `RecordHeader` when `status===RENEWED`. Confirm "Date Joined"=`dateJoined` (first record) — no change. `owner 2026-09-01` `feature` `ui`
- 🔴 **FIS-20 — Household member rows: photo thumbnail (click-to-enlarge) + category label.** `household-detail-client.tsx` member rows: add photo left of name (add `photo` to `fisherfolkLiteSelect` in `household.ts`, resolve download URL, lift `ZoomableImage` to shared); category label on right (fetch `category.list`, map ids→names). `owner 2026-09-01` `feature` `ui`
- 🔴 **FIS-21 — Add-member barangay-mismatch warning + row warning icon.** At add-time, if candidate `barangay`≠head `barangay`: popup warning (still allow add); warning icon on that member's row. Barangay-string level (no coords needed). `owner 2026-09-01` `feature` `ui`
- 🔴 **FIS-22 — "Already in another household" message points to WHERE.** `household.ts` update mutation already rejects; extend to look up + return the other household's number/link in the message. One-household-per-member already structurally enforced (single FK + `headId @unique`). `owner 2026-09-01` `feature` `api`
- 🔴 **FIS-23 — Household detail ~50/50 split with barangay-level member map (right).** Wrap Details+Members in a grid; new `household-member-map.tsx` (MapLibre, reuse `CALAPAN_BARANGAY_CENTROIDS`) plots members at barangay centroids (jittered so overlaps show); king icon on Head. NO GPS — barangay-level only (owner-approved 2026-09-01). `owner 2026-09-01` `feature` `ui`
- 🔴 **FIS-24 — Household submenu: municipal interconnection map.** New nav item under Records/Household + new route; municipal outline (derive via turf union of `calapan-barangays.geojson` polygons); plot all households, king icon on Heads, Head→member connection lines (barangay-centroid level), highlight members whose barangay≠Head's ("jumped"). Nav model is flat — add sibling `NavItem`. `owner 2026-09-01` `feature` `ui`

- 🔴 **FIS-25 — Location capture (coordinate entry) — flagship-first (owner 2026-09-01).** Supersedes "barangay-level only": base maps keep barangay centroids as the DEFAULT pin, but pins become DRAGGABLE to capture an approximate real location, stored per registration. Scope: (a) Prisma migration add `latitude`/`longitude` Float? to Fisherfolk, Vessel, FishCatch, Violation, Ayuda (confirm ayuda target model) — ONE migration for all 5; (b) reusable `LocationPicker` (MapLibre draggable Marker + "Use my location" via browser Geolocation API — works on mobile browsers over HTTPS, no native app). AUTO-CENTER: selecting the barangay in the form recenters the map + drops the pin on that barangay's centroid, then encoder fine-drags to the exact spot (owner 2026-09-01). Ayuda coord stored on `AyudaBeneficiary`; (c) Zod + create/update wiring. FLAGSHIP: fully wire + polish FISHERFOLK form + detail map + household map uses real coords when present (fallback centroid). THEN wire vessels/fish-catches/violations/ayuda forms (may not all be demo-polished by tomorrow). Mobile GPS field-testing limited pre-demo. `owner 2026-09-01` `feature` `db` `ui`

### 2026-09-01 round-3 batch (owner-dumped, FULL AUTO). Also targets Production (owner-gated release).

- 🔴 **FIS-26 — Distinct color per category.** All `categories.display_color` = `#4F8EF7` (uniform); chips already honor displayColor → DATA fix: assign a distinct accessible palette per category (script `distinct-category-colors.sql`), update seed for future categories. `owner 2026-09-01` `design` `db`
- 🔴 **FIS-27 — Photo/Signature/QR enlarge is too small + not resizable.** Upgrade ZoomableImage (shared + fisherfolk-local): large dialog (~90vw/900px, max-h 80vh) + zoom in/out/reset controls. Keep API stable (household MemberAvatar uses shared). `owner 2026-09-01` `design` `ui`
- 🔴 **FIS-28 — BUG: household member map renders blank (real browser).** Container has height; municipal-network + dashboard maps work. Likely MapLibre init-before-container-sized in the grid cell + resize not recovering. Fix init/resize robustness (guard on clientHeight>0, resize on load+rAF, min-height fallback). `owner 2026-09-01` `bug` `ui`
- 🔴 **FIS-29 — Municipal Network: jumped=PINK + heatmap toggle.** Jumped-barangay members/lines/legend → pink (#EC4899). Add heatmap toggle (barangay household density largest→smallest, mirror dashboard heatmap). 4a: map uses REAL captured coords when present (already falls back to centroid; realized as FIS-30 capture is used). `owner 2026-09-01` `feature` `ui`
- 🔴 **FIS-30 — Location capture for the remaining 4 entities.** Wire LocationPicker (drag pin + barangay auto-center + mobile GPS) into Vessel, FishCatch, Violation, Ayuda(beneficiary) forms + detail + Zod (schema lat/lng already deployed). Mirrors shipped Fisherfolk pattern. `owner 2026-09-01` `feature` `ui` `db`
### 2026-09-01 NEXT-SESSION queue (owner: "do the audit finding + gaps next session"). Do in order.

- ✅ **FIS-12-RECONCILE — Reconciled (2026-09-01).** Owner chose merge/rebase → `git merge --no-ff feat/fis12-registration-status-model` (`4aa229a`); schema auto-merged, 3 migrations in order, docs union-resolved, all gates green (prisma validate · tsc · 416 tests · build). LOCAL/HARD HOLD. Residual pre-prod `[WHAT]`: backfill mapping (ACTIVE→NEW / INACTIVE→EXPIRED) needs owner sign-off before prod `migrate deploy`. `owner 2026-09-01` `chore` `db`
- 🟡 **FIS-32 — Real-browser verification pass (IN PROGRESS 2026-09-02).** Driven via chrome-devtools-mcp (real Chrome, WebGL2/SwiftShader) on dev @ v0.22.0.
  - 🔴🔧 **BUG FOUND + FIXED (local):** "Use my location" (FIS-25 mobile GPS) was **dead in ALL browsers incl. prod** — app's own `Permissions-Policy: …geolocation=()…` header disabled the Geolocation API (`getCurrentPosition` err code=1 "disabled by permissions policy"). Fix `geolocation=()`→`geolocation=(self)` in `apps/web/next.config.ts` + `apps/web/src/lib/security-headers.ts`. Branch `fix/permissions-policy-geolocation`, LOCAL/HARD HOLD. Lesson `http-headers.permissions-policy.geolocation-empty-blocks-feature`. Unblocks the "Use my location" path on ALL 5 location forms. `agent-found 2026-09-02` `bug` `security`
  - ✅ **Structural (headless-verifiable):** dashboard density map, household member map (FIS-28 resize-fix present), municipal network (pink `#EC4899` jumped + `network|heatmap` mode in source) — all MOUNT with sized canvases, **0 console errors**; CARTO style loads (attribution present). Status model correct on dev (NEW/RENEWED, 0 ACTIVE).
  - ⚠ **NOT headless-verifiable — needs real GPU browser / mobile device:** map *visual paint* (software-WebGL composites the canvas black in screenshots — an artifact, not a failure) + on-device mobile GPS. Retest "Use my location"→save→DB read-back pending the dev rebuild that applies the header fix. `owner 2026-09-01` `test`
- 🟡 **FIS-33 — a11y pass on new interactive components — AUDIT DONE (2026-09-02).** axe-core 4.11.4 (wcag2a/2aa/21/22aa) + manual keyboard/focus on real Chromium. Report: `test-artifacts/fis33-a11y-2026-09-02.md`. Result: Critical 0 · Serious 1 · Moderate 0 (axe) + 3 manual. **CLEAN (PASS):** LocationPicker (edit form), ZoomableImage dialog (focus-trap+Esc+return OK), member+network maps (controls OK). **Remediation TODO (Mark-Received dialog + shared bits):**
  1. 🔴 [Serious·2.5.8 target-size] Mark-Received dialog MapLibre zoom-in control clipped to ~2×29px in the smaller dialog map (clean on full-size edit form) → render ≥24×24 w/ spacing.
  2. 🔴 [Moderate·2.4.3] Mark-Received dialog does NOT restore focus to trigger on close (lands on `<body>`) → copy ZoomableImage's return-focus pattern.
  3. 🔴 [Moderate·2.1.1/4.1.2 — has UX-design implication] map markers (member+network) not keyboard-focusable + share generic name "Map marker" → focusable pins w/ per-pin names OR a keyboard list alternative (owner may weigh the approach).
  4. Secondary: `aria-modal="true"` on shared Dialog primitive (app-wide blast radius — care); initial dialog focus to heading not map canvas; make "No location set" an aria-live region; manual contrast check of network-map legend swatches (axe incomplete on canvas colors). `owner 2026-09-01` `a11y` `test`
- 🔴 **FIS-34 — Refresh landing showcase screenshots (real browser) + redeploy demo.** Feature the maps/location capture headless couldn't capture; overwrite `public/showcase/*.png`. `owner 2026-09-01` `design`

- 🔴 **FIS-31 — Landing page overhaul (POST-REBOOT handoff task).** After round-3 ships: brainstorm + rebuild the public landing page with the latest features, updated screenshots, better statements/context (appropriate skills: brainstorming, frontend-design/web-motion, copywriting), then run **humanize** on all captions/statements + ai-check. `owner 2026-09-01` `design` `docs`
- 🟡 **Fix ugly horizontal scrollbar on fisherfolk detail tab bar.** ✅ CODE DONE (`ccbe876`, 2026-09-01): new `.tabs-scrollbar` themed thin-scrollbar utility on shared `UnderlineTabsList` (uniform across fisherfolk-detail/id-generator/analytics/reports/todo); lint-gated build green. Visual render confirmation folded into FIS-32 real-browser pass. Original ask below:
  ~~🔴~~ On a specific fisherfolk detail page, the
  tab strip (Profile · Vessels · Violations · Ayuda · Fish Catches · Renewals · Activity · To…) shows a raw
  native horizontal scrollbar. Restyle it to match the app's current CSS/scrollbar styling (thin/themed
  overflow, not the default OS scrollbar) — likely the `UnderlineTabs`/tabs overflow container in
  `fisherfolk-detail-client.tsx`. `source: owner 2026-08-31` `bug` `ui` `design`

- 🔴 **Build `audit-log` feature (currently a 14-line stub).** `app/[tenant]/audit-log/page.tsx` has only a
  PageHeader; no table/data. Build the audit-trail view: paginated table of audit entries (adopt shared
  `DataTable` + `ListToolbar`/`ListPagination`), scoped to tenant, Viewer+ gate. Scout the existing AuditLog
  Prisma model + tRPC router first (L5 AuditLog exists per security). SCOPE `[WHAT]` to confirm: which
  columns/events, filters (actor/entity/date), retention. `agent-found 2026-08-30` `feature`
- 🔴 **Build `user-management` feature (currently a 14-line stub).** `app/[tenant]/user-management/page.tsx`
  is placeholder-only. Build the tenant user admin: table of this tenant's users + role assign/invite
  (reuse RBAC infra + `/tm` users-client pattern + role-builder). Scout the existing user/RBAC router first.
  SCOPE `[WHAT]` to confirm: which actions (invite/deactivate/role-change), permission gate (tenant_admin+),
  columns. Respect Rule 34 (never expose Billing/User-Mgmt below tenant_admin). `agent-found 2026-08-30` `feature`

### FMO meeting 2026-07-09 — registration policy + ID changes (captured 2026-08-31; all builds HARD HOLD pending owner [WHAT])

- 🔴 **FIS-8 — Multi-family households (support multiple heads per household).** ✅ **[WHAT] RESOLVED (owner
  2026-08-31):** KEEP the household grouping AND the head-of-family concept — but one household may contain
  MULTIPLE families (2–3 families living together), each with its OWN head. Current schema blocks this:
  `Household.headId` is `@unique` (exactly one head per household). Work: introduce a family sub-grouping under
  `Household` (each Family = one head + its members) OR relax the single-head constraint to allow multiple family
  units per household; update household create/edit UI + "Head of Household" reporting to list per-family heads.
  Design the multi-family-per-household model. `source: owner meeting 2026-07-09` `feature` `db` `design`

- 🔴 **FIS-9 — Rename "active violation" → "number of violations" (display).** Relabel the fisherfolk-record +
  dashboard label; today it's a boolean `hasActiveViolation` (`fisherfolk-detail-client.tsx:187`) + "Active
  Violations" dashboard tile (`violations-group-tile.tsx`) + `activeViolationCount` renewal guard
  (`fisherfolk.ts:505`). ⚠ **[WHAT]:** show a raw count instead of a badge? Keep the renewal-block semantics
  (active violation blocks renewal) unchanged? `source: owner meeting 2026-07-09` `feature` `ui`

- 🔴 **FIS-10 — Aquaculture sub-registration (subcategories + fields).** "Aquaculture" already exists as one of
  the 6 `CANONICAL_CATEGORIES` (`lib/normalize/types.ts:13`). NEW work = subcategory taxonomy + aquaculture-only
  fields: brackish (fishpond/fishpen/fishcage/fishcorral) + freshwater (backyard fishpond/fishpen/fishcage/
  fishcorral); capture land area, lease-or-owned, commodity type, culture method (poly/monoculture). Operators
  register (not non-operator landowners). ⚠ **Ordinance-gated — full implementation pending amendments (Jan);**
  build the structure now, activate later. [WHAT]: new Prisma model vs JSON extension; which fields required.
  `source: owner meeting 2026-07-09` `feature` `db`

- 🔴 **FIS-11 — Add full-time / part-time + primary source of income fields.** Not present today (no occupation/
  livelihood/income field on `Fisherfolk`). Add enum (full-time/part-time) + primary-source-of-income capture to
  the registration + edit forms, detail view, and reports. `source: owner meeting 2026-07-09` `feature` `db` `ui`

- ✅ **FIS-12 — Registration status model: NEW / RENEWED / EXPIRED + post-election bulk-expire command — BUILT 2026-08-31.**
  Built + verified (typecheck 7/7 · 586 tests · build green) on `feat/fis12-registration-status-model` (`6892e64`), LOCAL/HARD HOLD.
  Bulk-expire admin tool built but DEFERRED (do not run until next mayoral election). ⚠ Backfill mapping ACTIVE→NEW / INACTIVE→EXPIRED
  needs owner sign-off before the prod migration. `feature` `db`
  ✅ **[WHAT] RESOLVED (owner 2026-08-31).** Status meanings: **NEW** = brand-new registrant, never before in the
  DB; **RENEWED** = re-registered, only possible AFTER a Mayor's-election renewal cycle; **EXPIRED** = flagged for
  renewal. Flow: after each mayoral election an admin runs a SINGLE-SHOT command (Administrative Settings) that
  bulk-sets all current active IDs → EXPIRED; then each fisherfolk is renewed one-by-one (EXPIRED → RENEWED) as
  they complete the post-election renewal process. Build: retire ACTIVE/INACTIVE from active use (ALTER TYPE
  discipline; add EXPIRED); add the admin bulk-expire tool (permission-gated, confirm-guarded, audit-logged).
  ⚠ **DEFERRED activation** — this is year 1; the bulk-expire is NOT run until the next mayoral election. Build the
  tool now, do not execute it. `source: owner meeting 2026-07-09` `feature` `db`

- 🔴 **FIS-13 — QR scan & verification flow.** QR is ALREADY generated + printed on the ID card
  (`Fisherfolk.qrCode`, `id-card-renderer.tsx` qr element). NEW = an in-app scan/verify surface: scan a fisherfolk
  ID QR → resolve → show verification (valid/record summary). [WHAT]: public vs authed verify; camera-scan page
  vs deep-link resolver. `source: owner meeting 2026-07-09` `feature`

- ✅ **FIS-14 — RSBSA on ID card — RESOLVED, no build (owner 2026-08-31).** "RSVS" was misheard; owner confirms it
  means **RSBSA**, which the ID card already supports (`{{rsbsa_number}}`). No work needed. Squirlnote → For Review
  (owner to mark Done). `source: owner meeting 2026-07-09`

- 🔴 **FIS-15 — 3-year renewal cycle (mayoral-term aligned).** `RegistrationRenewal` + `registrationYear` exist;
  renewal is manual, no cadence enforcement. Add a 3-year renewal cadence: due-date/renewal-due computation +
  indicator. [WHAT]: reminder-only vs status enforcement; anchor year. `source: owner meeting 2026-07-09` `feature`

- ✅ **FIS-16 — Mayor read-only access — RESOLVED, no build (owner 2026-08-31 "yes").** The existing `viewer` role
  (view-only across all mapped segments) is acceptable for the mayor's read-only dashboard; no new role needed.
  Squirlnote → For Review (owner to mark Done). `source: owner meeting 2026-07-09`

> **Already covered (no task):** Senior-citizens report EXISTS (`report.ts` `senior_citizens` "60+" + analytics
> "Senior Citizens by Barangay"). Kanban/task module EXISTS (todo). QR generation EXISTS.
> **Not FRMS-code tasks (business/proposal — tracked elsewhere):** benchmark maintenance pricing vs HR system ·
> pitch slides (lead with dashboard demo) · cloud-cost justification in proposal · pricing/contract · formal
> re-registration letter to fisherfolk · "Sheila to study fish catch/dashboard" (person-assigned).
> **Parking lot (future, discussed as "potential"):** staff whereabouts/activity tracking.

- ✅ **Cargorix redesign (Waves 0–5) SHIPPED as v0.19.0 to prod + demo (2026-08-28).** Full UI adoption +
  ⌘K/density/theme-customizer. Merged `f04a03e`, released `8a7bc41` (tag v0.19.0, main==origin), promoted
  prod+demo (healthy, footer v0.19.0), dev FRESH. UI-only; axe WCAG 2.2 AA 0 new violations. (Was: "Wave 3
  gated on owner sign-off" — resolved through ship.)
## ✅ Done recently

- ✅ **FIS-3 — Cargorix Wave 5 remainder DONE + verified (2026-08-30).** Applied the shared-wrapper/
  floating-card idiom app-wide across the non-record modules (JSX/chrome only, token-only, byte-faithful):
  list chrome (`ListToolbar`/`ListPagination`) on edit-requests + `/tm` tenants/users (were zero-shared) +
  id-generator; `Card`→`FormSection`/`RecordHeader` on edit-requests review, reports hub, import wizard,
  analytics (16 cards), settings, role-builder; `UnderlineTabs` on reports/analytics/todo/id-generator;
  `PageHeader`/`EmptyState` on import/notifications/map/audit-log/user-management/todo/settings. Preserved
  intentional non-token hex (pvc-sheet print fills, theme brand swatches). Verified: tsc/lint green · 416
  tests · build green · **live axe 0 violations across 12 tenant routes, 0 console errors** (WCAG 2.2 AA).
  `/tm` not axe-swept (needs platform login) but reuses axe-proven shared chrome. Screenshots
  `screenshots/fis3/`. Branch `feat/fis3-nonrecord-module-consistency` `d51afe1`, LOCAL/HARD HOLD. (FIS-3)
  Note: audit-log + user-management are still feature STUBS (header adopted; tables not yet built).

- ✅ **FIS-4 — Cargorix Wave-5 deferred structural restyle DONE + verified (2026-08-30).** All three
  audit-found items landed (JSX/chrome only, token-clean, byte-faithful behavior): (a) new shared
  floating-card `ListToolbar` + `ListPagination` (`components/shared/list-{toolbar,pagination}.tsx`)
  applied UNIFORM across all 5 record list clients (fisherfolk, vessels, violations, ayuda, fish-catches) —
  replaces per-client hand-rolled bare toolbar + duplicated pagination; (b) fisherfolk edit form raw
  `Card`→shared `FormSection`+`RecordHeader` (all 14 fields/validation/RHF unchanged, register-form parity);
  (c) fisherfolk-detail inline underline tabs extracted to shared `UnderlineTabsList`/`UnderlineTabsTrigger`
  (`components/shared/underline-tabs.tsx`, class-for-class identical). Verified: tsc clean · lint clean ·
  **416 tests** · build green · **live axe 0 violations across 7 routes, 0 console errors** (WCAG 2.2 AA,
  Rule 33). Screenshots in `screenshots/fis4/`. Branch `feat/fis4-list-toolbar-edit-form-tabs` `2ae8d52`,
  LOCAL/HARD HOLD. (FIS-4)

- ✅ **Compacted launch-folder `MEMORY.md`** — 25.2KB→9.9KB (61% smaller), trimmed verbose per-line hooks
  to true one-liners; all 94 memory-file pointers preserved, 0 dangling links (detail stays in each linked
  topic file). Improves cold-start read cost every session. (FIS-2, 2026-08-28)
- ✅ **a11y: app-wide `aria-hidden-focus` on open Radix menu/dialog — FIXED (WCAG 2.2 AA).** Root cause:
  Radix v1 menu/dialog/popover use `aria-hidden`'s `hideOthers()` → sets `aria-hidden="true"` but NOT
  `inert`, so the hidden background subtree kept tabbable content (axe serious, SC 4.1.2). Fix = a
  once-mounted MutationObserver shim in the root layout (`components/a11y/aria-hidden-inert-shim.tsx` +
  pure `lib/a11y/aria-hidden-inert.ts`, 6 unit tests) that mirrors `inert` onto exactly the Radix-marked
  nodes and removes it on close; never touches a pre-existing app `inert`. Verified on rebuilt dev:
  dropdown + ⌘K dialog open → axe 0 (was aria-hidden-focus×1), close → inert cleaned, axe 0, menu
  interactive, 0 console errors. tsc/lint/416 tests/build green. Branch `fix/a11y-aria-hidden-inert`
  `265b215`, LOCAL/HARD HOLD. (FIS-5, 2026-08-28)

- ✅ **Cargorix Waves 0–2 integrated onto current main + verified.** New branch
  `feat/cargorix-stack-integrated` (`3b2c9d8`): merged v0.18.0 `main` into the stacked waves (4 shell files
  auto-merged w/ the tenantHref refactor, both changesets coexist), + `fix(a11y)` sidebar group-label
  contrast 4.16→AA. Gate green (tsc/lint/410 tests/build); live render clean 0 console errors; axe WCAG 2.2
  AA 0 violations/5 routes. LOCAL/HARD HOLD. (2026-08-27)

## ✅ Older

- ✅ **Server `redirect()` 308 on demo custom-domain — SHIPPED (v0.18.0).** The 12 RSC `redirect()` guard sites
  (`[tenant]/{layout,page}`, register/new pages, admin/kanban, `tm/layout`) now call the async `tenantHref()`
  helper → tenant-relative `/...` on a masked host, slug-prefixed `/{slug}/...` elsewhere. Non-masked hosts
  (dev, prod) byte-identical (invariant unit-tested). Verified tsc/lint/410-tests/build; commit `cba0295`,
  released **v0.18.0**, promoted prod + demo. (was the deferred 🟡 — now closed, 2026-08-26)
- ✅ **Host-aware in-app links — kill demo custom-domain 308-on-click.** New `src/lib/tenant-href*` helpers
  (`useTenantHref()` client hook + `tenantHref()` server helper + pure `computeTenantPrefix`/`joinTenantPath`);
  migrated ~45 nav sites (client `<Link>`/`router.push` + server `<Link>`) so links are clean on a masked
  custom-domain host and slug-prefixed `/{slug}/...` on subdirectory hosts (prod unchanged, invariant unit-tested).
  `notificationHref()`/`sourceEntityLink()` now return tenant-relative paths. Verified: tsc 0, lint clean, 410 tests
  (8 new), live dev nav sweep (22 links slug-prefixed, 0 slugless, 0 console errors). Branch
  `feat/tenant-host-aware-links` `266449b`, LOCAL/HARD HOLD. (owner-approved "central helper + migrate", 2026-08-26)
- ✅ **`/fisherfolk/new` returned 400 → now 404 (agent-found bug).** `/{tenant}/fisherfolk/new` matched the `[id]`
  route with id="new"; the tRPC `getById` `.cuid()` input rejected it as BAD_REQUEST (400). Guarded the detail + edit
  server routes with a cuid check → clean `notFound()` (404). Verified live (HTTP 404). Branch
  `fix/fisherfolk-invalid-id-404` `2ed5cb9`, LOCAL/HARD HOLD. (2026-08-26)
- ✅ **Merged `feat/import-tool-dir-arg` → main** (`--no-ff`, `a057545`); LOCAL, unpushed (HARD HOLD). (2026-08-26)

- ✅ **Backfilled the 73 FRMS-only fisherfolk into the live FMO app** (records added directly in FRMS after the
  original migration). FMO SQLite 3108→**3181** (73 INSERT OR IGNORE; 1 skipped = VILLANUEVA already present under
  its old ID); 146 images fetched from FRMS's Telegram store into FMO `uploads/`. Verified: 73/73 with
  image+signature, images HTTP 200, **FMO total now == FRMS 3181, 0 real people missing either way**. Live DB
  backed up first (`fisherfolk.sqlite.bak-pre-frms73-*`). (owner-approved, 2026-08-24)
- ✅ **Import `08-14-26` masterlist → OLD live app `fmo.powerbyte.app` too.** Old app still in use (FRMS not yet
  publicly launched), so the same 92 people were added there: SQLite `data/fisherfolk.sqlite` 3016→3108 (92
  INSERT OR IGNORE via container PHP PDO; category booleans/DOB/barangay mapped to FMO conventions) + 184 files
  into `uploads/` (6093→6277). Verified: 92/92 with image+signature, images serve HTTP 200 on the live site.
  Live DB backed up first (`fisherfolk.sqlite.bak-pre-0814masterlist-20260824-130524`). (owner-approved, 2026-08-24)
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
