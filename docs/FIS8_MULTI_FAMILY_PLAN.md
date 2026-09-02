# FIS-8 — Multiple Families per Household · phased plan

Owner decision (2026-08-31): one Household contains multiple Families; each Family = one head + its members.
Approach = **add a `Family` model** (NOT merely relax `Household.headId @unique`), fully additive.

## Phase A — schema foundation ✅ DONE (branch `feat/fis8-multi-family-household-schema`, `7261dda`, LOCAL/HARD HOLD)
- `Family` model (id, tenantId, householdId, familyNumber, headId @unique, notes, timestamps; relations head/members/household/tenant).
- `Fisherfolk.familyId` + `family` (FamilyMembers) + `headOfFamily` (FamilyHead) + `@@index([tenantId, familyId])`.
- `Household.families Family[]` + `Tenant.families Family[]`. **Household.headId/head/members KEPT** (back-compat).
- Migration `20260902160000_add_family_model`: create table + fisherfolk.family_id + FKs + backfill (one single-family Family per existing household; 45→45, 142 members linked). Applied to dev, tsc/lint/416 tests green.
- ⚠ Migrations: `migrate dev` is broken (shadow-DB drift) — author via `migrate diff --from-url $DEV --to-schema-datamodel --script`, strip unrelated drift, `db execute` + `migrate resolve --applied`. See global lesson `prisma.dev-ledger-drift`.

## Phase B — family-aware server/router (NEXT, un-gated)
- `apps/web/src/server/trpc/routers/household.ts` (largest): `create` creates Household + first Family atomically; add family procedures (`addFamily`/`updateFamily`/`setFamilyHead`/`removeFamily`) or a new `family` router mounted in `root.ts` (L14-15/L42-43). `getById` include `families { head, members }`. Membership validation moves householdId→familyId. `newHeadId` (must-be-current-member) → per family.
- `household-network.ts` — return `families` in the graph.
- `fisherfolk.ts` L149 include; `ayuda.ts` L331 include + per-household distribution (decide HOUSEHOLD vs per-FAMILY unit; AyudaBeneficiary may need familyId).
- Tests: `household.test.ts` (L170-209), `report.domain.test.ts` (L67/L217), `ayuda.test.ts` (L57).

## Phase C — UI (households/)
- `household-wizard.tsx` — allow 1-3 families, each own head + member picker (repeat head/members steps per family).
- `[id]/household-detail-client.tsx` — section per family (head block + members + ChangeHeadDialog + AddMember scoped to family); "Add Family"; delete warns across families.
- `[id]/household-member-map.tsx` + `network/municipal-network-map.tsx` — iterate families (one crown per family head; member lines grouped per family).
- `columns.tsx`, `households-list-client.tsx` — family count.
- `fisherfolk/[id]/fisherfolk-detail-client.tsx` L540 — "Head of Family" vs family head.

## Phase D — reporting/dashboard
- `report/domain-charts.ts` L156-179 — size per family (`family._count.members + 1`); household size = sum of families; "Household Head by Sex" iterates family heads.
- `report/domain-columns.ts` L106 "Head of Household" → "Head of Family" / per-family rows. `where-builders.ts`, `report-hub-config.ts`, `reports-client.tsx`.
- `dashboard.ts` getHouseholdStats L641-667 — iterate family heads for category counts.
- Seeds: `apps/web/scripts/seed-demo.ts` (L183-388), `packages/db/prisma/seed.ts`, demo-calapan — create Family rows + multi-family fixtures.

## Follow-up hardening (later)
Once every fisherfolk has family_id, make it required and DROP `Household.headId` + its unique index (a later migration).
