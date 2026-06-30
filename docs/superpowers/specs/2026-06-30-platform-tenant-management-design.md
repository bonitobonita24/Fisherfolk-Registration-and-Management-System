# Platform Tenant Management — Design

**Date:** 2026-06-30 · **Branch:** `feat/platform-tenant-management` · **Status:** approved (owner, 2026-06-30)

## Problem

`/platform/tenants` ("Tenant Management") is a stub — it renders only a heading + description
and lists no tenants (not even Calapan City). The backend `tenant.list` query already exists and
works; the page just never called it. Owner wants the full feature: list + create (with provisioning)
+ activate/deactivate. Access is super_admin only.

## Decisions (owner-approved 2026-06-30)

1. **Create provisions tenant + initial admin user atomically.** A tenant is unusable without a
   login, and there is no separate user-management UI yet.
2. **Deactivate (SUSPENDED) enforces access control** — blocks login and invalidates active
   sessions — via a live tenant-status check (NOT a securityVersion bump; reversible, no extra writes).

## Backend — `apps/web/src/server/trpc/routers/tenant.ts` (add 2 `superAdminProcedure`s)

- **`create`** — input `{ name: string(min1), slug: string(/^[a-z0-9-]+$/), admin: { username: string(min3), fullName: string(min1), password: string(min12) } }` (`.strict()`).
  In a `ctx.db.$transaction`: create `Tenant` (status `ACTIVE`) → `bcrypt.hash(password, 12)` →
  create admin `User` (role `admin`, status `ACTIVE`, `tenantId`). Pre-check slug uniqueness
  (`Tenant.slug`) and username uniqueness (`User.username`) → `TRPCError CONFLICT` with a clear
  message. Write an `auditLog` (action `CREATE`, entityType `Tenant`). Return the created tenant
  (id, slug, name, status).
- **`setStatus`** — input `{ id: string, status: z.enum(["ACTIVE","SUSPENDED"]) }` (`.strict()`).
  `ctx.db.tenant.update` status; `auditLog` (action `UPDATE`, before/after status). Return updated
  `{ id, status }`. (No self-suspend guard needed — super_admin has no tenant.)
- `list` already exists (paginated, search by name/slug, returns `_count.users`/`_count.fisherfolk`).

`bcrypt`, `TRPCError`, `z`, `superAdminProcedure` are already imported / available in this router or its siblings.

## Auth enforcement — `apps/web/src/server/auth/index.ts`

- **`authorize()`** — the existing query already does `include: { tenant: true }`. After the
  existing role/tenant checks, reject login when `user.tenant?.status === "SUSPENDED"` (super_admin
  has no tenant → unaffected). Return `null`.
- **`session()` callback** — extend the existing `dbUser` lookup to also select the user's
  `tenant: { select: { status: true } }`. Throw `SESSION_INVALIDATED` when
  `dbUser.tenant?.status === "SUSPENDED"` (in addition to the existing user-status/securityVersion
  checks). Forces suspended tenants' active sessions out on next request; reactivation restores access.

## Frontend — `apps/web/src/app/platform/tenants/`

- **`page.tsx`** — keep the server shell (heading + description); render `<TenantsClient />`.
- **`tenants-client.tsx`** (new, `"use client"`) — `trpc.tenant.list` (page 1, limit 20, debounced
  `search`). shadcn `<Table>`: columns Name, Slug, Status (`<Badge>` — green ACTIVE / muted
  SUSPENDED), #Users (`_count.users`), #Fisherfolk (`_count.fisherfolk`), Created, Actions.
  "Create Tenant" button opens the dialog. Per-row `<DropdownMenu>`: Activate (when SUSPENDED) /
  Deactivate (when ACTIVE, with a confirm) → `trpc.tenant.setStatus` → toast + invalidate list.
  Empty state + loading skeleton per existing conventions.
- **`create-tenant-dialog.tsx`** (new, `"use client"`) — shadcn `Dialog` + `Form`: tenant name,
  slug (auto-suggested from name via slugify, editable), admin username, admin full name, admin
  password. Client zod validation mirrors the server input. Submit → `trpc.tenant.create` →
  success toast + close + invalidate list; surfaces `CONFLICT` (dup slug/username) inline.

## Testing

- **Vitest server tests** (match `apps/web/src/server/__tests__/` patterns) — `create`: happy path
  (tenant + admin user created, password hashed), duplicate slug → CONFLICT, duplicate username →
  CONFLICT. `setStatus`: suspend then assert an `authorize()`-equivalent path rejects the tenant's
  user; reactivate restores.
- **Playwright QA** (manual, via the host prod-build harness): Calapan City appears in the list →
  create a tenant → its admin can log in → deactivate → admin login blocked → reactivate → allowed.

## Files (~6)

`tenant.ts` (edit), `auth/index.ts` (edit), `page.tsx` (edit), `tenants-client.tsx` (new),
`create-tenant-dialog.tsx` (new), tenant router test (new/edit). New branch, held for owner review
(HARD HOLD — no staging/prod deploy).

## Out of scope (future)

Editing tenant settings from the platform view (already exists per-tenant via `updateSettings`),
tenant deletion, bulk actions, full user-management UI, custom-domain assignment from this screen.
