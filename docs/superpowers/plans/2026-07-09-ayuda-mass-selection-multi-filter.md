# Ayuda Mass-Selection Multi-Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let FMO staff bulk-select Ayuda beneficiaries by mix-and-match multi-filtering (7 facets), add all/selected matches in one action, and bulk-remove PENDING subsets — respecting the program's distributionUnit.

**Architecture:** Extend the existing `ayuda` tRPC router with a facet-options query, a mode-aware eligible-search query, and bulk add/remove mutations (mirroring the single `addBeneficiary`). A new `BulkFilterDialog` React component drives the filter UI; the existing beneficiaries table gains bulk-remove. Filter WHERE-building mirrors `fisherfolk.list`.

**Tech Stack:** Next.js App Router, tRPC v11, Prisma (PostgreSQL), Zod, shadcn/ui, Vitest (DB-gated), React Query.

## Global Constraints

- Tenant-scoped: every procedure guards `if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN" })` (mirror existing procs in `ayuda.ts`).
- Mutations are `adminProcedure`; queries are `protectedProcedure` (match existing `ayuda.ts`).
- `AyudaBeneficiary` has `@@unique([programId, fisherfolkId])`; bulk add MUST dedupe (skip existing) and use `skipDuplicates: true`.
- Program must be `status === "ACTIVE"` for both bulk mutations (mirror single `addBeneficiary`, BAD_REQUEST otherwise).
- `beneficiaryCount` is denormalized — increment/decrement by the number ACTUALLY inserted/deleted, inside the same `$transaction`.
- HOUSEHOLD-mode: filter on household HEAD; recorded beneficiary = `household.headId` (mirror existing single-add HOUSEHOLD branch at `ayuda.ts:294`).
- `removeBeneficiaries` only deletes `verificationStatus === "PENDING"` rows (never RECEIVED).
- WCAG 2.2 AA hard gate: new UI must pass `axe` with **0 violations** (gov app). No colour-only state; labelled controls; dialog focus management.
- TypeScript strict — no `any`. shadcn/ui only. Write an audit-log entry per mutation (mirror the `auditLog`/`writeAuditLog` call used in existing `ayuda.ts` mutations — reuse the exact helper the file already imports).
- Do NOT reconcile the pre-existing stale shared ayuda schemas — only ADD the new filter schema.
- Enums (from `packages/db/prisma/schema.prisma`): `FisherfolkStatus { NEW, ACTIVE, RENEWED, INACTIVE, ARCHIVED }`; `AyudaDistributionUnit { FISHERFOLK, HOUSEHOLD }`; `AyudaBeneficiaryStatus { PENDING, RECEIVED, CANCELLED }`.
- Relevant fields: `Fisherfolk { barangay String, dateOfBirth DateTime? @db.Date, categoryIds String[], status FisherfolkStatus, householdId String?, vessels Vessel[] @relation("FisherfolkVessels"), headOf Household? }`; `Vessel { vesselType String }`; `Household { headId String @unique, householdNumber, barangay, members Fisherfolk[] }`; `Category { id, name, status CategoryStatus }`.

---

### Task 1: Shared filter Zod schema

**Files:**
- Modify: `packages/shared/src/schemas/ayuda.ts` (ADD only — do not touch existing exports)
- Test: none (pure schema; exercised via router tests in Task 2/3)

