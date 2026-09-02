# FIS-8 — Multiple Families per Household · phased plan

Owner decision (2026-08-31): one Household contains multiple Families; each Family = one head + its members.
Approach = **add a `Family` model** (NOT merely relax `Household.headId @unique`), fully additive.

## Phase A — schema foundation ✅ DONE (branch `feat/fis8-multi-family-household-schema`, `7261dda`, LOCAL/HARD HOLD)
- `Family` model (id, tenantId, householdId, familyNumber, headId @unique, notes, timestamps; relations head/members/household/tenant).
- `Fisherfolk.familyId` + `family` (FamilyMembers) + `headOfFamily` (FamilyHead) + `@@index([tenantId, familyId])`.
- `Household.families Family[]` + `Tenant.families Family[]`. **Household.headId/head/members KEPT** (back-compat).
- Migration `20260902160000_add_family_model`: create table + fisherfolk.family_id + FKs + backfill (one single-family Family per existing household; 45→45, 142 members linked). Applied to dev, tsc/lint/416 tests green.
- ⚠ Migrations: `migrate dev` is broken (shadow-DB drift) — author via `migrate diff --from-url $DEV --to-schema-datamodel --script`, strip unrelated drift, `db execute` + `migrate resolve --applied`. See global lesson `prisma.dev-ledger-drift`.

## Phase B — family-aware server/router ✅ DONE (branch `feat/fis8-phase-b-family-router`, `b280f59`, LOCAL/HARD HOLD)
- NEW `apps/web/src/server/trpc/routers/family.ts` router (`create`/`update`/`remove`), mounted `family:` in `root.ts`. Mirrors the household idiom (protectedProcedure + inline tenant guard, P2002 retry, per-household `F-##` auto-numbering — count scoped `{ householdId }`, NOT tenant). Invariant enforced: a family's head + members share the same parent `householdId`; head-removal guarded; `newHeadId` must be a current family member.
- `household.ts`: `create` now seeds one initial family **F-01** (head + all initial members) in the same transaction; `getById` includes `families { head, members }`; `update` clears `familyId` when a member is removed from the household.
- `household-network.ts` returns `families` in the graph; `fisherfolk.ts` detail adds a parallel `family { id, familyNumber, headId }` include.
- Verified: full suite **594 tests** (8 new `family.test.ts` integration tests run vs real dev DB, self-cleaning `fam-test-a-*` tenant), tsc 7/7, lint clean.
- ⚠ **DEFERRED [WHAT] → PENDING_DECISIONS.md — ayuda distribution grain:** `AyudaBeneficiary` has NO `familyId` and `ayuda.ts` per-household distribution is LEFT UNCHANGED (per-FAMILY vs per-HOUSEHOLD is an owner call; also avoids a schema migration in Phase B).
- ⚠ **Known hardening follow-up:** `family.update.addMemberIds` can move an existing family's head into another family as a member, orphaning the old head pointer (`headId @unique` blocks head-of-two, not this). Phase-C/UI guard. Logged: LESSONS_GLOBAL `prisma.data-model.unique-head-fk-plus-member-fk-orphans-source-head`.
- Report/dashboard test updates (`report.domain.test.ts`, `ayuda.test.ts`) belong to Phase D — untouched here; existing suites stay green.

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
