# CRUD Demo Build — autonomous reboot-loop queue

**Branch:** `feat/violations-ayuda-kanban-crud` (off main). UNMERGED, unpushed (HARD HOLD).
**Goal:** Full CRUD for Violations, Ayuda Programs, Kanban so seeded demo data is viewable + manageable.
**Owner directive (2026-06-28):** build this as a self-rebooting loop — ONE task per session, save + reboot
(`close-session`, no `--stop`) between tasks to avoid context drift.

## Loop protocol (every session does this)
1. Run the anti-thrashing scope check. Read ONLY the files for the current task.
2. Reference pattern is the **Vessels** module: `apps/web/src/app/[tenant]/vessels/` (page.tsx,
   *-list-client.tsx, columns.tsx, [id]/*-detail-client.tsx, register/registration-form-client.tsx).
3. Do the FIRST unchecked `[ ]` task below. Dispatch parallel `spec-executor`s for independent files
   (R7). Verify `cd apps/web && pnpm exec tsc --noEmit` clean. Do NOT run `pnpm build`/`pnpm dev`
   (breaks the running dev server's .next).
4. Commit (Rule 23 — this branch, never main). Check off the task here.
5. Rewrite `.sessions/slot-1/next-session` (keep the same directive line) and `close-session`.
6. When ALL tasks are checked: rebuild + browser-QA all flows, then `close-session --stop`.

## Backends (already built + mounted — do NOT rebuild unless a gap is noted)
- `violation`: list, getById, create. **GAP: no lift/update/archive** → add in T3a.
- `ayuda`: listPrograms, getProgramById, createProgram, publishProgram, closeProgram,
  listBeneficiaries, addBeneficiary, verifyBeneficiary. (rich — no gaps expected)
- `kanbanTask`: list, getById, create, update.

## Queue

### Phase 1 — List views
- [x] Violations / Ayuda / Kanban list+board views (commit fb2b220, 2026-06-28)

### Phase 2 — Detail views
- [x] **T2a** Violations detail `[tenant]/violations/[id]` via `violation.getById` — subject, details,
  target (linked fisherfolk/vessel), status, filed-by, dates, evidence images. Link from the list row.
  (commit e05f1f5, 2026-06-28. NOTE: `violation.lift` already exists in the router — T3a gap note is stale.)
- [x] **T2b** Ayuda program detail `[tenant]/ayuda/[id]` via `ayuda.getProgramById` +
  `ayuda.listBeneficiaries` — program header + beneficiaries table (status, verified-by). Link from list.
  (commit cd513ec, 2026-06-28)
- [x] **T2c** Kanban task detail — dialog opened from a board card via `kanbanTask.getById` (or reuse
  the card data). Show full task fields. (commit e62479c, 2026-06-28. Card is role=button+focusable;
  dialog shows status, assignee, description, source comment, created/updated.)

### Phase 3 — Create / Edit / Actions
- [x] **T3a-1** Violations backend + lift action (commit c446172, 2026-06-28): `violation.lift`
  already existed; added `violation.update` (admin-gated, ACTIVE-only, audit-logged). Admin-gated
  Lift/Resolve dialog on the detail view (resolution-notes textarea → `violation.lift` → invalidate).
  page.tsx computes `canManage` (super_admin/admin) via `auth()`.
- [x] **T3a-2** Violations "File Violation" create form (`violation.create`) — target = FISHERFOLK /
  VESSEL / BOTH with fisherfolk + vessel searchable single-pickers (fisherfolk.list + vessel.list);
  follows `vessels/register/registration-form-client.tsx`. New route `violations/file/page.tsx`
  + form client + role-gated "File Violation" button on the list. NOTE: page/button gated to
  **super_admin/admin only** (not encoder) — `violation.create` is `adminProcedure`; gating encoder
  would show a form that 403s. (2026-06-28)
- [ ] **T3b** Ayuda: Create Program form (`createProgram`) + Publish/Close actions
  (`publishProgram`/`closeProgram`) + Add Beneficiary (`addBeneficiary`) + Verify Beneficiary
  (`verifyBeneficiary`) on the program detail. **SCOPE-CHECK: likely split into T3b-1 (program CRUD)
  and T3b-2 (beneficiary actions)** if >12 files / >80K.
- [ ] **T3c** Kanban: Create Task dialog (`kanbanTask.create`) + Edit/Move (`kanbanTask.update`) —
  status change via a per-card menu (drag/drop optional, not required for demo).

### Phase 4 — Verify + close
- [ ] **T4** Rebuild dev app, browser-QA all three modules end-to-end (list → detail → create → edit →
  action), screenshots to test-artifacts/. Update project memory. Then `close-session --stop`.

## Notes
- Demo data already seeded (80 vessels, 12 violations, 3 ayuda programs/120 beneficiaries, 15 kanban).
- Running dev app currently built from `fix/csp-runtime-storage-origin` (has the CSP fix); a rebuild
  from this branch is needed before browser-QA of the new pages (do it in T4, or per-task if verifying UI).
- Sibling unmerged branches awaiting owner: `feat/deploy-seed` (seed pipeline + kanban seed),
  `fix/csp-runtime-storage-origin` (runtime CSP fix).
