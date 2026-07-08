# Household Management — Design Spec

**Date:** 2026-07-08
**Status:** Approved (owner)
**Type:** Phase 7 Feature Update (FRMS — Fisherfolk Registration & Management System)

## Problem / Goal

A family/house may contain multiple registered fisherfolk. The FMO needs to know
**who is the head of each family**, **count how many households (families) per
municipality and/or per category**, and **distribute some ayuda per household
(not per individual)**. Today `Fisherfolk` records are independent — there is no
household concept.

## Decisions (locked with owner 2026-07-08)

1. **Explicit `Household` record** (not tag-on-fisherfolk, not auto-grouped).
2. Household **category = the HEAD's category** for the "per category" counts.
3. Ayuda gains a **program-level distribution unit** (`Per fisherfolk` | `Per household`).
4. **No backfill** of existing 3006 fisherfolk — they start unassigned; encoders build
   households via a wizard. Dummy households are seeded in **dev + demo only** (guarded),
   never staging/production (per `docs/DATA_SEEDING_POLICY.md`).

## Data model

### New model: `Household`
| Field | Type | Notes |
|-------|------|-------|
| `id` | String cuid | PK |
| `tenantId` | String | tenant scope |
| `householdNumber` | String | auto sequential `HH-0001`, **unique per tenant** |
| `headId` | String | FK → Fisherfolk, **unique** (a fisherfolk heads ≤ 1 household) |
| `barangay` | String | defaulted from head, editable |
| `address` | String | defaulted from head, editable |
| `notes` | String? | optional |
| `createdById` / timestamps | | encoder attribution |

Relations: `head` → Fisherfolk (`HouseholdHead`); `members` → Fisherfolk[] (via
`Fisherfolk.householdId`). Indexes: `@@index([tenantId])`, `@@unique([tenantId, householdNumber])`.

### `Fisherfolk` (add)
- `householdId String?` → FK → Household (`HouseholdMembers`). **A fisherfolk belongs to
  at most one household.** The head also carries `householdId` = their own household (the
  head IS a member). `@@index([tenantId, householdId])`.

### `AyudaProgram` (add)
- `distributionUnit AyudaDistributionUnit @default(FISHERFOLK)` — new enum `{ FISHERFOLK, HOUSEHOLD }`.

### `AyudaBeneficiary` (add)
- `householdId String?` → FK → Household (nullable; set for HOUSEHOLD-unit programs so
  "households that received program X" is a direct query). For HOUSEHOLD programs the
  `fisherfolkId` recorded is the **head**; the existing `@@unique([programId, fisherfolkId])`
  already blocks giving the same household (its head) the program twice.

**Head = member invariant:** `Household.headId` must be one of the household's members
(i.e. that fisherfolk's `householdId == household.id`).

## Behavior / validation

- Household number auto-generated, sequential, unique per tenant.
- A fisherfolk cannot be added to a second household without being removed from the first
  (the picker excludes anyone already assigned).
- Exactly one head per household; changing the head picks another current member.
- Deleting a household **unlinks** members (`householdId → null`) — never deletes fisherfolk.
- A HOUSEHOLD-unit ayuda program's beneficiary picker lists households (one row each, showing
  the head) and records the head (+ `householdId`) as the beneficiary; re-adding the same
  household is blocked.

## UI / UX

- **New RECORDS nav item "Household"** → `/[tenant]/households`.
- **List page**: household no., head name, member count, barangay, head's category; search + filter.
- **Create wizard** (the owner's flow):
  1. Search & select the **head** (fisherfolk search).
  2. Search & add **members** (excludes anyone already in a household); repeat.
  3. **Confirmation/review** page (head + members + defaults).
  4. Save.
- **Detail page**: head + members; add/remove members, change head, edit barangay/address/notes, delete.
- **Fisherfolk detail**: show household membership badge (Head / Member + household no. link).
- **Ayuda create/edit**: `Distribution` selector (Per fisherfolk / Per household). The
  beneficiary picker adapts: households (per-household) vs fisherfolk (per-fisherfolk).

## Counting / reports

- **Households per municipality**: group households by `barangay` (municipality = tenant/Calapan;
  barangay is the sub-unit shown on the dashboard barangay density + reports).
- **Households per category**: group by the **head's** `categoryIds`.
- Surface on the dashboard (a households tile/chart) and in the reports generator.

## Seeding / migration

- **Migration**: create `households` table + enum + the `household_id` / `distribution_unit`
  / beneficiary `household_id` columns. Non-destructive; existing rows unaffected (all
  `householdId` = NULL, all programs default `FISHERFOLK`).
- **Dummy seed (dev + demo only)**: extend `seed-demo.ts` (already `ALLOW_DEMO_SEED`-guarded)
  to group some demo fisherfolk into a handful of households (marked demo), and add one
  `Per household` demo ayuda program. Staging/production get none.

## Permissions

Mirror the existing `Fisherfolk` guards: encoder+ create/edit households; viewer read-only;
same tenant isolation (L3/L5/L6). Ayuda distribution-unit follows existing ayuda permissions.

## Out of scope (YAGNI)

- Relationship-to-head field (spouse/child/etc.) — not requested; can be added later.
- Auto-grouping heuristics; cross-household transfers history; household-level documents.

## Verification

- Migration applies cleanly (dev); typecheck/lint/build green.
- Wizard end-to-end (create household, head + members, confirm, save) — browser-QA.
- Counts: households per barangay + per (head) category match seeded demo data.
- Ayuda per-household program lists households, records head, blocks duplicates.
- WCAG 2.2 AA on new pages (gov hard gate). Dummy households present in dev/demo, absent in a
  simulated staging seed.
