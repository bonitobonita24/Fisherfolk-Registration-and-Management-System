# PLAN — Calendar of Activities Dashboard (unified agenda home)

> Status: DRAFT design doc for owner review. NOT started. No code written.
> Author: architect scout, 2026-09-04. Feature slug: `calendar-activities`.
> Discipline: additive / single-family-parity style — do NOT break existing ToDo/Kanban.
> HARD HOLD: this plan is local; no build, no deploy.

---

## 1. Concept & scope

Replace the current **home page** (a fisherfolk heatmap + KPI dashboard) with a
**Calendar of Activities** — a unified monitoring view of everything scheduled that
concerns the logged-in user. Four streams merge into one agenda:

- **(a) Self-created** — tasks the user made for themselves.
- **(b) Shared-to-me** — tasks another user assigned/shared to this user.
- **(c) Announced-to-all** — org-wide events/announcements for the whole tenant.
- **(d) Entity-sourced todos** — the follow-up todos generated from domain records
  (fisherfolk, vessel, violation, ayuda) via the existing **Make ToDo** flow.

Crucially, **(d) already exists today**: an entity-sourced todo is just a
`KanbanTask` carrying `sourceEntityType` + `sourceEntityId`. (a) also exists as a
`KanbanTask` with `assignedToId = self`. The NEW work is (b) sharing to multiple
users and (c) org-wide announced events, plus a real **scheduling** dimension
(start time / all-day / event window) so a calendar can render them, and a single
"my agenda" query that unions all four.

### What the new home shows
- Default view: **month calendar** of the current user's agenda, colour-coded by source.
- Alternate views: **week**, **day**, and **list/agenda** (upcoming, grouped by day).
- Filters: by source (Personal / Fisherfolk / Vessel / Violation / Ayuda / Event),
  by status (To Do / In Progress / Done), by "assigned to me only" vs "all I can see".
- Each cell/row is clickable → opens the existing `TaskDetailDialog`, or the source
  record for entity-sourced items.

