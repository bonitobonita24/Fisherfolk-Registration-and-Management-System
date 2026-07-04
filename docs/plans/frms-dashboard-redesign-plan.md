# FRMS Dashboard Redesign — Implementation Plan (SET 2)

Owner-directed 2026-07-04; PM+Architect co-planned 2026-07-05. Builds ON the AdminCN reskin
(branch `swarm/admincn-reskin`, dev-only). Run as a **SEQUENTIAL** swarm wave (parallel_group null —
no two sessions after S1 are proven file-disjoint; S3/S4/S5 all edit dashboard-client.tsx). All merges
owner-gated. Gov/LGU → WCAG 2.2 AA is a HARD GATE (S6 must return green). Rule 1: NEVER edit PRODUCT.md.

## Key grounding (already exists — de-risks item 8)
- `RegistrationRenewal` model (schema.prisma:689) — per-year renewal audit, `@@unique([fisherfolkId, renewalYear])`. Already used.
- `fisherfolk.renew` mutation (routers/fisherfolk.ts:450-504, encoderProcedure) — per-record; sets status RENEWED + writes RegistrationRenewal + AuditLog. **Missing an `existing.status==="INACTIVE"` guard.**
- `Tenant.currentRegistrationYear` (schema.prisma:180) — admin-settable; the natural anchor for the annual reset. **No cron infra exists in repo.**
- `Category` is a real per-tenant Prisma model (schema.prisma:441); `Fisherfolk.categoryIds String[]`. Breakdowns computed via `cats.map(c => count({categoryIds:{has:c.id}}))`.
- `Vessel` has NO category relation and only `ACTIVE|IMPOUNDED|INACTIVE` (no NEW/RENEWED). → D3 gap.
- dashboard.ts procedures: getStats, getFisherfolkByBarangay, getDemographics, getAgeGroups, getCategoryByBarangay, getBarangayDensity, getRecentActivity.
- dashboard-client.tsx (541 lines): KPI strip (6-across) · row2 map(2/3)+status card · rows3-5 five charts · row6 data-completeness.

## Sessions (strictly sequential S1→S6)

**S1 — Schema/index (Prisma).** Owns schema.prisma + new migration. Add `@@index([tenantId, status, registrationYear])` to Fisherfolk. NO enum changes. Do NOT add Vessel.categoryIds (D3 default). Verify: migrate + generate + typecheck green.

**S2 — Backend (tRPC).** Owns dashboard.ts, fisherfolk.ts (renew only), new server/lib/registration-lifecycle.ts + tests. Depends S1.
- Add admin-triggered bulk annual-reset mutation: updateMany status {in:[ACTIVE,RENEWED]}→INACTIVE where registrationYear < currentRegistrationYear (idempotent; runs when super-admin advances the year). Reuse one helper so a future cron can call the same path.
- Guard `fisherfolk.renew` → throw PRECONDITION_FAILED unless status==="INACTIVE" (keep active-violation + double-renewal blocks).
- getStats: add newFisherfolk (status NEW), renewedFisherfolk (status RENEWED); REMOVE totalUsers + pendingEditRequests (item 6; sole consumer is dashboard-client).
- Add getFisherfolkCategoryBreakdown(registrationType: ALL|NEW|RENEWED) + getVesselCategoryBreakdown (groupBy vesselType, D3 default).
- Add optional `year` param (default currentRegistrationYear) — wired but single-value for now (item 2).
- Skills: test-driven-development (renew-guard failing test first), context7 (Prisma updateMany/groupBy). Verify: existing renew tests pass + new guard test throws; new procedures shaped right; typecheck+test green.

**S3 — Top section UI.** Owns dashboard-client.tsx top section + new year-select.tsx. Depends S2.
- Delete 6-tile KPI strip (items 1+6). Row2 grid → lg:grid-cols-4, map lg:col-span-3 (75%), right col-span-1 stack with `{/* S4: group tiles */}` placeholder.
- YearSelect (shadcn Select, single = current year, `aria-label="Registration year"`), wired to `year` param. Skills: shadcn, accessibility. Verify: map ~75%, no KPI strip, year select keyboard-operable + accessible name.

**S4 — Group tiles.** Owns NEW files fisherfolk-group-tile.tsx, vessel-group-tile.tsx, violations-group-tile.tsx (+ registration-type-select), and the right-col placeholder in dashboard-client.tsx. Depends S2+S3.
- FisherfolkGroupTile: big number (D1 default = ACTIVE+RENEWED+NEW); "vs last year" slot renders placeholder text (NO fabricated %); internal vertical Recharts BarChart per category (reuse Age-Group chart pattern); small "N NEW · M RENEWED" fraction.
- VesselGroupTile: same shape from getVesselCategoryBreakdown; omit NEW/RENEWED fraction (D3).
- ViolationsGroupTile: big number = stats.activeViolations (no chart required).
- Registration-type filter (ALL|NEW|RENEWED, `aria-label="Filter by registration type"`) drives the fisherfolk breakdown query.
- Skills: shadcn+Recharts (context7), accessibility-agents (reuse fixed --chart-1..5 tokens; NO new raw hex), TDD for formatters. Verify: real data, no fake comparison, filter changes chart, all controls have accessible names.

**S5 — Lower charts → 3 tiles.** Owns dashboard-client.tsx rows3-5. Depends S4 (same file, sequential to avoid conflict). Reflow the 5 existing charts into exactly 3 Card tiles (default grouping per D6): barangay+status · gender+age · category+category-by-barangay (keep bgyFilter + getCategoryByBarangay). NO chart/data removed. Verify: all 5 charts present in 3 groupings, less scroll.

**S6 — QA/WCAG gate.** Read-only audit + targeted fixes; logs to DECISIONS_LOG only. Depends S2-S5. Full typecheck+lint+build; axe WCAG 2.2 AA on year-select, registration-type-select, 3 group tiles; verify new/reused chart colors for 3:1 non-text contrast. Fix in-session, do not defer. Verify: clean gates + zero WCAG violations on new surfaces.

## Item-8 recommendation
Annual reset = admin-triggered bulk updateMany (auditable, human authority, no cron risk on a gov app);
build the bulk-update helper now, treat "also cron-triggered" as fast-follow reusing the same path.
Renewal stays per-record (fisherfolk.renew) + the missing INACTIVE guard. Bulk-renew = future (D4).

## Owner [WHAT] decisions (defaults applied, non-blocking) — see DECISIONS_LOG
D1 active-headline def · D2 reset trigger authority · D3 vessel category + NEW/RENEWED · D4 renewal per-record vs bulk · D5 ARCHIVED vs INACTIVE · D6 lower-chart grouping.
