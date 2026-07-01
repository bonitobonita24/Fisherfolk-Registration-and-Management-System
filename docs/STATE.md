# FRMS — Project State

## Current State (2026-07-01)

Branch `swarm/id-generator` is the active feature branch for the ID Generator / ID Card Printing wave.
Branch `swarm/registration-status-timeline` contains completed Wave 1 (registration-status timeline) work.

### Completed this session (S2 — ID Generator router hardening)

- **`apps/web/src/server/trpc/routers/idTemplate.ts`** — hardened with L5 AuditLog writes and `duplicate` mutation:
  - `create`: writes `auditLog(CREATE, after=created)` after the DB insert.
  - `update`: reads `existing` for before-snapshot; writes `auditLog(UPDATE, before, after)`.
  - `archive`: reads `existing`; writes `auditLog(UPDATE, before, after)` (AuditAction has no ARCHIVE; UPDATE is the correct action per fisherfolk.ts convention).
  - `delete`: deletes first, then writes `auditLog(DELETE, before=existing)` — order fixed to avoid phantom audit entries on delete failure.
  - `duplicate` (new): tenant-scoped load → create copy with `name "<source> (copy)"`, `status: ARCHIVED` (IDTemplateStatus only has ACTIVE|ARCHIVED; ARCHIVED avoids getActive collisions); writes `auditLog(CREATE, after=copy)`.
  - All mutations retain the `if (!ctx.tenantId) FORBIDDEN` guard.
- **`packages/shared/src/schemas/id-template.ts`** — added `idTemplateDuplicateSchema = z.object({ id: z.string().cuid() })`.
- **`apps/web/src/server/trpc/routers/__tests__/idTemplate.test.ts`** (new) — 16 DB-integration tests (skip when no DATABASE_URL): create/update/archive/delete each write the correct AuditLog; duplicate produces ARCHIVED copy that does not collide with `getActive`; cross-tenant `getById`/`update`/`duplicate` all return NOT_FOUND; non-admin (encoder/viewer) FORBIDDEN on all mutations.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 37 skip-DB), 16 new tests correctly skipped in CI.
- **Code-review gate**: ran (3 angles × parallel agents); 1 in-scope finding fixed (delete mutation order: audit-before-delete → delete-first-then-audit to avoid phantom audit entries); 2 out-of-scope deferred findings (non-atomic audit tradeoff + TOCTOU before-snapshot — both are fleet-wide patterns matching fisherfolk.ts).

### Completed this session (S1 — ID Generator shared schemas)

- **`packages/shared/src/schemas/id-template.ts`** — fully rewritten (26→145 lines):
  - `idElementSchema`: Zod discriminated union on `type` field with 7 members (`text`, `variable`, `image`, `icon`, `photo`, `signature`, `qr`). Common base: `id`, `xMm`, `yMm`, `widthMm`, `heightMm`, `rotation` (default 0), `zIndex`. Text/variable members add typography mixin (`fontFamily`, `fontSizePt`, `fontWeight` 400|500|600|700, `color` hex-6 regex, `align` left|center|right). Variable adds `variableKey` from catalog enum. Image adds `url`. Icon adds optional `emoji`/`url`.
  - `ID_CARD_GEOMETRY` typed const: content 86×54mm, bleed 90×58mm, bleed margin 2mm, sheet 200×300mm, 4 pairs/sheet.
  - `TEMPLATE_VARIABLES` catalog: 15 FISHERFOLK vars + 11 VESSEL vars + 3 SHARED vars; each entry `{key, label, group, kind}`.
  - `templateVariableKeySchema` Zod enum derived from catalog.
  - `idTemplateCreateSchema` / `idTemplateUpdateSchema` — `frontElements`/`backElements` upgraded from `z.array(z.record(z.string(), z.unknown()))` to `z.array(idElementSchema)`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** — 19 Vitest unit tests covering: all 7 element types pass; default rotation; rejection of unknown type / missing mm fields / bad hex / unknown variableKey / non-URL; geometry constant correctness; bleed = content + 2×margin; variable catalog completeness and all keys pass templateVariableKeySchema.
- **Validation**: typecheck ✅ (0 errors), test ✅ (178 pass / 21 DB-skip, 19 new), lint ✅, db:generate ✅ unaffected.
- **Code-review gate**: ran; 1 in-scope finding (icon validation gap — `.refine()` inside discriminatedUnion returns ZodEffects, Zod v3 requires ZodObject members) documented in code comment; deferred to application layer in S2+. 3 out-of-scope deferred items logged.

