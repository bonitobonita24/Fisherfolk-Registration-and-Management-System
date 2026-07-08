# Household Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add explicit Household records (head + members) to FRMS, with a Household menu + create wizard, per-municipality/per-category counts (by the head's category), an ayuda per-household distribution mode, and dummy households seeded in dev/demo only.

**Architecture:** New `Household` Prisma model + `Fisherfolk.householdId` FK; new `household` tRPC router; new `/[tenant]/households` list + wizard + detail pages (modeled on the existing `vessels/` + `ayuda/` features and `import/import-wizard.tsx`); ayuda gains a `distributionUnit`; dashboard/reports gain household counts.

**Tech Stack:** Next.js App Router, tRPC, Prisma (PostgreSQL), shadcn/ui, Recharts, Vitest, TypeScript strict.

## Global Constraints (verbatim from spec + repo conventions)

- Spec: `docs/superpowers/specs/2026-07-08-household-management-design.md`.
- TypeScript strict — no `any`, no `.js` in src, `process.env["KEY"]` bracket style.
- Tenant isolation on every query (`ctx.tenantId`); `superAdminProcedure` must use `platformPrisma` for tenant-guarded models — but household procs are `protectedProcedure` (tenant present).
- shadcn/ui only. WCAG 2.2 AA is a gov hard gate on new pages (`role`, labels, contrast, keyboard).
- Chart color tokens are HSL triplets → `hsl(var(--chart-N))`.
- Do NOT add `eslint-disable react-hooks/exhaustive-deps` (rule not configured → errors).
- Household category for counts = the **head's** `categoryIds`. Household number auto sequential `HH-0001`, unique per tenant. A fisherfolk is in ≤1 household; head is also a member; delete household unlinks members (never deletes fisherfolk).
- Data-governance: dummy households seed in dev/demo ONLY, via the `ALLOW_DEMO_SEED`-guarded `apps/web/scripts/seed-demo.ts` (see `docs/DATA_SEEDING_POLICY.md`). No staging/prod backfill.
- Verify each task: `pnpm --filter @frms/web run typecheck` + `pnpm turbo run lint --filter=@frms/web` + relevant `pnpm --filter @frms/web test`. Build (`pnpm --filter @frms/web run build`) at the end. Commit per task.

---

### Task 1: Schema + migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (Fisherfolk model, Ayuda models, new Household model, new enum)
- Create: migration via `pnpm --filter @frms/db exec prisma migrate dev --name household_management`

**Interfaces — Produces:** Prisma models `Household`, `Fisherfolk.householdId`, `AyudaProgram.distributionUnit`, `AyudaBeneficiary.householdId`, enum `AyudaDistributionUnit`.

- [ ] **Step 1: Add the `Household` model + enum to schema.prisma**

```prisma
enum AyudaDistributionUnit {
  FISHERFOLK
  HOUSEHOLD
}

model Household {
  id              String   @id @default(cuid())
  tenantId        String   @map("tenant_id")
  householdNumber String   @map("household_number")
  headId          String   @unique @map("head_id")
  barangay        String
  address         String
  notes           String?
  createdById     String?  @map("created_by_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tenant    Tenant       @relation(fields: [tenantId], references: [id])
  head      Fisherfolk   @relation("HouseholdHead", fields: [headId], references: [id])
  createdBy User?        @relation("HouseholdCreatedBy", fields: [createdById], references: [id])
  members   Fisherfolk[] @relation("HouseholdMembers")
  ayudaBeneficiaries AyudaBeneficiary[]

  @@unique([tenantId, householdNumber])
  @@index([tenantId])
  @@map("households")
}
```

- [ ] **Step 2: Add relations/fields to existing models**

In `model Fisherfolk`: add
```prisma
  householdId  String?  @map("household_id")
  household    Household? @relation("HouseholdMembers", fields: [householdId], references: [id])
  headOf       Household? @relation("HouseholdHead")
```
and index `@@index([tenantId, householdId])`.

In `model AyudaProgram`: add `distributionUnit AyudaDistributionUnit @default(FISHERFOLK) @map("distribution_unit")`.