**Interfaces:**
- Produces: `ayudaBeneficiaryFilterSchema` (Zod object) and `type AyudaBeneficiaryFilter = z.infer<...>`, importable from `@frms/shared` (match the package's existing export path/barrel — check `packages/shared/src/index.ts` or the schemas barrel and export it the same way the other ayuda schemas are exported).

- [ ] **Step 1: Add the schema**

Append to `packages/shared/src/schemas/ayuda.ts` (import `z` if not already imported at top):

```ts
export const FISHERFOLK_STATUS_VALUES = [
  "NEW",
  "ACTIVE",
  "RENEWED",
  "INACTIVE",
  "ARCHIVED",
] as const;

export const ayudaBeneficiaryFilterSchema = z
  .object({
    barangays: z.array(z.string().min(1)).optional(),
    householdIds: z.array(z.string().cuid()).optional(),
    categoryIds: z.array(z.string()).optional(),
    ageMin: z.number().int().min(0).max(150).optional(),
    ageMax: z.number().int().min(0).max(150).optional(),
    statuses: z.array(z.enum(FISHERFOLK_STATUS_VALUES)).optional(),
    vesselOwner: z.enum(["yes", "no"]).optional(),
    vesselTypes: z.array(z.string().min(1)).optional(),
  })
  .strict()
  .refine(
    (f) => f.ageMin === undefined || f.ageMax === undefined || f.ageMin <= f.ageMax,
    { message: "ageMin must be ≤ ageMax", path: ["ageMin"] },
  );

export type AyudaBeneficiaryFilter = z.infer<typeof ayudaBeneficiaryFilterSchema>;
```

- [ ] **Step 2: Export from the barrel**

If `packages/shared/src/schemas/ayuda.ts` is re-exported via a barrel (e.g. `packages/shared/src/index.ts` or `.../schemas/index.ts`), confirm the new names are exported (usually `export * from "./schemas/ayuda"` already covers it). If the barrel uses named re-exports, add the two new names.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @frms/shared typecheck` (or the repo's shared typecheck script; fallback `pnpm -w typecheck`)
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/ayuda.ts packages/shared/src/index.ts
git commit -m "feat(ayuda): shared beneficiary multi-filter schema (M1)"
```

---

### Task 2: Backend — facet options + eligible-search queries

**Files:**
- Modify: `apps/web/src/server/trpc/routers/ayuda.ts` (ADD two `protectedProcedure` queries near `listBeneficiaries`)
- Test: `apps/web/src/server/trpc/routers/ayuda.test.ts` (ADD)

**Interfaces:**
- Consumes: `ayudaBeneficiaryFilterSchema`, `AyudaBeneficiaryFilter` from `@frms/shared` (Task 1). Existing `ctx.db` (guarded Prisma), `ctx.tenantId`.
- Produces:
  - `ayuda.filterFacetOptions` — query, input `void`/none → `{ barangays: string[]; categories: { id: string; name: string }[]; vesselTypes: string[]; statuses: readonly string[] }`.
  - `ayuda.searchEligibleBeneficiaries` — query, input `{ programId: string; filter: AyudaBeneficiaryFilter; page?: number; limit?: number; onlyEligible?: boolean }` → discriminated by mode:
    - FISHERFOLK: `{ mode: "FISHERFOLK"; rows: Array<{ id: string; fullName: string; idNumber: string | null; barangay: string; status: string; age: number | null; categoryIds: string[]; isVesselOwner: boolean; alreadyEnrolled: boolean }>; total: number; matchingIds: string[]; matchingTruncated: boolean }`
    - HOUSEHOLD: `{ mode: "HOUSEHOLD"; rows: Array<{ householdId: string; householdNumber: string; headId: string; headName: string; barangay: string; memberCount: number; alreadyEnrolled: boolean }>; total: number; matchingIds: string[]; matchingTruncated: boolean }` (matchingIds = householdIds)
  - Exported helper `buildFisherfolkFilterWhere(filter: AyudaBeneficiaryFilter, tenantId: string, now: Date): Prisma.FisherfolkWhereInput` — used by Task 3 too. Put it in `ayuda.ts` (or a small `apps/web/src/server/trpc/routers/_ayuda-filter.ts` module) and export it.

- [ ] **Step 1: Write the failing tests**

Add to `apps/web/src/server/trpc/routers/ayuda.test.ts` (mirror the existing DB-gated harness: `hasDb` guard, `platformPrisma` for seeding, guarded caller via `createCallerFactory(ayudaRouter)` + `makeCtx(tenantId)` with `role:"admin"`). Seed within a unique RUN token. Tests (only run when `hasDb`):

```ts
// searchEligibleBeneficiaries — FISHERFOLK mode
// Seed: tenant T; category CatA; 3 fisherfolk:
//   F1 barangay "Bara", categoryIds [CatA], status NEW, dob ~age 30, no vessel
//   F2 barangay "Barb", categoryIds [],     status RENEWED, dob ~age 60, has vessel type "Motorized"
//   F3 barangay "Bara", categoryIds [CatA], status NEW, dob ~age 20, no vessel
// ACTIVE program P (distributionUnit FISHERFOLK)
it("filters by barangay (multi-value OR within facet)", ...) // {barangays:["Bara"]} → F1,F3
it("ANDs facets", ...)                    // {barangays:["Bara"], statuses:["NEW"], ageMax:25} → F3 only
it("filters vessel owner yes/no", ...)    // {vesselOwner:"yes"} → F2 ; {vesselOwner:"no"} → F1,F3
it("filters vessel type", ...)            // {vesselTypes:["Motorized"]} → F2
it("filters by category hasSome", ...)    // {categoryIds:[CatA]} → F1,F3
it("excludes alreadyEnrolled when onlyEligible", ...) // enroll F1 → search returns F3 only for {barangays:["Bara"]}
it("returns matchingIds for the whole eligible set", ...) // matchingIds length === total
// HOUSEHOLD mode
// Seed household H head=F1 (barangay Bara, status NEW); ACTIVE program PH distributionUnit HOUSEHOLD
it("household mode filters on head and returns households", ...) // {statuses:["NEW"]} → H (headId F1)
```

Write these as real `it(...)` blocks with concrete assertions on the returned shapes (not pseudocode) following the seeding helpers already in the file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `set -a; source .env.dev; set +a; pnpm --filter @frms/web test -- ayuda.test.ts`
Expected: FAIL (procedures undefined). (If `.env.dev` var name differs, use the DATABASE_URL the file header documents.)

- [ ] **Step 3: Implement `buildFisherfolkFilterWhere` + both queries**

In `ayuda.ts`, add the helper and queries. Reference `import { Prisma } from "@frms/db"` (match how the file imports Prisma types). Age→DOB conversion:

```ts
export function buildFisherfolkFilterWhere(
  filter: AyudaBeneficiaryFilter,
  tenantId: string,
  now: Date,
): Prisma.FisherfolkWhereInput {
  const where: Prisma.FisherfolkWhereInput = { tenantId };
  if (filter.barangays?.length) where.barangay = { in: filter.barangays };
  if (filter.householdIds?.length) where.householdId = { in: filter.householdIds };
  if (filter.categoryIds?.length) where.categoryIds = { hasSome: filter.categoryIds };
  if (filter.statuses?.length) where.status = { in: filter.statuses as FisherfolkStatus[] };
  // age → dateOfBirth bounds (inclusive). ageMin=youngest → latest DOB; ageMax=oldest → earliest DOB.
  if (filter.ageMin !== undefined || filter.ageMax !== undefined) {
    const dob: Prisma.DateTimeFilter = {};
    if (filter.ageMin !== undefined) {
      const d = new Date(now); d.setFullYear(d.getFullYear() - filter.ageMin); dob.lte = d;
    }
    if (filter.ageMax !== undefined) {
      const d = new Date(now); d.setFullYear(d.getFullYear() - filter.ageMax - 1); d.setDate(d.getDate() + 1); dob.gte = d;
    }
    where.dateOfBirth = dob;
  }
  if (filter.vesselTypes?.length) {
    where.vessels = { some: { vesselType: { in: filter.vesselTypes } } };
  } else if (filter.vesselOwner === "yes") {
    where.vessels = { some: {} };
  } else if (filter.vesselOwner === "no") {
    where.vessels = { none: {} };
  }
  return where;
}
```

`filterFacetOptions`: distinct barangays (`ctx.db.fisherfolk.findMany({ where:{tenantId}, distinct:["barangay"], select:{barangay:true} })` → map non-empty, sort), categories (`ctx.db.category.findMany({ where:{tenantId, status:"ACTIVE"}, select:{id:true,name:true}, orderBy:{name:"asc"} })`), vesselTypes (distinct `vessel.vesselType`), statuses (return `FISHERFOLK_STATUS_VALUES`).

`searchEligibleBeneficiaries`:
- Guard tenant. Load program (`select distributionUnit, tenantId`); NOT_FOUND if missing/mismatched tenant.
- `const now = new Date();` `const where = buildFisherfolkFilterWhere(filter, ctx.tenantId, now);`
- Compute `enrolledFisherfolkIds = new Set((await ctx.db.ayudaBeneficiary.findMany({ where:{programId, tenantId}, select:{fisherfolkId:true} })).map(b=>b.fisherfolkId))`.
- **FISHERFOLK mode:** if `onlyEligible !== false`, add `id: { notIn: [...enrolledFisherfolkIds] }` to `where` (guard empty array → omit). Query page rows (`skip/take`, `orderBy fullName`), select the fields for the row shape; compute `age` from `dateOfBirth` (or null), `isVesselOwner` via `_count.vessels`/a `vessels: { take:1 }` existence. `total = count(where)`. `matchingIds` = `findMany({ where, select:{id}, take: 5001 })` → ids (cap 5000, `matchingTruncated = len>5000`). Always mark `alreadyEnrolled:false` here (they're excluded) unless `onlyEligible===false` (then compute per row).
- **HOUSEHOLD mode:** build household where = `{ tenantId, head: where }` (relation filter on head; note `where` already has `tenantId` — that's fine, Prisma nests it under head). Exclude already-enrolled by head: `head: { is: { ...where, id: { notIn:[...] } } }` OR filter after. Query households (`select householdId=id, householdNumber, headId, barangay, head:{select:{fullName}}, _count:{select:{members:true}}`), order by householdNumber. `matchingIds` = matching householdIds capped 5000. Map rows to the HOUSEHOLD shape.

- [ ] **Step 4: Run tests to verify they pass**

Run: `set -a; source .env.dev; set +a; pnpm --filter @frms/web test -- ayuda.test.ts`
Expected: PASS (all new + existing ayuda tests)

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @frms/web typecheck && pnpm --filter @frms/web lint`
Expected: PASS (watch strict-boolean-expressions — use explicit `=== undefined` / `?.length` truthiness carefully; `.length` on possibly-undefined → use `?.length` which is `number|undefined`, wrap in `!= null && x.length > 0` if lint complains).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/server/trpc/routers/ayuda.ts apps/web/src/server/trpc/routers/ayuda.test.ts
git commit -m "feat(ayuda): facet options + eligible-search queries (M1)"
```

---

### Task 3: Backend — bulk add + bulk remove mutations

**Files:**
- Modify: `apps/web/src/server/trpc/routers/ayuda.ts` (ADD two `adminProcedure` mutations near `addBeneficiary`)
- Test: `apps/web/src/server/trpc/routers/ayuda.test.ts` (ADD)

**Interfaces:**
- Consumes: existing `addBeneficiary` patterns (audit log helper, tx style), `ctx.db`, `ctx.tenantId`.
- Produces:
  - `ayuda.addBeneficiaries` — mutation, input `z.object({ programId: z.string().cuid(), fisherfolkIds: z.array(z.string().cuid()).max(5000).optional(), householdIds: z.array(z.string().cuid()).max(5000).optional() }).strict()` → `{ added: number; skipped: number }`.
  - `ayuda.removeBeneficiaries` — mutation, input `z.object({ programId: z.string().cuid(), beneficiaryIds: z.array(z.string().cuid()).max(5000) }).strict()` → `{ removed: number; skipped: number }`.

- [ ] **Step 1: Write the failing tests**

Add to `ayuda.test.ts` (DB-gated). Using an ACTIVE program + seeded fisherfolk/households:

```ts
it("addBeneficiaries bulk-adds and skips duplicates", ...)
// add [F1,F2,F3] → {added:3,skipped:0}; program.beneficiaryCount===3
// add [F1,F4]    → {added:1,skipped:1}; count===4
it("addBeneficiaries rejects non-ACTIVE program", ...) // DRAFT program → TRPCError BAD_REQUEST
it("addBeneficiaries HOUSEHOLD mode records head", ...)
// program PH (HOUSEHOLD), householdIds:[H] → creates beneficiary with fisherfolkId===H.headId
it("removeBeneficiaries deletes PENDING, decrements count, skips RECEIVED", ...)
// enroll F1,F2 (PENDING); verify F1 → RECEIVED; remove [benF1,benF2] → {removed:1,skipped:1}; count decremented by 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `set -a; source .env.dev; set +a; pnpm --filter @frms/web test -- ayuda.test.ts`
Expected: FAIL (mutations undefined)

- [ ] **Step 3: Implement the mutations**

`addBeneficiaries`:
- Guard tenant. Load program (`distributionUnit`, `status`, `tenantId`); NOT_FOUND if missing; BAD_REQUEST if `status !== "ACTIVE"`.
- Resolve target fisherfolkIds:
  - HOUSEHOLD: require `householdIds`; BAD_REQUEST if `fisherfolkIds` given instead. Load households (`where:{ id:{in:householdIds}, tenantId }, select:{ headId }`) → `targetIds = households.map(h=>h.headId)`.
  - FISHERFOLK: require `fisherfolkIds`; BAD_REQUEST if `householdIds` given. `targetIds = fisherfolkIds`.
  - Dedup `targetIds` (Set).
- `existing = new Set((await ctx.db.ayudaBeneficiary.findMany({ where:{ programId, tenantId, fisherfolkId:{ in: targetIds } }, select:{ fisherfolkId:true } })).map(b=>b.fisherfolkId))`.
- `toInsert = targetIds.filter(id=>!existing.has(id))`.
- If `toInsert.length===0` → return `{ added:0, skipped: targetIds.length }` (no tx).
- `$transaction`: `createMany({ data: toInsert.map(fisherfolkId=>({ tenantId, programId, fisherfolkId, ... })), skipDuplicates:true })` (include `householdId` when HOUSEHOLD mode — map head→householdId if the schema stores it; mirror single-add which sets `householdId`), then `ayudaProgram.update({ where:{id:programId}, data:{ beneficiaryCount: { increment: result.count } } })`. Use the createMany return `count` for the increment. Write ONE audit-log entry (`action:"AYUDA_BULK_ADD_BENEFICIARIES"`, metadata `{ programId, added: count, skipped }`) mirroring the existing audit helper signature in the file.
- Return `{ added: count, skipped: targetIds.length - count }`.

`removeBeneficiaries`:
- Guard tenant. Load program (tenant check); NOT_FOUND if missing.
- `deletable = await ctx.db.ayudaBeneficiary.findMany({ where:{ id:{ in: beneficiaryIds }, programId, tenantId, verificationStatus:"PENDING" }, select:{ id:true } })`.
- `skipped = beneficiaryIds.length - deletable.length`.
- If `deletable.length===0` → return `{ removed:0, skipped }`.
- `$transaction`: `deleteMany({ where:{ id:{ in: deletable.map(d=>d.id) } } })`, then `ayudaProgram.update({ data:{ beneficiaryCount:{ decrement: deletable.length } } })`. Audit-log `AYUDA_BULK_REMOVE_BENEFICIARIES`.
- Return `{ removed: deletable.length, skipped }`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `set -a; source .env.dev; set +a; pnpm --filter @frms/web test -- ayuda.test.ts`
Expected: PASS

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @frms/web typecheck && pnpm --filter @frms/web lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/server/trpc/routers/ayuda.ts apps/web/src/server/trpc/routers/ayuda.test.ts
git commit -m "feat(ayuda): bulk add + bulk remove beneficiary mutations (M1)"
```

---

### Task 4: Frontend — BulkFilterDialog component

**Files:**
- Create: `apps/web/src/app/[tenant]/ayuda/[id]/bulk-filter-dialog.tsx`
- (Reuse existing shadcn primitives; only create a small multi-select helper if none exists — check `apps/web/src/components/ui/` first.)

**Interfaces:**
- Consumes: `trpc.ayuda.filterFacetOptions`, `trpc.ayuda.searchEligibleBeneficiaries`, `trpc.ayuda.addBeneficiaries`, `trpc.household.list` (household-mode multiselect), `AyudaBeneficiaryFilter` type from `@frms/shared`.
- Produces: `export function BulkFilterDialog({ programId, distributionUnit, canManage, onChanged }: { programId: string; distributionUnit: "FISHERFOLK" | "HOUSEHOLD"; canManage: boolean; onChanged: () => void })` — a Dialog triggered by a "Filter & Bulk Add" button. `onChanged` = caller invalidates beneficiaries query.

- [ ] **Step 1: Build the component**

`"use client"`. Structure:
- Trigger `<Button variant="outline">Filter &amp; Bulk Add</Button>` inside shadcn `<Dialog>`, only rendered when `canManage`.
- Local state: `filter: AyudaBeneficiaryFilter` (start `{}`), `page`, `selectedIds: Set<string>`.
- Load `filterFacetOptions` once. Render facet controls:
  - Barangay, Category, Status, Vessel-type: multi-select (checkbox list inside a `Popover` or `DropdownMenu` — reuse existing pattern; each option a labelled `Checkbox`). Category options from facet `categories` (label name, value id). Status options from `FISHERFOLK_STATUS_VALUES`.
  - Household: multi-select from `trpc.household.list` (search-driven) — only shown/relevant when useful; can be shown in both modes (it's a fisherfolk facet).
  - Age: two `<Input type="number">` (min / max) with `<Label>`.
  - Vessel owner: tri-state — shadcn `Select` with "Any / Owner / Non-owner" (map to `undefined | "yes" | "no"`) OR a `role="group"` of toggle buttons with `aria-pressed`.
  - "Clear filters" button resets `filter`.
- Debounce `filter` (e.g. 300ms) → `searchEligibleBeneficiaries.useQuery({ programId, filter, page, onlyEligible:true })`.
- Results header: **"{total} matching"**. Table (shadcn `<Table>`): a header select-all-on-page checkbox + per-row `<Checkbox>` bound to `selectedIds`. Columns depend on `mode`:
  - FISHERFOLK: name, idNumber, barangay, status, age, vessel-owner (text "Yes"/"No", not colour-only).
  - HOUSEHOLD: householdNumber, headName, barangay, memberCount.
- Pagination controls (Prev/Next) using `total`/`limit`.
- Footer actions (disabled when `!canManage` or busy):
  - **"Add all {total} matching"** → `addBeneficiaries.mutate({ programId, [idKey]: data.matchingIds })` where `idKey` = `fisherfolkIds` (FISHERFOLK) or `householdIds` (HOUSEHOLD). If `matchingTruncated`, show inline notice "covers first 5000".
  - **"Add selected ({selectedIds.size})"** → `addBeneficiaries.mutate({ programId, [idKey]: [...selectedIds] })`.
  - On success: `toast.success(\`\${added} added, \${skipped} skipped\`)` (use the project's toast — `sonner`), clear `selectedIds`, refetch the search query, call `onChanged()`. Keep dialog open.
- Accessibility: every control has an associated `<Label>`/accessible name; checkboxes labelled; tri-state uses `aria-pressed` or a labelled `Select`; "already enrolled" never shown by colour alone (excluded from list by default anyway).

- [ ] **Step 2: Typecheck + lint**

Run: `pnpm --filter @frms/web typecheck && pnpm --filter @frms/web lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\[tenant\]/ayuda/\[id\]/bulk-filter-dialog.tsx apps/web/src/components/ui/
git commit -m "feat(ayuda): BulkFilterDialog multi-facet bulk-add UI (M1)"
```

---

### Task 5: Frontend — wire bulk-add + bulk-remove into detail client

**Files:**
- Modify: `apps/web/src/app/[tenant]/ayuda/[id]/ayuda-detail-client.tsx`

**Interfaces:**
- Consumes: `BulkFilterDialog` (Task 4), `trpc.ayuda.removeBeneficiaries`.

- [ ] **Step 1: Mount BulkFilterDialog**

Next to the existing "Add Beneficiary" trigger (same `canManage && status==="ACTIVE"` gate), render
`<BulkFilterDialog programId={program.id} distributionUnit={program.distributionUnit} canManage={canManage} onChanged={() => utils.ayuda.listBeneficiaries.invalidate()} />` (use the file's existing tRPC utils/invalidation pattern).

- [ ] **Step 2: Add bulk-remove to BeneficiariesTable**

In the enrolled beneficiaries table (`BeneficiariesTable`, ayuda-detail-client.tsx:330–447):
- Add a `selectedBeneficiaryIds` state (Set) + a header select-all checkbox + per-row `<Checkbox>`. Rows with `verificationStatus === "RECEIVED"` → checkbox `disabled` with a `title`/tooltip "Confirmed distribution — cannot bulk-remove".
- Add a **"Remove selected ({n})"** `Button variant="destructive"` shown when `canManage` and `n>0`. On click → confirm via existing `AlertDialog` primitive (already added in the household feature) → `removeBeneficiaries.mutate({ programId, beneficiaryIds:[...selected] })` → toast `{removed} removed, {skipped} skipped`, clear selection, invalidate `listBeneficiaries`.

- [ ] **Step 3: Typecheck + lint + build**

Run: `pnpm --filter @frms/web typecheck && pnpm --filter @frms/web lint && pnpm --filter @frms/web build`
Expected: PASS (build compiles the 3 ayuda routes)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\[tenant\]/ayuda/\[id\]/ayuda-detail-client.tsx
git commit -m "feat(ayuda): wire bulk-add dialog + bulk-remove into program detail (M1)"
```

---

### Task 6: PM verification (browser QA + axe) — NOT a worker task

Done by the PM after Tasks 1–5 land. Rebuild dev (`bash deploy/compose/start.sh dev up -d`), login `webmaster@localhost.com` / `C^@F/2#mx5eW`, tenant `calapan-city`, http://localhost:44387. On an ACTIVE ayuda program:
- Open "Filter & Bulk Add"; verify facet options load; set barangay+status+age → "N matching" reflects a DB-cross-checked count (`docker exec frms_dev_postgres psql …`); "Add all matching" enrolls exactly the eligible set; re-run → all skipped.
- HOUSEHOLD-mode program: households listed; add records head as beneficiary.
- Bulk-remove: select PENDING rows → removed; RECEIVED disabled.
- `beneficiaryCount` / list refetch consistent with DB.
- **axe WCAG 2.2 AA scan on the dialog + table = 0 violations.** 0 console errors.
- Update `docs/showcase/index.html` deferred to the batch's showcase milestone (M5), per task list.

## Self-Review

- **Spec coverage:** facets a–g → Task 1 schema + Task 2 `buildFisherfolkFilterWhere` ✓; add-all/add-selected → Task 3 `addBeneficiaries` + Task 4 UI ✓; bulk remove → Task 3 `removeBeneficiaries` + Task 5 ✓; manual individual add/remove preserved (existing dialog untouched) ✓; distributionUnit respect → Task 2/3 HOUSEHOLD branch ✓; tenant-scope + admin guards → Global Constraints ✓; WCAG → Task 4/5 + Task 6 gate ✓; tests → Task 2/3 ✓.
- **Placeholder scan:** interfaces + WHERE-builder code concrete; test bodies specified with concrete seed+assert intent (worker writes real `it` blocks). No TBD.
- **Type consistency:** `AyudaBeneficiaryFilter`, `buildFisherfolkFilterWhere`, `matchingIds`, `{added,skipped}`, `{removed,skipped}`, `idKey` naming consistent across tasks.
</content>
</invoke>
