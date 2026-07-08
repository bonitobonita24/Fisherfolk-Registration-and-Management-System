# ToDo (Kanban + Calendar) Implementation Plan

> **For agentic workers:** Each task is a bounded, fully-specified worker prompt. Steps use checkbox (`- [ ]`) syntax. Verify + commit per task.

**Goal:** Reframe the standalone Kanban board as **ToDo** with a **Kanban view** + a **Calendar view**, add due dates + record source-links, and a **"Make ToDo"** action on Fisherfolk / Vessel / Violation / Ayuda records.

**Spec:** `docs/superpowers/specs/2026-07-08-todo-kanban-calendar-design.md` (approved 2026-07-08).

**Architecture:** Extend `KanbanTask` (3 nullable cols) + migration; extend `kanbanTask` router (create/update/list) + shared Zod; add `user.listAssignable` proc; move route `app/[tenant]/kanban` → `app/[tenant]/todo` with a `/kanban`→`/todo` redirect; add a canonical `entityType→route` helper; ToDo page gets a Tabs view toggle (Kanban | Calendar) + "Assigned to me" filter; a reusable `<MakeTodoDialog>` + `<LinkedTodos>` wired into 4 detail pages.

**Tech Stack:** Next.js App Router, tRPC, Prisma (PostgreSQL), shadcn/ui (tabs, popover, select, dialog present; NO calendar dep), Vitest, TypeScript strict.

## Global Constraints (verbatim from spec + repo conventions)

- TypeScript strict — no `any`, no `.js` in src, `process.env["KEY"]` bracket style.
- Tenant isolation on every query (`ctx.tenantId`); todo procs are `protectedProcedure`.
- shadcn/ui ONLY. **No new heavy calendar dependency** — Calendar view is a hand-built month grid with plain date math; due-date input is native `<input type="date">`.
- **Keep the existing MoveMenu status-change** (no drag-and-drop lib added — deferred enhancement). Do NOT regress the current board.
- Internal model/table stays `KanbanTask` / `kanban_tasks` (no rename migration). Only UI + route become "ToDo".
- `sourceEntityType` canonical values = **lowercase** `fisherfolk | vessel | violation | ayudaProgram` (spec table). Validate against this set; `sourceEntityId` must resolve in-tenant when provided.
- `assignedToId` stays required; create/"Make ToDo" default it to the current user (`ctx.session.user.id`), editable.
- WCAG 2.2 AA is a gov hard gate on the ToDo page (both views) + the Make-ToDo dialog. Dark-mode legible.
- Do NOT add `eslint-disable react-hooks/exhaustive-deps` (rule not configured → errors).
- Dev DB has pre-existing migration drift → apply the household-style **non-destructive** migration (migrate diff → db execute → migrate resolve --applied), NOT `migrate dev` (which demands a reset).
- Verify each task: `pnpm --filter @frms/web run typecheck` + `pnpm turbo run lint --filter=@frms/web` + relevant tests. Build at the end. Commit per task.

---

## Milestone A — Backend

### Task 1: Schema + migration

**Files:** Modify `packages/db/prisma/schema.prisma` (KanbanTask); create migration under `packages/db/prisma/migrations/`.

- [ ] Add to `model KanbanTask`: `dueDate DateTime? @map("due_date")`, `sourceEntityType String? @map("source_entity_type")`, `sourceEntityId String? @map("source_entity_id")`, and `@@index([tenantId, dueDate])`. Run `prisma format` + `prisma validate`.
- [ ] Generate migration SQL non-destructively: `cd packages/db && pnpm exec prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma` is NOT the shape — instead: create a new timestamped migration dir `packages/db/prisma/migrations/<ts>_todo_kanban_calendar/migration.sql` with `ALTER TABLE "kanban_tasks" ADD COLUMN "due_date" TIMESTAMP(3), ADD COLUMN "source_entity_type" TEXT, ADD COLUMN "source_entity_id" TEXT;` + `CREATE INDEX "kanban_tasks_tenant_id_due_date_idx" ON "kanban_tasks"("tenant_id", "due_date");`. Apply with `pnpm exec prisma db execute --file <that migration.sql> --schema prisma/schema.prisma`, then `pnpm exec prisma migrate resolve --applied <migration_name>`, then `pnpm exec prisma generate`. (Mirror exactly how the household migration was applied — check `packages/db/prisma/migrations/*household*` for the established pattern.)
- [ ] Verify: `pnpm --filter @frms/web run typecheck` PASS (client compiles). Confirm columns live: `\d kanban_tasks` shows the 3 columns + index.
- [ ] Commit `feat(db): kanban_task dueDate + source entity link (todo feature)`.

### Task 2: Router + shared schemas + assignable-users proc + tests

