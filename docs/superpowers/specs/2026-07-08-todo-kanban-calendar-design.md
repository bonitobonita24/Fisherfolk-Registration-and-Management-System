# ToDo (Kanban + Calendar) — Design Spec

**Date:** 2026-07-08
**Status:** Approved (owner)
**Type:** Phase 7 Feature Update (FRMS)

## Problem / Goal

The office needs easy noting + scheduling tied to records: ayuda distribution dates,
violation follow-ups, and missing-/follow-up-data reminders on fisherfolk & vessels.
Today "Kanban" is a standalone assigned-task board with no due dates and no link to the
records the tasks are about. This feature reframes it as **ToDo** with a **Kanban view**
and a **Calendar view**, and adds a **"Make ToDo"** action on the key record pages.

## Decisions (locked with owner 2026-07-08)

1. **Shared team board** — everyone sees all todos; each has an assignee (default =
   creator, editable). Views show all, with an "Assigned to me" filter.
2. Rename **Kanban → ToDo** (nav label + route `/kanban` → `/todo`). Internal model/table
   stays `KanbanTask` / `kanban_tasks` (no churny rename migration).
3. **Calendar view** with a **"No Due Date"** left-side list for undated todos.
4. **"Make ToDo"** button on **Fisherfolk, Vessel, Violation, Ayuda** records, linking the
   todo back to its source record.

## Data model — extend `KanbanTask`

| Field | Type | Notes |
|-------|------|-------|
| `dueDate` | `DateTime?` | optional; powers Calendar + "No Due Date" list |
| `sourceEntityType` | `String?` | `fisherfolk` \| `vessel` \| `violation` \| `ayudaProgram` (mirrors `Notification.entityType`) |
| `sourceEntityId` | `String?` | id of the linked record |

- `assignedToId` stays **required**; "Make ToDo" and manual create default it to the
  current user (editable). Existing `status`, `priority`, `title`, `description`,
  `attachments`, `sourceComment` unchanged.
- Migration adds the three nullable columns only — non-destructive; existing tasks keep
  working (no due date, no source link). Index: `@@index([tenantId, dueDate])`.

## UI / UX

- **Rename**: nav item "Kanban" → **"ToDo"** (OPERATIONS group); move route dir
  `app/[tenant]/kanban` → `app/[tenant]/todo`; update `nav-items.ts` + all internal links;
  add a permanent redirect `/[tenant]/kanban` → `/[tenant]/todo` so old links don't 404.
- **ToDo page — view toggle** (top): **Kanban** | **Calendar**, plus a filter **All /
  Assigned to me**.
  - **Kanban view**: existing board (To Do / In Progress / Done columns, drag to change
    status). Cards gain a **due-date chip** and a **🔗 source-record link** when present.
  - **Calendar view**: a lightweight **month grid** (prev/next month), each todo rendered as
    a chip on its `dueDate` (overdue chips visually flagged); clicking a chip opens the todo.
    A **left-side "No Due Date" list** shows undated todos (click to open / set a date).
    Built with plain date math — **no new heavy calendar dependency**.
- **"Make ToDo" dialog** (button on Fisherfolk / Vessel / Violation / Ayuda detail pages):
  - **Title prefilled by context**, editable:
    - Violation → `Follow up: {subject}`
    - Ayuda (program) → `Ayuda schedule: {title}`
    - Fisherfolk → `Follow up / missing data: {fullName}`
    - Vessel → `Follow up / missing data: {mfvrNumber}`
  - Fields: **due date** (optional), **assignee** (default = current user), **priority**,
    optional description. On save → creates a `KanbanTask` with `sourceEntityType/Id` set.
  - The record detail page shows a small **"ToDos"** section listing its linked todos (status
    + due date + link into the ToDo board).

## Behavior

- A todo with no `dueDate` never appears on a calendar day — only in the "No Due Date" list.
- Overdue = `dueDate < today` and `status != DONE`; flagged in both views.
- The 🔗 link deep-links to the source record's detail page.
- Filter "Assigned to me" scopes both views to `assignedToId == current user`.

## Backend (`kanbanTask` router)

- Extend `create` / `update` inputs with `dueDate?`, `sourceEntityType?`, `sourceEntityId?`.
- `list` gains optional filters: `assignedToMe?`, and (for the record "ToDos" section)
  `sourceEntityType?` + `sourceEntityId?`. Keep tenant isolation + existing permissions.
- Validate `sourceEntityType` against the allowed set; `sourceEntityId` must resolve within
  the tenant when provided.

## Permissions

Mirror existing Kanban permissions (protectedProcedure, tenant-scoped). "Make ToDo" is
available wherever the user can view the source record and create tasks.

## Out of scope (YAGNI)

- Recurring todos, reminders/notifications on due dates (could reuse the Notification system
  later), week/day calendar views, sub-tasks, cross-tenant boards.
- Renaming the DB model/table (`KanbanTask` stays; only UI + route are "ToDo").

## Verification

- Migration applies cleanly (dev); typecheck/lint/build green.
- Kanban view still works (drag status); Calendar view shows dated todos + "No Due Date" list;
  view toggle + "Assigned to me" filter work.
- "Make ToDo" from each of the 4 record types prefills correctly, saves with the source link,
  and the record page lists its linked todos; 🔗 deep-links back.
- Old `/kanban` links/nav resolve to `/todo` (redirect or updated links — no dead nav).
- WCAG 2.2 AA on the ToDo page (both views) — gov hard gate. Dark-mode legible.