### Completed this session (SD — ID Generator docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 ID Generator entry with 6 locked sub-decisions (a–f): (a) typed discriminated-union element schema (text/variable/image/icon/qr/photo/signature, mm-based, 86×54mm/90×58mm); (b) Template Editor adminProcedure + dnd-kit DOM/CSS-mm NOT canvas; Select & Print = encoder+admin; (c) DOM+@media print, 200×300mm PVC sheet, back mirrored scaleX(-1), empty dashed placeholders; (d) Select & Print checkout blocks missing photo OR signature; (e) IDPrintBatch entity per print run; (f) printing decoupled from 'ID Released' (markIdReleased stays separate Wave 1 action). Two open [WHAT] questions flagged for owner (vessel IDs scope, Daily-Ops widget timing).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added Batch 4 — ID Generator / ID Card Printing section (schema/entities, template editor, select & print, open [WHAT] questions); updated DECISIONS_LOG.md count 16→17.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S0)

- **Prisma schema** — `RegistrationRenewal` model added; `Fisherfolk` extended with `idReleasedAt`/`idReleasedById`/`idReleasedBy`/`renewals`; inverse relations wired on `User` and `Tenant`.
- **Migration** — `20260701000000_registration_renewal_and_id_released` (additive: CREATE TABLE + 2 ADD COLUMN).
- **Prisma client** regenerated (v6.19.3).
- **Typecheck** passes (0 errors).

### Completed this session (SD — docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 entry with 5 locked sub-decisions (a–e): ID-release manual staff action, NEW/RENEWED badge derivation from `_count.renewals`, renew mutation rules (encoder role + active-violation block + AuditAction.RENEW), new entities (RegistrationRenewal + Fisherfolk.idReleasedAt/idReleasedById), activity timeline sanitization policy (action/actor/timestamp only, no diffs, protectedProcedure).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added NEW/RENEWED badge row to Batch 1b list table; added 4 pending (⏳ S1+) rows to Batch 3 profile table for renew mutation, markIdReleased mutation, renewal timeline panel, and right-side activity timeline.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S1 — tRPC backend wave)

- **Shared Zod schemas** — `fisherfolkRenewSchema`, `fisherfolkMarkReleasedSchema`, `fisherfolkActivityQuerySchema` added to `@frms/shared`.
- **`fisherfolk.renew`** (encoderProcedure) — active-violation PRECONDITION_FAILED guard; duplicate-year CONFLICT guard (inside `$transaction`); creates `RegistrationRenewal` + flips `status→RENEWED` + `auditLog(RENEW)` all atomic in one transaction.
- **`fisherfolk.markIdReleased`** (encoderProcedure) — idempotent (early-return if already set); `$transaction` wraps `fisherfolk.update` + `auditLog(UPDATE)`.
- **`fisherfolk.getActivity`** (protectedProcedure) — tenant+entity scoped; sanitized output `{id, action, actorName, createdAt}` — no before/after diffs.
- **`list` select** extended: `+idReleasedAt`, `+_count.renewals` for badge derivation.
- **`getById` include** extended: `+renewals` (take:20, desc) with `renewedBy{name,email}`.
- **Tests** — 5 DB-integration tests in `src/server/trpc/routers/__tests__/fisherfolk.test.ts` (skip in CI; run locally with DATABASE_URL).
- Commit `a9f48c5` on `swarm/registration-status-timeline`.

### Completed this session (S2 — list badge columns)

- **`FisherfolkListItem` interface** extended with `idReleasedAt: string | null` and `renewalCount: number`.
- **Registration-Type column** added to fisherfolk list: derives NEW (renewalCount===0) or RENEWED (renewalCount>0); renders `<StatusBadge>` with explicit color override (green/orange) — does NOT fall through to `statusColorMap`.
- **ID-Release column** added: idReleasedAt null → gray "Not Released" badge; non-null → green "Released" badge with tooltip showing the formatted release date.
- **`fisherfolk-list-client.tsx`** updated to explicitly map tRPC items to `FisherfolkListItem`, converting `idReleasedAt` (Date|null via superjson → ISO string|null) and `_count.renewals` → `renewalCount`.
- lint/build/typecheck all green; code-review gate ran (1 in-scope finding fixed: `String()` → direct pass-through for non-Date idReleasedAt values).
- Commit on `swarm/registration-status-timeline`.

### Completed this session (S3 — profile UI wave)

