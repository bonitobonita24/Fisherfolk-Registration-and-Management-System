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

## Phase C — UI (households/) — ✅ DONE (branch `feat/fis8-phase-c-interactive-ui` → merged LOCAL main `3235f67`, HARD HOLD)

> **2026-09-03 (owner "continue all pending in full auto") — interactive rewrite COMPLETE, built + verified LOCAL main.**
> The design-bearing deferred work below was built to this plan's safe defaults via PM → 5 spec-executor tasks
> (Task 1 per-family section component `98f6da9` · Task 5 multi-family wizard `624be6a` · Tasks 6+7 family-aware maps
> `4b44b9f` · Tasks 2–4 detail wiring + Add-Family + delete copy `d5c01b2`). New files `family-section.tsx`,
> `add-family-dialog.tsx`. Full bar per step + on merged main: tsc clean · 421 tests / 190 DB-skipped · build green.
> Safe defaults taken: wizard repeats head+members steps per family (1–3) with household-details as step 1; Add-Family
> = modal drawing from within-household members only; family-scoped change-head/add-member/remove via `family.update`;
> maps draw one crown per family head with per-family fallback to flat head/members. All 45 households single-family
> today → additive, zero regression. ⏳ Recommend an owner visual pass before prod promotion. Phase D (reporting/
> dashboard per-family) still pending.

### (historical) partial state — safe display slices (branch `feat/fis8-phase-c-households-ui`, superseded/shipped in v0.23.0)

### ✅ DONE (safe, unambiguous display slices — full-auto 2026-09-02, verified tsc/lint/595 tests/build)
- ✅ **Slice 1 — list family count** (`0e0176d`): `household.list` `_count.families`; new "Families" column in `columns.tsx` (`households-list-client.tsx` needed no change — types flow from the router).
- ✅ **Slice 2 — fisherfolk detail family-head badge** (`012c226`): `fisherfolk-detail-client.tsx` L540 Household field now shows the family number + "Family Head"/"Member" from `record.family` (Phase B include), falling back to household head when no family link.
- ✅ **Hardening (not strictly Phase C, closes Phase B follow-up)** (`96f47e5`): `family.create`/`update` reject pulling in the head of a DIFFERENT family as a member (orphan guard); +1 regression test (8→9). Non-head moves stay allowed. Global lesson `prisma…orphans-source-head` → fixed.

### ⏳ DEFERRED — design-bearing interactive rewrite (owner review recommended; NOT built full-auto)
Rationale: all 45 households are currently single-family (Phase A backfill), so per-family sectioning/creation is a visual no-op until multi-family households can be **created** — and the creation UX is the design-bearing part. Deferred rather than rammed through unreviewed while owner asleep. Precise scope for the next (reviewed) session:
- `household-wizard.tsx` (425L) — allow 1-3 families, each own head + member picker (repeat head/members steps per family). **UX flow is a design decision** — confirm the step shape with owner before build. Calls `family.create` after `household.create` seeds F-01.
- `[id]/household-detail-client.tsx` (811L) — section per family (head block + members + ChangeHeadDialog + AddMember **scoped to family**, using `family.update`); "Add Family" button (→ `family.create` picker); delete warns across families. Currently renders the flat household-level head+members (back-compat, not broken). Decompose by section (>500L → split: (a) Add-Family dialog + family.create wiring, (b) per-family sections replacing the single Members card, (c) delete-warning copy).
- `[id]/household-member-map.tsx` (317L) + `network/municipal-network-map.tsx` (649L) — iterate `record.families` (one crown per family head; member lines grouped per family). Mechanical data-mapping once multi-family data exists; visually a no-op until then.

### Not-yet-done small item
- `households-list-client.tsx` — no change needed (covered by slice 1).

## Phase D — reporting/dashboard
- `report/domain-charts.ts` L156-179 — size per family (`family._count.members + 1`); household size = sum of families; "Household Head by Sex" iterates family heads.
- `report/domain-columns.ts` L106 "Head of Household" → "Head of Family" / per-family rows. `where-builders.ts`, `report-hub-config.ts`, `reports-client.tsx`.
- `dashboard.ts` getHouseholdStats L641-667 — iterate family heads for category counts.
- Seeds: `apps/web/scripts/seed-demo.ts` (L183-388), `packages/db/prisma/seed.ts`, demo-calapan — create Family rows + multi-family fixtures.

## Follow-up hardening (later)
Once every fisherfolk has family_id, make it required and DROP `Household.headId` + its unique index (a later migration).