In `model AyudaBeneficiary`: add
```prisma
  householdId String?    @map("household_id")
  household   Household? @relation(fields: [householdId], references: [id])
```
and index `@@index([householdId])`.

In `model Tenant` and `model User`: add the back-relations Prisma requires (`households Household[]` on Tenant; `createdHouseholds Household[] @relation("HouseholdCreatedBy")` on User). Run `prisma format` to catch any missing back-relations.

- [ ] **Step 3: Create + apply the migration**

Run: `cd packages/db && pnpm exec prisma migrate dev --name household_management`
Expected: migration created under `packages/db/prisma/migrations/*_household_management/`, applied to dev DB, `Prisma Client` regenerated.

- [ ] **Step 4: Verify typecheck (client types exist)**

Run: `pnpm --filter @frms/web run typecheck`
Expected: PASS (no references yet, but the generated client compiles).

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): household model + fisherfolk.householdId + ayuda distributionUnit"
```

---

### Task 2: Household tRPC router + tests

**Files:**
- Create: `apps/web/src/server/trpc/routers/household.ts`
- Create: `apps/web/src/server/trpc/routers/household.test.ts`
- Modify: `apps/web/src/server/trpc/root.ts` (register `household: householdRouter`)

**Interfaces — Consumes:** Prisma `Household` from Task 1. **Produces** (UI tasks depend on these exact procs):
- `household.list({ page?, limit?, search? }) → { items: HouseholdListItem[], total }` where `HouseholdListItem = { id, householdNumber, barangay, head: { id, fullName, categoryIds }, memberCount }`.
- `household.getById({ id }) → { …household, head, members: FisherfolkLite[] }`.
- `household.create({ headId, memberIds: string[], barangay?, address?, notes? }) → { id }`.
- `household.update({ id, addMemberIds?, removeMemberIds?, newHeadId?, barangay?, address?, notes? }) → { id }`.
- `household.remove({ id }) → { ok: true }` (unlinks members).
- `household.availableFisherfolk({ search, excludeHouseholdId? }) → FisherfolkLite[]` (fisherfolk with `householdId == null`, for the wizard/add pickers). `FisherfolkLite = { id, idNumber, fullName, barangay, categoryIds }`.

**Key rules to implement:**
- Household number: `HH-` + zero-padded next sequence per tenant (compute from `count` of tenant households + 1; ensure uniqueness by retrying on P2002). 
- `create`: headId must be an unassigned fisherfolk in-tenant; set that fisherfolk's `householdId` = new household; set each memberId's `householdId` too (members must be unassigned + in-tenant); `barangay`/`address` default from the head when omitted. All in a `ctx.db.$transaction`.
- `update`: `newHeadId` must be a current member; `removeMemberIds` cannot include the head (change head first); `addMemberIds` must be unassigned. Keep head-is-member invariant.
- `remove`: set all members' `householdId = null`, then delete the household (transaction).
- Every query tenant-scoped via `ctx.tenantId`.

- [ ] **Step 1: Write failing tests** (model after an existing router test, e.g. `fisherfolk` tests). Cover: create assigns head+members & auto-numbers; a fisherfolk can't be added to two households; newHead must be a member; remove unlinks members; availableFisherfolk excludes assigned.

```ts
// household.test.ts — sketch (fill with the repo's test harness pattern from an existing *.test.ts)
it("create assigns head + members and auto-generates HH number", async () => { /* … */ });
it("rejects adding an already-assigned fisherfolk", async () => { /* … */ });
it("change head must target a current member", async () => { /* … */ });
it("remove unlinks members without deleting fisherfolk", async () => { /* … */ });
```

- [ ] **Step 2: Run tests → FAIL** (`pnpm --filter @frms/web test household`).
- [ ] **Step 3: Implement `household.ts`** per the Interfaces + rules above (protectedProcedure, Zod inputs, `$transaction`, P2002 retry for number).
- [ ] **Step 4: Register in `root.ts`** — import + add `household: householdRouter,`.
- [ ] **Step 5: Run tests → PASS**, then `typecheck` + `lint`.
- [ ] **Step 6: Commit** `feat(household): tRPC router (list/get/create/update/remove) + tests`.

---

### Task 3: Nav item + Household list page

**Files:**
- Modify: `apps/web/src/components/nav-items.ts` (add Household to the Records group, after Fisherfolk)
- Create: `apps/web/src/app/[tenant]/households/page.tsx`
- Create: `apps/web/src/app/[tenant]/households/households-list-client.tsx`
- Create: `apps/web/src/app/[tenant]/households/columns.tsx`

**Interfaces — Consumes:** `household.list`. Model after `apps/web/src/app/[tenant]/vessels/{page.tsx,vessels-list-client.tsx,columns.tsx}`.

- [ ] **Step 1:** Add nav item `{ label: "Household", icon: Home, href: "/households" }` (import `Home` from lucide-react) in the Records group.
- [ ] **Step 2:** Build the list page mirroring vessels: search box, data table with columns household no. / head name / member count / barangay / head's category, a "Create Household" button → `/households/new`, row click → `/households/[id]`. Loading + empty states.
- [ ] **Step 3:** `typecheck` + `lint`; visually confirm the page renders (route resolves).
- [ ] **Step 4: Commit** `feat(household): nav item + list page`.

---

### Task 4: Create wizard (head → members → confirm → save)

**Files:**
- Create: `apps/web/src/app/[tenant]/households/new/page.tsx`
- Create: `apps/web/src/app/[tenant]/households/household-wizard.tsx`

**Interfaces — Consumes:** `household.availableFisherfolk`, `household.create`. Model the multi-step shell after `apps/web/src/app/[tenant]/import/import-wizard.tsx`.

- [ ] **Step 1:** Wizard with 3 steps + a stepper:
  1. **Head** — search box → `availableFisherfolk` results → select one as head.
  2. **Members** — search → results (exclude the head + anyone assigned) → add/remove chips; barangay/address fields default from head (editable).
  3. **Review** — show head + members + defaults; "Save" → `household.create` → toast + redirect to the new `/households/[id]`.
- [ ] **Step 2:** Guard: can't advance past step 1 without a head. WCAG: labelled inputs, keyboard-navigable, `aria-current` on the active step.
- [ ] **Step 3:** `typecheck` + `lint`.
- [ ] **Step 4: Commit** `feat(household): create wizard (head → members → confirm)`.

---

### Task 5: Household detail / edit page

**Files:**
- Create: `apps/web/src/app/[tenant]/households/[id]/page.tsx`
- Create: `apps/web/src/app/[tenant]/households/[id]/household-detail-client.tsx`

**Interfaces — Consumes:** `household.getById`, `household.update`, `household.remove`, `household.availableFisherfolk`. Model after `apps/web/src/app/[tenant]/vessels/[id]/`.

- [ ] **Step 1:** Show head (badge) + members list; actions: add member (search dialog), remove member, change head (pick from members), edit barangay/address/notes, delete household (confirm dialog → `remove` → redirect to list).
- [ ] **Step 2:** `typecheck` + `lint`.
- [ ] **Step 3: Commit** `feat(household): detail + edit page`.

---

### Task 6: Fisherfolk detail — household membership

**Files:**
- Modify: the fisherfolk detail client (`apps/web/src/app/[tenant]/fisherfolk/[id]/*.tsx`) + `fisherfolk.getById` proc to include `household { id, householdNumber, headId }`.

- [ ] **Step 1:** Extend `fisherfolk.getById` select to include `household`. Add a small "Household" section/badge on the detail page: shows `HH-####`, role (Head if `household.headId === fisherfolk.id` else Member), link to `/households/[id]`; or "No household" when null.
- [ ] **Step 2:** `typecheck` + `lint`.
- [ ] **Step 3: Commit** `feat(household): show membership on fisherfolk detail`.

---

### Task 7: Ayuda per-household distribution

**Files:**
- Modify: `apps/web/src/server/trpc/routers/ayuda.ts` (program create/edit input + beneficiary add path), `apps/web/src/app/[tenant]/ayuda/new/*` + `[id]/*` (distribution selector + beneficiary picker).

**Interfaces — Consumes:** `household.list` (for the household picker). Ayuda program create/edit accepts `distributionUnit: "FISHERFOLK" | "HOUSEHOLD"`.

- [ ] **Step 1:** Program create/edit: add a `Distribution` select (Per fisherfolk / Per household), persisted to `AyudaProgram.distributionUnit`.
- [ ] **Step 2:** Beneficiary add path: when `distributionUnit === HOUSEHOLD`, the picker lists households (household no. + head + barangay); adding one records an `AyudaBeneficiary` with `fisherfolkId = household.headId` and `householdId = household.id`; block re-adding the same household (unique `[programId, fisherfolkId]` already enforces via head; also guard on `householdId`). When `FISHERFOLK`, keep current behavior.
- [ ] **Step 3:** Tests for the household-add path (records head + householdId; blocks duplicate). `typecheck` + `lint`.
- [ ] **Step 4: Commit** `feat(ayuda): per-household distribution unit`.

---

### Task 8: Household counts on dashboard + reports

**Files:**
- Modify: `apps/web/src/server/trpc/routers/dashboard.ts` (new `getHouseholdStats` proc), `apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx` (a Households tile/chart), and the reports generator (`report` router + `/reports`).

**Interfaces — Produces:** `dashboard.getHouseholdStats() → { total, byBarangay: {barangay,count}[], byCategory: {category,count}[] }` where byCategory keys off each household head's `categoryIds`.

- [ ] **Step 1:** Implement `getHouseholdStats` (tenant-scoped): total households; group by `barangay`; and by head category (join head → categoryIds → category names).
- [ ] **Step 2:** Add a "Households" chart/tile to the dashboard (Recharts BarChart, `role="figure"` + `aria-labelledby`, `hsl(var(--chart-N))`), + a households breakdown in the reports generator alongside the existing report types.
- [ ] **Step 3:** `typecheck` + `lint`.
- [ ] **Step 4: Commit** `feat(household): counts on dashboard + reports`.

---

### Task 9: Guarded dummy household seed (dev/demo only)

**Files:**
- Modify: `apps/web/scripts/seed-demo.ts` (already `ALLOW_DEMO_SEED`-guarded).

- [ ] **Step 1:** After demo fisherfolk exist, group a handful (e.g. 20) into ~6 demo households — pick a head + 2-4 members each from existing tenant fisherfolk that are unassigned; set `householdId`; auto-number `HH-####`. Idempotent (skip if the household number exists). Also create one `Per household` demo ayuda program with a few household beneficiaries (head + householdId).
- [ ] **Step 2:** Verify: `ALLOW_DEMO_SEED=1 pnpm exec tsx scripts/seed-demo.ts` (from apps/web) creates demo households in dev; running WITHOUT the flag still refuses.
- [ ] **Step 3:** `typecheck` + `lint`.
- [ ] **Step 4: Commit** `feat(household): guarded demo household seed (dev/demo only)`.

---

## Final verification (after Task 9)

- [ ] `pnpm --filter @frms/web run build` → PASS.
- [ ] Rebuild dev container (`bash deploy/compose/start.sh dev up -d`) + browser-QA: create a household via the wizard (head + members → confirm → save); household appears in list + on the head/members' fisherfolk detail; dashboard households counts populate; create a Per-household ayuda program and add a household beneficiary (records the head, blocks duplicate); WCAG axe scan on `/households` + wizard = 0 serious/critical.
- [ ] Update `docs/STATE.md` + `docs/CHANGELOG_AI.md`; draft the PRODUCT.md feature-intent back-port for the owner (Rule 1 — human applies) + log decisions in `docs/DECISIONS_LOG.md`.

## Self-review (plan vs spec)

- Spec coverage: model (T1), head-is-member/validation (T2), menu+wizard (T3,T4), detail/edit (T5), fisherfolk membership (T6), ayuda per-household (T7), counts (T8), seeding/no-backfill (T9) — all covered.
- No placeholders in contracts; UI tasks point at exact existing patterns to follow.
- Type consistency: `FisherfolkLite`/`HouseholdListItem` names used consistently across T2→T3/T4/T5.