- **Two-column shell** — `grid gap-6 lg:grid-cols-[1fr_320px]` wrapping LEFT main column (Profile + Renewal History + related records) and RIGHT `<aside aria-label="Activity timeline">` placeholder Card (S4 will render the feed).
- **Registration status line** in header: 0 renewals → NEW (green badge) + "New registration"; ≥1 → RENEWED (orange badge) + "Last renewed [date]"; always shows original `dateJoined`.
- **Renewal History Card** (left column): lists `record.renewals` (year · renewedAt · who · notes); empty state "No renewals yet."
- **ID-Release line** inside Profile Card fields: Released (date + who) or "ID not yet released" from `record.idReleasedAt` / `record.idReleasedBy`.
- **Action buttons** (encoder/admin/super_admin only via `trpc.user.me`): Renew Registration (disabled+tooltip when active violation; uses shared `ConfirmDialog`; on success invalidates `getById`; toast on success/error; dialog stays open on error via re-throw); Mark ID Released (hidden once `idReleasedAt` set; uses `ConfirmDialog`).
- **`getById` router** extended: added `idReleasedBy: { select: { name, email } }` to support "Released by [name]" display.
- **Code review fixes**: used shared `ConfirmDialog` instead of inline Dialog (removes redundant open/loading state); added visible placeholder Card to `<aside>` to prevent empty landmark WCAG issue; dialog stays open on mutation error (re-throw pattern).
- lint/typecheck/build all green.

### Completed this session (S4 — activity timeline aside)

- **`fisherfolk-activity-timeline.tsx`** (new client subcomponent under `[id]/`) — queries `fisherfolk.getActivity`; renders semantic `<ol>/<li>` feed (newest-first); each entry: WHO (actorName), WHAT (label + aria-hidden icon), WHEN (`<time dateTime>`); `lg:sticky lg:top-4`; loading skeleton (WCAG: `role="status"` + sr-only text + `aria-hidden` ol); empty state; `motion-reduce:animate-none` on pulse animations.
- **`fisherfolk-detail-client.tsx`** — aside placeholder replaced with `<FisherfolkActivityTimeline id={id} />`.
- lint/build both green.

### Completed this session (S5 — QA / validation gate)

- **typecheck** ✅ (0 errors), **lint** ✅ (0 warnings), **test** ✅ (159 pass / 21 skip-DB), **build** ✅
- **db:generate** ✅ (Prisma v6.19.3); **S0 migration** confirmed additive-only (ADD COLUMN + CREATE TABLE, no DROP/ALTER)
- **WCAG 2.2 AA** — code-level audit green: list badge columns (text-not-color-only, StatusBadge renders label text); profile registration-status badge + accompanying text + `<ul aria-label="Renewal history"><li>` + RBAC-gated action buttons with aria-labels + disabled tooltip `tabIndex+aria-label`; activity timeline `<ol aria-label="…"><li>` + `<time dateTime>` + `aria-hidden` icons + `role="status"` skeleton + `motion-reduce:animate-none`; `<aside aria-label="Activity timeline">`.
- **RBAC** — `renew` and `markIdReleased` are `encoderProcedure` (FORBIDDEN for viewer/bantay_dagat); `renew` writes RegistrationRenewal + flips status→RENEWED + AuditAction.RENEW atomically; `markIdReleased` idempotent; `getActivity` tenant-scoped, sanitized output (no before/after).
- **Code-review fixes applied** (2 in-scope findings):
  1. `fisherfolk-detail-client.tsx` — added `utils.fisherfolk.getActivity.invalidate({ id })` to `handleRenew` and `handleMarkReleased` (stale timeline fix)
  2. `fisherfolk.ts:574` — `log.user?.name ?? log.user?.email ?? null` defensive null-guard
- **Playwright smoke** — 17/17 checks pass (port 44387): list New/Renewed + Released/Not-Released badges ✅; profile status badge + Renewal History card + Activity Timeline aside ✅; Renew flips badge→RENEWED + renewal-history row inline ✅; timeline RENEW entry visible after reload ✅ (inline reactivity gap confirmed — addressed by S5 code-review fix). ⚠ Migration drift: dev DB frozen at June 29 migration; smoke agent applied S0 migration manually — `prisma migrate deploy` MUST run on any QA env before testing.

### Open / pending

- `formatAbsolute`/`formatDate` shared utility extraction (multi-file duplication) — deferred refactor (bucket A follow-up)
- `hasActiveViolation` is derived from `violations take:5` in getById — if a fisherfolk has >5 violations and the 6th is active, the Renew button won't show disabled (server still blocks; UX degrade only). Fix: add `activeViolationCount` field to getById (deferred).
- Performance indexes (deferred from S0 code review): `@@index([tenantId, renewalYear])` on RegistrationRenewal; index on `fisherfolk(id_released_by_id)`
- TOCTOU on violation check in `renew` (violation.count is pre-transaction; low-probability race) — architectural fix deferred
- `_count.renewals` on `list` runs a COUNT subquery on all list callers including autocomplete dropdowns — consider splitting to a lean `listSummary` for dropdowns (deferred, needs API split)

### Main branch state

`main` is clean at `08f9054` (back-port candidates A–I). All prior PRs (#1–#9) merged.

### Deployment gate

HARD HOLD — no staging/production deploy until owner explicitly authorizes.