**Files:** Modify `packages/shared/src/schemas/kanban-task.ts`, `apps/web/src/server/trpc/routers/kanbanTask.ts`, `apps/web/src/server/trpc/routers/user.ts`; create `apps/web/src/server/trpc/routers/kanbanTask.test.ts`.

- [ ] Extend `kanbanTaskCreateSchema` + `kanbanTaskUpdateSchema` with `dueDate: z.coerce.date().nullish()`, `sourceEntityType: z.enum(["fisherfolk","vessel","violation","ayudaProgram"]).nullish()`, `sourceEntityId: z.string().cuid().nullish()`.
- [ ] `kanbanTask.create`: default `assignedToId` to `ctx.session.user.id` when omitted (make it optional in the create input OR default in resolver); persist the 3 new fields; when `sourceEntityType`+`sourceEntityId` given, validate the id resolves in-tenant for that model (fisherfolk/vessel/violation/ayudaProgram) else BAD_REQUEST.
- [ ] `kanbanTask.update`: allow updating dueDate/source fields (source usually immutable but accept for completeness); keep ownership/tenant checks.
- [ ] `kanbanTask.list`: add optional `assignedToMe?: boolean` (→ where assignedToId = ctx.session.user.id), `sourceEntityType?`, `sourceEntityId?` filters. Extend the item `select` to include `dueDate, sourceEntityType, sourceEntityId`. Keep pagination + existing filters + tenant isolation.
- [ ] Add `user.listAssignable: protectedProcedure` (tenant-scoped) → `{ id, name, username }[]` of active tenant users, for the assignee dropdown (encoders can't call the admin-only `user.list`). Small, capped (e.g. limit 500), ordered by name.
- [ ] Write DB-gated tests (`describe.skipIf(!hasDb)`, mirror `household.test.ts`/`ayuda.test.ts` harness): create with dueDate + source link records fields; create defaults assignee to current user; create with a non-resolving sourceEntityId is rejected; list `assignedToMe` filters; list by sourceEntityType+Id returns only linked. Run with the dev `DATABASE_URL`.
- [ ] Verify: tests PASS (with DATABASE_URL) + typecheck + lint.
- [ ] Commit `feat(todo): kanbanTask due date + source link + assignable users + tests`.

### Task 3: Shared helpers (entity link + date utils)

**Files:** Create `apps/web/src/lib/todo-source.ts` (or similar) + a small date util (reuse if one exists).

- [ ] `sourceEntityLink(type, id, tenant): { href, label } | null` mapping lowercase `fisherfolk→{`/${tenant}/fisherfolk/${id}`,"Fisherfolk"}`, `vessel→vessels`, `violation→violations`, `ayudaProgram→ayuda,"Ayuda"`. Return null for unknown.
- [ ] `SOURCE_ENTITY_OPTIONS`/labels + `isOverdue(dueDate, status)` (`dueDate < startOfToday && status !== "DONE"`), `formatDueDate(date)` (en-PH date, no time), and month-grid helpers `monthMatrix(year, month): (Date|null)[][]` + `sameDay(a,b)`. Pure functions, no deps.
- [ ] Verify: typecheck + lint (no consumers yet is fine).
- [ ] Commit `feat(todo): source-entity link + date/month-grid helpers`.

---

## Milestone B — ToDo page (route move + both views)

### Task 4: Route move + nav rename + redirect + Kanban view enhancements

**Files:** Move `apps/web/src/app/[tenant]/kanban/` → `apps/web/src/app/[tenant]/todo/`; recreate `apps/web/src/app/[tenant]/kanban/page.tsx` as a redirect; modify `apps/web/src/components/nav-items.ts`; grep + update all internal `/kanban` links.

- [ ] `git mv` the kanban dir to `todo/`; rename `kanban-board-client.tsx` → `todo-board-client.tsx` (update imports). Keep the MoveMenu status mechanism.
- [ ] Recreate `app/[tenant]/kanban/page.tsx` as an async server component: `redirect(`/${tenant}/todo`)` (await params for tenant). Mirror `fisherfolk/register/page.tsx` redirect idiom.
- [ ] `nav-items.ts`: change the Operations entry to `{ label: "ToDo", icon: ListTodo (or keep KanbanSquare), href: "/todo", roles: [...] }`. Import the icon.
- [ ] Grep the whole `apps/web/src` for `/kanban` and `kanban-board-client` / `KanbanBoardClient` string/route refs; update to `/todo` / the new client name. (Do NOT rename the `kanbanTask` router or `KanbanTask` model.)
- [ ] ToDo page shell: add a shadcn **Tabs** view toggle **Kanban | Calendar** (default Kanban) + a filter toggle **All | Assigned to me** (drives `list({ assignedToMe })`). Kanban view = existing board, but each `TaskCard` gains: a **due-date chip** (overdue flagged via `isOverdue`, using `hsl(var(--...))`/semantic destructive token) and a **🔗 source link** (via `sourceEntityLink`) when present.
- [ ] Verify: typecheck + lint; confirm `/todo` renders + `/kanban` redirects (route resolves).
- [ ] Commit `feat(todo): rename Kanban→ToDo, route move + redirect + due/source on cards`.

### Task 5: Calendar view

**Files:** Create `apps/web/src/app/[tenant]/todo/todo-calendar.tsx`; wire into the Tabs in `todo-board-client.tsx` (or a parent page client).

- [ ] Month grid (prev/next month header, weekday row, `monthMatrix`), each todo with a `dueDate` in the month rendered as a chip on its day (overdue flagged); clicking a chip opens the existing TaskDetailDialog (lift/share the dialog or navigate). A **left-side "No Due Date" list** of undated todos (click to open / set a date via the detail dialog).
- [ ] Respects the **Assigned to me** filter (same `list` query the board uses). Undated todos never appear on a day — only in the No-Due-Date list. Keyboard-navigable; `aria-label`s on day cells + chips.
- [ ] Verify: typecheck + lint.
- [ ] Commit `feat(todo): calendar month-grid view + no-due-date list`.

---

## Milestone C — "Make ToDo" integration

### Task 6: Reusable MakeTodoDialog + LinkedTodos section

**Files:** Create `apps/web/src/components/todo/make-todo-dialog.tsx` + `apps/web/src/components/todo/linked-todos.tsx`.

- [ ] `<MakeTodoDialog sourceEntityType sourceEntityId defaultTitle trigger? />`: shadcn Dialog with **title** (prefilled from `defaultTitle`, editable), **due date** (native date input, optional), **assignee** Select (default = current user, options from `user.listAssignable`), **priority** Select, optional **description**. Save → `kanbanTask.create` with source fields → toast + invalidate `kanbanTask.list` (and the linked-todos query). WCAG: labelled controls, focus, keyboard.
- [ ] `<LinkedTodos sourceEntityType sourceEntityId />`: queries `kanbanTask.list({ sourceEntityType, sourceEntityId })`; renders a compact list (title, status badge, due date, link into `/todo`); empty state "No todos yet". 
- [ ] Verify: typecheck + lint.
- [ ] Commit `feat(todo): reusable MakeTodoDialog + LinkedTodos components`.

### Task 7: Wire into the 4 record detail pages

**Files:** Modify `fisherfolk/[id]/fisherfolk-detail-client.tsx`, `vessels/[id]/vessel-detail-client.tsx`, `violations/[id]/violation-detail-client.tsx`, `ayuda/[id]/ayuda-detail-client.tsx`.

- [ ] Add a **"Make ToDo"** button (opens `<MakeTodoDialog>`) + a **"ToDos"** section (`<LinkedTodos>`) to each detail page. Prefill titles per spec: Violation `Follow up: {subject}`, Ayuda `Ayuda schedule: {title}`, Fisherfolk `Follow up / missing data: {fullName}`, Vessel `Follow up / missing data: {mfvrNumber}`. Pass `sourceEntityType` = `fisherfolk|vessel|violation|ayudaProgram`, `sourceEntityId` = record id. Gate by `canManage` where those pages already compute it; otherwise available to any viewer who can create.
- [ ] Verify: typecheck + lint.
- [ ] Commit `feat(todo): Make ToDo + linked ToDos on fisherfolk/vessel/violation/ayuda`.

### Task 8: Docs + final verification

- [ ] `pnpm --filter @frms/web run build` PASS.
- [ ] Rebuild dev container (`bash deploy/compose/start.sh dev up -d`) + browser-QA: `/todo` Kanban + Calendar views; view toggle + Assigned-to-me filter; create a todo w/ due date; overdue flag; Calendar chip + No-Due-Date list; `/kanban`→`/todo` redirect; "Make ToDo" from each of the 4 record types prefills + saves w/ source link + record shows linked todos + 🔗 deep-links back; WCAG axe on `/todo` (both views) = 0 serious/critical.
- [ ] Update `docs/STATE.md` + `docs/CHANGELOG_AI.md`; draft PRODUCT.md back-port (Candidate L) in `docs/BACKPORT_CANDIDATES.md`; log decisions in `docs/DECISIONS_LOG.md`.
- [ ] Commit `docs(todo): changelog + state + decisions + PRODUCT back-port draft`.

## Self-review (plan vs spec)

- Spec coverage: model 3 cols (T1), router create/update/list + validation (T2), helpers (T3), rename+route+redirect+kanban card enhancements (T4), calendar + no-due-date (T5), Make-ToDo dialog + linked list (T6), wired into 4 records (T7), redirect + WCAG + QA (T8) — all covered.
- Deferred (logged, not dropped): true drag-and-drop (kept MoveMenu). Out-of-scope YAGNI items (recurring, due-date notifications, week/day views) not built.
- entityType canonical set fixed lowercase per spec; one link helper resolves the 3-convention inconsistency.