### Heatmap is RELOCATED, never deleted
The current `DashboardClient` (barangay density map + KPI cards + group tiles) moves
to a dedicated route, e.g. **`/[tenant]/insights`** (or keep `/[tenant]/dashboard`
and make the calendar the new landing target — see OPEN DECISION #4). The heatmap
component (`apps/web/src/app/[tenant]/dashboard/barangay-density-map.tsx`) and
`dashboard-client.tsx` are moved intact; sidebar nav gains an "Insights/Statistics"
link. No analytics logic is rewritten.

---

## 2. Current-state scout (exact paths & models)

### Prisma models (`packages/db/prisma/schema.prisma`)
**`KanbanTask`** (line 598) — the todo/kanban backbone:
```
id, tenantId, assignedToId (REQUIRED — single assignee, FK User),
title, description?, status (KanbanTaskStatus), priority (KanbanTaskPriority),
sourceCommentId? (unique, FK Comment), dueDate? (DateTime),
sourceEntityType? (String — app-validated, NOT a DB enum),
sourceEntityId? (String), createdAt, updatedAt
Indexes: (tenantId), (tenantId, assignedToId), (tenantId, status), (tenantId, dueDate)
```
Enums: `KanbanTaskStatus { TODO, IN_PROGRESS, DONE }`,
`KanbanTaskPriority { LOW, MEDIUM, HIGH, URGENT }`.
`sourceEntityType` is a free String validated at the app layer by
`kanbanTaskSourceEntityTypeSchema` → `"fisherfolk" | "vessel" | "violation" | "ayudaProgram"`
(see `apps/web/src/lib/todo-source.ts` `SourceEntityType`).

**Gaps for this feature:** single assignee only (no multi-share), no announce/org-wide
concept, only `dueDate` (no start time / all-day / event end), no recurrence, no
"created by" separate from "assigned to".

**`Notification`** (line 625): `id, tenantId, userId, type (NotificationType
{INFO,WARNING,SUCCESS,ERROR}), title, message, entityType?, entityId?, isRead, createdAt`.
One row **per recipient user** (fan-out). No broadcast/announce table.

### tRPC routers (`apps/web/src/server/trpc/routers/`)
- **`kanbanTask.ts`** — `list` (filters: status, priority, assignedToId, `assignedToMe`,
  sourceEntityType, sourceEntityId; paginated, orderBy priority desc/createdAt desc),
  `getById`, `create`, `update`, `delete`, `updateStatus`. All `protectedProcedure`,
  tenant-scoped via `ctx.tenantId`; `create` defaults `assignedToId` to `ctx.userId`
  and calls `assertSourceEntityExists()`.
- **`notification.ts`** — `listUnread`, `listAll`, `getUnreadCount`, `markRead`,
  `markAllRead`. All read-side; **no client-facing create/broadcast** exists yet
  (notifications are written server-side inside other flows).
- Shared Zod schemas live in `@frms/shared/schemas` (`kanbanTaskCreateSchema`,
  `kanbanTaskUpdateSchema`, `kanbanTaskSourceEntityTypeSchema`).
- Router wiring: `apps/web/src/server/trpc/root.ts`.

### UI (already present — reuse heavily)
- `apps/web/src/app/[tenant]/todo/todo-calendar.tsx` — **a month calendar already
  exists**, driven by `kanbanTask.list` + `monthMatrix()`/`tasksByDay`. This is the
  seed of the new home; generalise it, don't reinvent.
- `apps/web/src/app/[tenant]/todo/todo-board-client.tsx` — kanban board + exports
  `TaskDetailDialog`.
- `apps/web/src/components/todo/make-todo-dialog.tsx` — Make ToDo (title, description,
  priority, `assignedToId` via `user.listAssignable`, `dueDate`, source link).
- `apps/web/src/components/todo/linked-todos.tsx` — todos on a detail page.
- `apps/web/src/lib/todo-source.ts` — source labels/routes/href + WCAG-safe
  `URGENT_DESTRUCTIVE_CLASS` + date math (`startOfDay`, `sameDay`, `isOverdue`,
  `monthMatrix`, `addMonths`, `WEEKDAY_LABELS`, `formatDueDate`).
- Detail pages that emit entity todos: `fisherfolk/[id]`, `vessels/[id]`,
  `violations/[id]`, `ayuda/[id]` `-detail-client.tsx`.

### Home / landing routing
- `/[tenant]/dashboard/page.tsx` → `DashboardClient` (heatmap home today).
- `/[tenant]/page.tsx` → redirects to `/<slug>/dashboard` (landing flag off).
  Making the calendar the home = repoint this redirect (and/or swap the dashboard
  route's content). See OPEN DECISION #4.

### RBAC (`enum UserRole`, `apps/web/src/server/trpc/trpc.ts`, `lib/rbac/`)
Roles: `tenant_manager, tenant_superadmin, tenant_admin, encoder, viewer, bantay_dagat`.
Procedure helpers observed: `protectedProcedure`, `adminProcedure`,
`platformOrTenantAdminProcedure(feature, action)`, `tenantSuperadminProcedure`,
plus `canManage(role)` (`lib/rbac/can-manage`). Everything is tenant-isolated by
`ctx.tenantId`.

---

## 3. Data model changes (prefer EXTEND over new silo)

### 3a. Extend `KanbanTask` with scheduling + authorship (additive, nullable)
```prisma
model KanbanTask {
  // ... existing fields unchanged ...
  createdById   String?   @map("created_by_id")   // who authored (defaults to assignee today)
  startAt       DateTime? @map("start_at")         // scheduled start (calendar placement)
  endAt         DateTime? @map("end_at")           // event window end (optional)
  allDay        Boolean   @default(false) @map("all_day")
  kind          KanbanTaskKind @default(TASK)      // TASK | EVENT
  // dueDate stays as-is (deadline); startAt/endAt add true calendar semantics
  createdBy     User?     @relation("KanbanTaskCreatedBy", fields: [createdById], references: [id])
  shares        KanbanTaskShare[]
  @@index([tenantId, startAt])
}

enum KanbanTaskKind { TASK EVENT }
```
Rationale: calendars need a **placement instant** distinct from a *deadline*. Existing
rows keep working (calendar falls back to `dueDate` when `startAt` is null). `EVENT`
kind carries `allDay`/`endAt`; a plain `TASK` typically has just `dueDate`/`startAt`.

### 3b. New `KanbanTaskShare` — the "shared-to-users" stream (b)
A join table (many recipients per task) rather than overloading single `assignedToId`:
```prisma
model KanbanTaskShare {
  id         String   @id @default(cuid())
  tenantId   String   @map("tenant_id")
  taskId     String   @map("task_id")
  userId     String   @map("user_id")      // recipient
  createdAt  DateTime @default(now()) @map("created_at")
  task       KanbanTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id])
  tenant     Tenant     @relation(fields: [tenantId], references: [id])
  @@unique([taskId, userId])
  @@index([tenantId, userId])
  @@map("kanban_task_shares")
}
```
"Assigned to me" (owner) stays `assignedToId`; "shared with me" = a `KanbanTaskShare`
row. The agenda query unions both.

### 3c. Announced-to-all / events (c) — a `scope` flag, not a second silo
Add an audience scope to `KanbanTask` so an org-wide event is one row visible to all:
```prisma
model KanbanTask {
  audience   TaskAudience @default(PERSONAL) @map("audience")
}
enum TaskAudience { PERSONAL SHARED ANNOUNCED }  // ANNOUNCED = whole tenant
```
- `PERSONAL` — visible to assignee (+ creator).
- `SHARED` — visible to assignee + `KanbanTaskShare` recipients.
- `ANNOUNCED` — visible to **every active user in the tenant** (org-wide event); no
  per-user rows needed (avoids the Notification fan-out pattern for calendar display).

**Decision — reuse `KanbanTask` vs a separate `Event` model:** RECOMMEND reuse
(`kind=EVENT`, `audience=ANNOUNCED`) so one agenda query + one detail dialog + one
color system cover all four streams. A separate `Event` model would duplicate
scheduling, sharing, tenant-isolation, and UI. (OPEN DECISION #2.)

### 3d. Notifications (optional, phase 2)
On share/announce, optionally fan out `Notification` rows (existing model) so the
bell reflects new agenda items — reuses `Notification` + `notification-bell.tsx`
unchanged. Not required for the calendar to render; keep decoupled.

### Migration safety
All new columns are **nullable or defaulted** → additive, no backfill required.
Existing rows: `audience=PERSONAL`, `kind=TASK`, `startAt=null` (calendar uses
`dueDate`). `KanbanTaskShare` starts empty. `ALTER TYPE` never needed (new enums).
Follows the single-family-parity precedent (add columns + join table, no destructive
change). Add a `createdById` backfill = copy `assignedToId` for legacy rows (one-time,
optional, non-blocking).

---

## 4. tRPC surface

New router (or extend `kanbanTask`): **`activity` / `agenda`**.

### Queries
- **`agenda.myAgenda({ from, to, sources?, statuses?, mineOnly? })`** — the core union.
  Returns items where, within `[from,to]` (matched on `startAt ?? dueDate`) AND
  `tenantId = ctx.tenantId`, ANY of:
  - `assignedToId = ctx.userId` (self-created / assigned), OR
  - a `KanbanTaskShare` row with `userId = ctx.userId` (shared-to-me), OR
  - `audience = ANNOUNCED` (org-wide event — everyone), OR
  - (entity-sourced items already fall under the assignedTo/share rules — they are
    ordinary tasks with a `sourceEntityType`).
  Implemented as a single `findMany` with an `OR` where-clause; date filter on
  `startAt`/`dueDate`; `select` includes `sourceEntityType/Id`, `audience`, `kind`,
  `startAt`, `endAt`, `allDay`, `assignedTo`, share count. Tag each item with a derived
  `stream: "self" | "shared" | "announced" | "entity"` for colour coding.
- **`agenda.upcoming({ limit })`** — next N items for the list/agenda panel.
- Keep existing `kanbanTask.list` untouched (board still uses it).

### Mutations
- **`activity.create`** — extend `kanbanTaskCreateSchema` with `startAt?`, `endAt?`,
  `allDay?`, `kind?`, `audience?`, `shareWithUserIds?: string[]`. On create: write the
  task, then insert `KanbanTaskShare` rows for `shareWithUserIds`. `audience=ANNOUNCED`
  is **gated** (see RBAC).
- **`activity.share({ taskId, userIds })`** / **`activity.unshare`** — manage recipients
  (only creator/assignee or admin).
- **`activity.announce({ taskId })`** / **`activity.setAudience`** — flip audience to
  ANNOUNCED; **admin-gated**.
- Reuse `kanbanTask.update / updateStatus / delete` (extend update schema for new fields).
- Optional: on share/announce fan out `Notification` rows.

All procedures tenant-scoped; validate `shareWithUserIds` belong to the same tenant
(mirror `assertSourceEntityExists` pattern). Reuse `user.listAssignable` for the
recipient picker.

---

## 5. UI / UX

### Views
- **Month** (default) — generalise `todo-calendar.tsx`; render `myAgenda` for the
  visible month; each day cell shows up to ~3 chips + "＋N more".
- **Week** / **Day** — time-grid using `startAt`/`endAt`/`allDay`; all-day row on top.
- **List / Agenda** — upcoming items grouped by day (accessible default, good on mobile
  and best for screen readers).
- View switcher = shadcn `Tabs` or segmented `ToggleGroup`; keep month/week/day/list.

### Filters & colour coding
- Source filter chips: Personal, Fisherfolk, Vessel, Violation, Ayuda, Event
  (reuse `SOURCE_ENTITY_LABELS`). Status filter (To Do / In Progress / Done).
  "Only mine" toggle (assigned to me) vs "everything I can see".
- Colour by stream/source. **WCAG 2.2 AA (gov app, Rule 33/DICT MC 004):** colour is
  never the only signal — pair each colour with an icon + text label; reuse the proven
  `URGENT_DESTRUCTIVE_CLASS` (bg-red-700, AA-safe) for overdue/urgent. Verify contrast
  in light + dark. Keyboard-navigable grid (arrow keys between days), visible focus,
  `aria-label` per cell/chip, live-region on view/month change. Run `a11y-skill` /
  `accessibility-agents` + axe before done.

### Components (shadcn/ui only — Rule 21)
`Card`, `Tabs`/`ToggleGroup`, `Badge`, `Button`, `Popover`/`Dialog` (day overflow +
`TaskDetailDialog`), `Select` (filters), `Skeleton` for loading. Calendar library:
OPEN DECISION #3 — recommend **hand-rolled grid** (already have `monthMatrix`) for
month/list, evaluate a lib only if week/day time-grids get heavy.

### Detail interaction
Click a chip → existing `TaskDetailDialog` (from `todo-board-client.tsx`). Entity-sourced
items get a "View <Fisherfolk|Vessel|…>" link via `sourceEntityHref()`.

---

## 6. RBAC

- **See own agenda** — any authenticated tenant user (`protectedProcedure`): self +
  shared-to-me + announced.
- **Create personal task / share to specific users** — any user who `canManage` (same
  bar as today's Make ToDo). Encoders/bantay_dagat create/share their own tasks.
- **Announce-to-all (org-wide event)** — gated to **`tenant_admin` and above**
  (`tenant_admin`, `tenant_superadmin`, `tenant_manager`), via `adminProcedure` /
  `platformOrTenantAdminProcedure`. Rationale: an org-wide event is a broadcast; keep
  it with the admin tier (aligns with tenant-management gating). (OPEN DECISION #5 —
  should `encoder` also announce? default: NO.)
- **Tenant isolation** — every query/mutation filters `tenantId = ctx.tenantId`;
  `KanbanTaskShare` recipients validated in-tenant; `ANNOUNCED` scope means "this
  tenant's everyone", never cross-tenant.
- `viewer` — read-only agenda, no create/share/announce.

---

## 7. Phasing

**MVP (Phase 1) — unify what exists, minimal schema:**
1. Add `startAt`, `kind`, `createdById`, `audience` (default PERSONAL) to `KanbanTask`;
   `KanbanTaskShare` table; new enums. Migration additive.
2. `agenda.myAgenda` union query (self + shared + announced, date-ranged) + `upcoming`.
3. New home = **month + list** calendar rendering `myAgenda`, colour-coded, filters by
   source/status, reusing `todo-calendar.tsx` + `TaskDetailDialog`.
4. Relocate heatmap `DashboardClient` to `/insights` (or a tab); add nav link; repoint
   home. **Do NOT delete the heatmap.**
5. Extend Make ToDo / create with `startAt`, `shareWithUserIds`. Admin-gated announce.
6. a11y pass (axe + keyboard) + tests (router union query, RBAC gates, tenant isolation).

**Phase 2 — richer calendar:**
- Week/Day time-grid views (`endAt`/`allDay`).
- Notification fan-out on share/announce (reuse `Notification` + bell).
- Announce management UI (list org events, edit audience).
- Saved filter preferences (per-user).

**Phase 3 — advanced (gated on decisions):**
- Recurring events (see OPEN DECISION #1).
- ICS export / external calendar subscribe.
- Reminders / due-soon digest.

---

## 8. Integration & migration notes (additive, non-breaking)

- **ToDo board keeps working** — `kanbanTask.list` + board client unchanged; new fields
  are optional. The `/todo` page (board + its existing calendar tab) stays; the new home
  calendar is a superset view of the same `KanbanTask` data.
- **Entity-sourced todos need no new pipeline** — they are already `KanbanTask` rows with
  `sourceEntityType/Id`; they appear in the agenda automatically once `myAgenda` unions
  by assignee/share. Make ToDo dialog just gains a `startAt`/share option.
- **Migration is purely additive** — nullable/defaulted columns + one new join table +
  new enums; no `ALTER TYPE`, no destructive change, existing rows valid as-is. Calendar
  placement falls back `startAt ?? dueDate` so legacy tasks still render.
- **Cross-scope impact note** (per discipline): repointing the home route touches
  navigation, the landing redirect in `/[tenant]/page.tsx`, and any deep-link/bookmark to
  `/dashboard`; heatmap consumers (nav, showcase screenshots, SEO OG image
  `/showcase/01-dashboard.png`) must follow the relocated route. Record in SESSION_LOG +
  DECISIONS_LOG when built.
- **Tests to add** — `agenda.myAgenda` union correctness (self/shared/announced/entity),
  date-range boundaries, tenant isolation, announce RBAC gate, share validation. Follow
  existing `kanbanTask.test.ts` harness.

---

## OPEN [WHAT] DECISIONS (owner)

1. **Recurring events?** MVP = single-instance only. Recurrence (RRULE) is Phase 3 and
   materially larger. Default: defer.
2. **Reuse `KanbanTask` for events, or a separate `Event`/`Activity` model?**
   RECOMMEND reuse (`kind=EVENT`, `audience=ANNOUNCED`) — one query, one dialog, one
   color system. Confirm.
3. **Calendar rendering — hand-rolled grid vs a library** (FullCalendar / react-big-
   calendar / shadcn-compatible)? RECOMMEND hand-rolled month/list (already have
   `monthMatrix`), revisit for week/day time-grids. Confirm before pulling a dep.
4. **Does the calendar REPLACE the home, or become a new default tab?** Options:
   (A) calendar becomes `/[tenant]/dashboard` and heatmap → `/insights`;
   (B) keep `/dashboard` = heatmap, add `/calendar` and repoint the login landing to it;
   (C) home = tabbed shell [Calendar | Insights]. RECOMMEND (A). Confirm.
5. **Who may announce-to-all?** Default: `tenant_admin`+ only. Should `encoder` /
   `bantay_dagat` post org events too? Default: NO.
6. **Announcement lifecycle** — do announced events expire/auto-archive after their date,
   and can non-admins dismiss/hide an announced event from their own agenda? Default:
   events stay; add per-user hide in Phase 2.
7. **Notifications coupling** — fan out `Notification` rows on share/announce in MVP, or
   Phase 2? Default: Phase 2 (calendar renders without it).
