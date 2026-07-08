# Ayuda Beneficiary Mass-Selection Multi-Filter — Design

**Date:** 2026-07-09
**Branch:** `feat/household-management` (batch continues on this branch; HARD HOLD — local only)
**Milestone:** M1 of the 2026-07-09 overnight feature batch
**Author:** Claude Code (Full Auto Mode, owner asleep — `[WHAT]` already specified by owner in task list; this doc records the `[HOW]`)

## Problem

Adding beneficiaries to an Ayuda program is currently **one fisherfolk (or one household) at a time** via a
type-ahead search box (`AddBeneficiaryDialog` in `ayuda-detail-client.tsx`, calling the single
`ayuda.addBeneficiary` mutation). For a real distribution covering hundreds of beneficiaries in a barangay or
category, this is unusable. FMO staff need to **bulk-select** beneficiaries by mixing and matching filters, add
everyone who matches in one action, remove filtered subsets, and still add/remove individuals manually.

## Requirements (from owner task list, feature 1)

Mass-selection with **mix-and-match multi-filtering** across any combination of these facets:

| Facet | Source field | Match semantics |
|---|---|---|
| a. Barangay | `Fisherfolk.barangay` (String) | multi-select → `barangay IN (…)` |
| b. Household | `Fisherfolk.householdId` | multi-select → `householdId IN (…)` |
| c. Category | `Fisherfolk.categoryIds` (String[]) | multi-select → `categoryIds hasSome (…)` |
| d. Age (range) | derived from `Fisherfolk.dateOfBirth` | `ageMin`/`ageMax` → `dateOfBirth` between bounds |
| e. Registration status (new/renewed) | `Fisherfolk.status` (`FisherfolkStatus`) | multi-select → `status IN (…)` |
| f. Vessel owner (is / isn't) | `Fisherfolk.vessels` (m2m) | `vessels { some: {} }` / `vessels { none: {} }` |
| g. Vessel type | `Vessel.vesselType` (String) | `vessels { some: { vesselType IN (…) } }` |

- **AND across facets, OR (multi-value) within a facet.** Empty facet = no constraint.
- **"Add ALL that match the current filter"** in one action; also **add the currently-selected subset**.
- **Remove** filtered subsets in bulk; also manual individual add/remove (existing single flow stays).
- Respects the program's **`distributionUnit`** (`FISHERFOLK` | `HOUSEHOLD`). See "Distribution-unit behavior" below.
- Tenant-scoped throughout; admin-only mutations (mirror existing `adminProcedure` guards).

## Distribution-unit behavior (locked `[HOW]`)

- **FISHERFOLK programs:** the filter operates on and selects **fisherfolk**. Matched fisherfolk are the
  beneficiaries.
- **HOUSEHOLD programs:** the filter operates on the household **HEAD's** attributes (consistent with the
  household feature's "household category = head's category" decision, per `project_household_build_0708`).
  A household matches when its head fisherfolk matches the facets. The beneficiary recorded is the head — exactly
  what the existing single `addBeneficiary` HOUSEHOLD path already does. The bulk UI in household mode lists
  **households** (by number + head name + barangay); FISHERFOLK mode lists **fisherfolk**.
  - Rationale: reuses the same facet set with one code path (filter fisherfolk, project to head in household
    mode), keeps beneficiary semantics identical to today's single-add, and honours the `@@unique` collapse on
    head `fisherfolkId`.

## Architecture

### Backend (`apps/web/src/server/trpc/routers/ayuda.ts` + shared schema)

Reuse the `fisherfolk.list` WHERE-builder pattern. Add:

1. **`ayuda.filterFacetOptions`** — `protectedProcedure query`, input `{ }` (tenant from ctx). Returns the option
   lists the filter UI needs, all tenant-scoped:
   - `barangays: string[]` — distinct non-empty `Fisherfolk.barangay`.
   - `categories: { id: string; name: string }[]` — active `Category` rows (id + name).
   - `vesselTypes: string[]` — distinct non-empty `Vessel.vesselType`.
   - `statuses` — the static `FisherfolkStatus` enum values (returned for convenience / labels).
   (Households use the existing `household.list` for their multiselect — no new option query needed.)

2. **`ayuda.searchEligibleBeneficiaries`** — `protectedProcedure query`. Input:
   ```ts
   {
     programId: string (cuid),
     filter: {
       barangays?: string[],
       householdIds?: string[],
       categoryIds?: string[],
       ageMin?: number (0..150), ageMax?: number (0..150),
       statuses?: FisherfolkStatus[],
       vesselOwner?: "yes" | "no",          // f — tri-state; omitted = any
       vesselTypes?: string[],               // g
     },
     page?: number, limit?: number (default 25, max 100),
     onlyEligible?: boolean (default true),  // exclude already-enrolled
   }
   ```
   Behavior:
   - Builds a `Fisherfolk` WHERE from the facets (AND across, `in`/`hasSome`/`some`/`none` within). Age range →
     `dateOfBirth` bounds computed from a single "today" value (`ageMax` → earliest DOB, `ageMin` → latest DOB;
     inclusive). `vesselOwner:"yes"` → `vessels: { some: {} }`; `"no"` → `vessels: { none: {} }`.
     `vesselTypes` → `vessels: { some: { vesselType: { in } } }` (and implies owner).
   - **FISHERFOLK mode:** returns paginated fisherfolk `{ id, fullName, idNumber, barangay, status, age,
     categoryIds, isVesselOwner, alreadyEnrolled }` + `total` + `matchingIds` (see below).
   - **HOUSEHOLD mode:** the fisherfolk WHERE is applied to household **heads** (`headOf` is set on the head).
     Returns paginated households `{ householdId, householdNumber, headId, headName, barangay, memberCount,
     alreadyEnrolled }` + `total`. Dedup/`alreadyEnrolled` computed on head `fisherfolkId`.
   - `alreadyEnrolled` = an `AyudaBeneficiary` already exists for `(programId, fisherfolkId)` (head id in HH mode).
     When `onlyEligible` is true (default) these are filtered OUT of the result set and the counts; when false they
     are returned flagged (for display). The **"Add all matching"** action always operates on the eligible set.
   - **`matchingIds`** (returned regardless of page): the full list of eligible target ids (fisherfolkIds in
     FISHERFOLK mode, householdIds in HOUSEHOLD mode) for the current filter — this powers "Add ALL matching"
     without paging the client through every row. Capped at a sane max (e.g. 5000) with a `matchingTruncated`
     flag; the FMO dataset is ~3000 so this is comfortable.

3. **`ayuda.addBeneficiaries`** — `adminProcedure mutation` (plural bulk add). Input
   `{ programId, fisherfolkIds?: string[], householdIds?: string[] }` (one of the two, per mode; each ≤ 5000).
   - Requires `program.status === "ACTIVE"` (mirror single-add).
   - HOUSEHOLD mode: load the given households, map each to `head.id`, dedup.
   - Compute the set already enrolled `(programId, fisherfolkId)`; **skip** those (no error).
   - Single `$transaction`: `createMany` the new `AyudaBeneficiary` rows (`skipDuplicates: true` as belt-and-suspenders
     against the `@@unique`), then increment `program.beneficiaryCount` by the number actually inserted. One audit-log
     entry summarising the bulk add.
   - Returns `{ added: number, skipped: number }`.

4. **`ayuda.removeBeneficiaries`** — `adminProcedure mutation` (bulk remove). Input
   `{ programId, beneficiaryIds: string[] }` (AyudaBeneficiary ids; ≤ 5000).
   - **Only removes `verificationStatus === "PENDING"`** rows (never deletes a `RECEIVED`/confirmed distribution —
     destructive-safety `[HOW]` decision). Rows that are RECEIVED/CANCELLED are skipped.
   - Single `$transaction`: `deleteMany` the eligible ids (scoped to `programId` + tenant + PENDING), decrement
     `program.beneficiaryCount` by the number deleted. Audit-log entry.
   - Returns `{ removed: number, skipped: number }`.

Shared Zod: add a `ayudaBeneficiaryFilterSchema` in `packages/shared/src/schemas/ayuda.ts` (single source for the
facet shape, imported by the router and the client). Note the existing shared ayuda schemas are stale vs the router;
only ADD the new filter schema, don't try to reconcile the rest in this milestone.

### Frontend (`apps/web/src/app/[tenant]/ayuda/[id]/…`)

1. **`BulkFilterDialog`** (new component, own file) — opened by a "Filter & Bulk Add" button next to the existing
   "Add Beneficiary" (both gated on `canManage && status === "ACTIVE"`). Contents:
   - **Filter panel** (facets a–g). Multi-selects rendered with shadcn primitives already in the codebase
     (checkbox lists in a `Popover`/`DropdownMenu`, or a compact multi-select) — barangay, category, household,
     status, vessel-type as multi-select; age as two number `Input`s (min/max); vessel-owner as a tri-state
     (Any / Owner / Non-owner) segmented control or `Select`. A "Clear filters" action.
   - **Live results table** (debounced query to `searchEligibleBeneficiaries`, paginated) with a header row
     showing **"N matching"** (eligible total). Per-row checkbox; a header "select all on page" checkbox.
   - Actions: **"Add all N matching"** (uses `matchingIds`) and **"Add selected"** (checked rows). On success,
     toast `{added} added, {skipped} skipped`, invalidate the beneficiaries query, keep the dialog open so staff can
     adjust the filter and continue.
   - Mode-aware: renders fisherfolk columns or household columns based on `program.distributionUnit`.

2. **Bulk remove on the enrolled `BeneficiariesTable`**: add a per-row checkbox + header select-all + a
   **"Remove selected"** button (gated `canManage`). Calls `removeBeneficiaries`; toast + invalidate. RECEIVED rows'
   checkboxes are disabled (can't bulk-remove a confirmed distribution) with a tooltip.

3. Keep the existing single `AddBeneficiaryDialog` and per-row Verify dropdown unchanged (manual individual add +
   verification path).

### WCAG (gov hard gate)

New dialog + controls must pass **axe WCAG 2.2 AA = 0 violations**: labelled filter controls, checkboxes with
accessible names, focus management in the dialog, `aria-pressed`/`role=group` on the tri-state, no reliance on colour
alone for the "already enrolled" state (use text/badge). Mirror the a11y patterns from the household wizard and ToDo
filter (both already pass axe).

## Data flow

```
FMO staff opens program detail
  → clicks "Filter & Bulk Add"
  → BulkFilterDialog loads filterFacetOptions (barangays/categories/vesselTypes)
  → staff sets facets → debounced searchEligibleBeneficiaries(programId, filter)
  → table shows eligible matches + "N matching"
  → "Add all N matching"  → addBeneficiaries(programId, {fisherfolkIds|householdIds}=matchingIds)
     or "Add selected"     → addBeneficiaries(…checked ids)
  → tx: createMany (skipDuplicates) + beneficiaryCount += inserted + audit log
  → toast {added}/{skipped}; beneficiaries table refetched
Bulk remove: staff checks PENDING rows on the enrolled table → "Remove selected"
  → removeBeneficiaries(programId, beneficiaryIds) → deleteMany PENDING + count -= deleted + audit
```

## Error handling

- Non-ACTIVE program → `BAD_REQUEST` (both bulk mutations), matching single-add.
- Empty id list → no-op success `{added:0,skipped:0}` (don't error).
- `matchingTruncated` (>5000) → UI shows a notice that "Add all" covers the first 5000; FMO dataset (~3000) never
  hits this.
- Wrong-mode ids (e.g. householdIds on a FISHERFOLK program) → `BAD_REQUEST` with a clear message.
- Tenant guard on every procedure (mirror existing `if (!ctx.tenantId) throw FORBIDDEN`).

## Testing (DB-gated, mirror `ayuda.test.ts`)

- FISHERFOLK program: seed fisherfolk across 2 barangays / 2 categories / with & without vessels / varied
  DOB & status → assert each facet filters correctly, AND-combination narrows, `alreadyEnrolled` excluded when
  `onlyEligible`, `matchingIds` correct.
- `addBeneficiaries`: bulk add N, re-add same set → all skipped, `beneficiaryCount` increments by inserted only.
- `removeBeneficiaries`: PENDING removed + count decremented; RECEIVED skipped (not deleted).
- HOUSEHOLD program: facets applied to head; households returned; head recorded as beneficiary; dedup on head id.

## Scope / YAGNI

- **In:** the 7 facets, bulk add (selected + all-matching), bulk remove (PENDING only), facet options query,
  mode-aware UI, tests, axe pass.
- **Out (not now):** persisting the filter into `AyudaProgram.filters` Json (nice-to-have, deferred — log as a
  follow-up, not a blocker), saved/named filter presets, CSV export of the matched set (feature 4's Report hub will
  cover exports), editing `distributionUnit` after create (no edit-program form exists — pre-existing limitation).

## Files

- `packages/shared/src/schemas/ayuda.ts` — ADD `ayudaBeneficiaryFilterSchema`.
- `apps/web/src/server/trpc/routers/ayuda.ts` — ADD 4 procedures.
- `apps/web/src/server/trpc/routers/ayuda.test.ts` — ADD bulk/filter tests.
- `apps/web/src/app/[tenant]/ayuda/[id]/bulk-filter-dialog.tsx` — NEW component.
- `apps/web/src/app/[tenant]/ayuda/[id]/ayuda-detail-client.tsx` — wire bulk-add button + bulk-remove on table.
- (maybe) a small multi-select helper component if none exists — reuse existing primitives first.

~5–6 files. Fits one milestone / one SAFE-zone session split into ~5 spec-executor tasks.
</content>
</invoke>
