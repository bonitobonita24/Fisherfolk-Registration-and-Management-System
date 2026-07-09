# M2 — Fish Catch Activity — Build Plan (plan-first-dispatch)

Consumes `2026-07-09-fish-catch-research.md` (BFAR/NSAP data model). PM co-planned with a Plan agent
that mapped existing record-feature conventions (Vessel/Violation mirrors). Branch:
`feat/household-management` (continue; batch stays on it per PROGRESS LOG).

## PM [HOW] locks (technical, mine to decide — Full Auto)
- Two entities: `FishCatch` (landing/trip/effort header) + `FishCatchSpecies` (composition lines,
  `onDelete: Cascade`). `FishCatch` → one `Fisherfolk` (required FK), optional `Vessel`, optional
  fishing-ground `Barangay`. Tenant-scoped (Rule 7), snake_case @map, cuid, audit-actor FKs, timestamps.
- `referenceNo` = `FC-YYYY-NNNN`, auto-gen server-side, `@@unique([tenantId, referenceNo])` (copy
  Fisherfolk `generateIdNumber` at routers/fisherfolk.ts:256-277).
- Enums: `GearType` (17 PH municipal gears, §c), `CatchDisposition` (7), `FishCatchSource`
  (FMO_ENUMERATOR/SELF_REPORT/NSAP_SAMPLING/IMPORT).
- **No Species master table / Settings CRUD in M2** — free-text `commonName` (req) + `scientificName`
  (opt); seeded common-species constant → datalist suggestion only. Species master = deferred follow-up.
- No status enum. CPUE NOT stored — computed at query (M3 reports). M2 = CRUD + UI + fisherfolk grid.
- Zod: header schema + repeatable species field-array; `superRefine` warns/enforces
  `totalCatchKg ≈ Σ species.weightKg` (auto-sum on form; tolerate 0.01 rounding).
- Non-destructive hand-authored additive migration dir (dev DB drift — NEVER `migrate dev`/`reset`).

## Task graph (dep-ordered)
- **T1 (foundation, FIRST, blocking):** schema.prisma models+enums+back-relations (Fisherfolk/Vessel/
  Barangay/Tenant/User) + hand-written additive migration.sql + apply to dev DB + `prisma generate` +
  `packages/shared/src/schemas/fish-catch.ts` + `types/fish-catch.ts` + barrels + common-species const.
- **T2 (after T1):** `routers/fishCatch.ts` (list/getById/create/update/delete, referenceNo gen,
  nested species writes in $transaction, inline auditLog, tenant guards) + register in root.ts +
  DB-gated `fishCatch.test.ts`.
- **T3a (after T1, ∥ T2):** UI list — `fish-catches/{page,columns,list-client}` + nav-items Records
  entry + `register/{page, form-client}` (react-hook-form + zodResolver + species field-array).
- **T3b (after T1, ∥ T2):** UI detail — `fish-catches/[id]/{page, detail-client}` (header fields +
  species table + fisherfolk/vessel links + computed total).
- **T4 (after T2):** Fisherfolk detail "Fish Catches" related-records card + fisherfolk getById include.
- **PM verify:** typecheck+lint+build+test green; rebuild dev; Playwright create→list→detail; DB
  cross-check referenceNo + totals; axe WCAG 2.2 AA = 0. Then commit + reboot.

## Showcase (feature 5) — after M2 ships, add a Fish Catch card to docs/showcase/index.html (own milestone-tail).
