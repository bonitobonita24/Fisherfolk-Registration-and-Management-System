# Decisions Log — FRMS
# Locked decisions. Never re-ask anything listed here.
# Format: ## Decision Title → Decision / Rationale / Locked: yes

---

## FIS-12 registration status model — build decisions (2026-08-31)
Decision: registration status is now **NEW / RENEWED / EXPIRED** (+ ARCHIVED for soft-delete); ACTIVE/INACTIVE
retired from active use (enum values kept — Postgres can't drop them). "Valid/registered" = {NEW, RENEWED}.
Renew requires status = EXPIRED. `resetAnnualRegistrations` repurposed as the tenant-scoped **post-election
bulk-expire** (NEW/RENEWED → EXPIRED, audit-logged, adminProcedure-gated) — BUILT but DEFERRED (run only after
a mayoral election).
Sub-decisions ([HOW]):
  (a) **Data backfill mapping (⚠ owner sign-off before prod):** existing `ACTIVE → NEW`, `INACTIVE → EXPIRED`.
      Rationale: retiring ACTIVE from queries without migrating rows would hide every current fisherfolk from
      valid lists/counts. Applied to dev only so far; the prod migration is a separate owner-gated deploy.
  (b) **Enum migration discipline:** ADD VALUE (non-txn) in its own migration + a separate backfill migration
      (`ALTER TYPE … ADD VALUE` cannot be used in the same txn it's created in). Never DROP/CREATE the enum.
  (c) **Bulk-expire kept the existing name** (`resetAnnualRegistrations`) to minimize blast radius; a rename to
      a bulk-expire-specific name is deferred, to be reconciled with FIS-15 (renewal cadence, still open).
Locked: yes (backfill mapping provisional pending owner prod sign-off).

## ToDo (Kanban + Calendar) — [HOW] locked implementation decisions
Decision: The standalone Kanban board is reframed as **ToDo**, a feature with two views (Kanban +
Calendar) over the SAME underlying `KanbanTask` model/table — no rename at the DB layer.
Sub-decisions:
  (a) **Kanban→ToDo rename keeps the DB model**: `KanbanTask` / `kanban_tasks` names are unchanged;
      only UI copy, nav label, and the route path (`/todo`) changed. Avoids a destructive rename
      migration for a cosmetic/UX change.
  (b) **Kept `MoveMenu`, no drag-and-drop library added**: status changes on the Kanban board continue
      via the existing dropdown MoveMenu. Adding a dnd library (e.g. dnd-kit) is a deferred enhancement,
      not required for this feature to ship.
  (c) **Hand-built Calendar view, no calendar dependency**: the month-grid Calendar view is built with
      plain date/month-grid helper functions; no react-day-picker or other calendar library was added.
      Matches the framework's OSS-first / minimal-dependency posture (Rule 14).
  (d) **`sourceEntityType` is a canonical lowercase enum**: `fisherfolk | vessel | violation |
      ayudaProgram`. The router validates the referenced source entity exists in-tenant on both
      create and update (rejects cross-tenant or non-existent source links).
  (e) **Assignee defaults to the current user**: `kanbanTask.create` defaults `assignedToId` to the
      calling user when the caller omits it; `user.listAssignable` (protectedProcedure) lets any
      authenticated user — not just admins — pick a different assignee from the tenant's user list.
  (f) **`/kanban` → `/todo` permanent redirect**: the old route path permanently redirects to the new
      `/todo` route rather than being removed outright, so any bookmarked/old links keep working.
Rationale: keeps the change additive and non-destructive (no schema rename, no dependency additions),
reuses proven UI patterns (MoveMenu) instead of introducing new interaction complexity, and gives every
record type (Fisherfolk/Vessel/Violation/Ayuda) a consistent "Make ToDo" + linked-todos pattern via
reusable `<MakeTodoDialog>` / `<LinkedTodos>` components.
Reference: docs/superpowers/specs/2026-07-08-todo-kanban-calendar-design.md
Locked: yes — do not re-ask. Branch: feat/household-management (commits cbe79ed, 471002a, deb061e,
e2e07b2, c5fe255, 07302a4, 11914e2).

## Household Management — [HOW] locked implementation decisions
Decision: Household is an explicit `Household` model (head Fisherfolk + members; the head is ALSO
a member — head-is-member invariant enforced by the router on create/update, never violated).
Sub-decisions:
  (a) **Household category for counts** = the head's fisherfolk category. A household has no
      independent category field; dashboard/report groupings use `head.categories`.
  (b) **Head-is-member invariant**: creating/updating a household always includes the head in the
      members set; the router rejects a members list that omits the head. Removing the head requires
      first designating a new head (change-head flow), never a bare removal.
  (c) **HH-#### auto-numbering**, per tenant (parallel to the existing FF-#### / MFV-#### schemes).
      Sequential per-tenant counter, no cross-tenant sharing.
  (d) **Ayuda `distributionUnit`** (FISHERFOLK|HOUSEHOLD) is set ONLY at ayuda-program creation time.
      No edit-program form exists in the codebase, so distributionUnit is immutable after creation
      for the life of the program (provisional — revisit if an edit-program feature is ever built).
  (e) **No backfill** of existing fisherfolk into households. Only NEW household records (created
      going forward) exist; the 3,000+ imported/legacy fisherfolk remain un-householded unless an
      admin manually creates a household for them. Dummy/demo household data exists ONLY in local
      dev + demo per the standing data-seeding policy (docs/DATA_SEEDING_POLICY.md) — never
      generated for staging/prod.
  (f) **Delete household unlinks, never deletes**: removing a Household clears `Fisherfolk.householdId`
      on all its former members; the fisherfolk records themselves are untouched.
Rationale: keeps household semantics additive/opt-in over the existing fisherfolk-centric data model,
avoids retroactive data mutation on 3,000+ live records, and matches the ayuda distribution model
already locked (per-fisherfolk vs per-household beneficiary counting).
Reference: docs/superpowers/specs/2026-07-08-household-management-design.md
Locked: yes — do not re-ask. Branch: feat/household-management (commits 4b0995e, 6e1da3a, e83493d,
de6a42a, fd572d0, 1a3eb7a, 5132016, 2e2eadd, 3d1897a).

## Anti-Thrashing Enforcement Mechanism
Decision: UserPromptSubmit hook in .claude/settings.json (mechanical injection),
NOT CLAUDE.md rule alone (advisory).
Rationale: The locked anti-thrashing rule (lessons.md 2026-05-08 🟤 — "per-task
token estimates required before starting Phase 8 work") was discoverable via
memory but not auto-injected on phase/batch triggers. Manual paste of the
scope-assessment preamble at the top of each session worked but was easy to
forget. A hook auto-prepends the preamble whenever the user prompt contains
"Start Phase", "Continue Phase", "Feature Update", "Batch", "Resume Session",
or "Resume from handoff" (case-insensitive) — agent literally cannot bypass it.
Implementation: single inline node -e command, preamble base64-encoded inside
the JS to sidestep two-layer quote escaping. No jq dependency (jq not installed
on this WSL2 env). 5-second timeout. Silent no-op on non-matching prompts.
Trade-offs accepted: (1) editing the preamble requires base64 decode/encode
round-trip — mitigated by ad-hoc decode helper documented in handoff. (2) Hook
adds ~5ms latency to every UserPromptSubmit. (3) Settings watcher only picks up
new hooks after /hooks reload or session restart — first-time activation gotcha.
Locked: yes — anti-thrashing enforcement is mechanical via hook. CLAUDE.md
"⚠ CONTEXT BUDGET" section remains as defence-in-depth (rule the agent reads)
but is no longer the sole enforcement layer.
File: .claude/settings.json hooks.UserPromptSubmit
Commit: 7bf35bf

## Dev Environment Mode
Decision: MODE A — WSL2 native (the only supported mode as of V25)
Rationale: Devcontainer adds 4 virtualisation layers on WSL2 + Docker Desktop causing
permission errors, shell server crashes, and socket failures. WSL2 native eliminates all of this.
Docker Desktop provides the Docker socket to WSL2 natively. No DinD needed.
Locked: yes — do not re-ask or scaffold devcontainer files.

## Git Branching Strategy
Decision: Branch-per-feature with squash-merge to main.
Branch patterns: feat/{slug}, scaffold/part-{N}, fix/{slug}, chore/{slug}.
Commit style: conventional (feat:, fix:, chore:, docs:).
Locked: yes — enforced by Rule 23.

## Model Routing
Decision: Claude Code is the primary agent for all phases (V31).
  planning:   claude-code (Phase 2)
  execution:  claude-sonnet-4-6 via Claude Code (V31 primary)
  governance: gemini-2.5-flash-lite (cheapest, non-critical writes)
Cline: deprecated V31 — do not use.
Locked: yes — do not re-ask.

## Port Strategy
Decision: Dev environment uses unique random port base 44377 (Rule 22).
Port assignments:
  PostgreSQL: 44377, PgBouncer: 44378, Valkey: 44379
  MinIO API: 44380, MinIO Console: 44381
  MailHog SMTP: 44382, MailHog UI: 44383, pgAdmin: 44384
  App (Next.js): 44387, Worker: 44388, Prisma Studio: 44397
Staging and production use standard ports (5432, 6379, 9000, 3000).
Locked: yes — do not regenerate unless port conflict occurs.

## Docker Image Publishing
Decision: Docker Hub publishing enabled.
Registry: docker.io (Docker Hub)
Repository: bonitobonita24/frms
Image name: frms
Tags: latest (main branch) + staging-latest + sha-{short} (every push)
Platforms: linux/amd64, linux/arm64
Trigger: push to main only (Rule 23 squash-merge guarantees clean main)
Locked: yes — changing image name requires updating all server pull commands.

## Tenancy Model
Decision: Multi-tenant with shared schema + tenant_id.
Routing: subdirectory (/{tenant_slug}/dashboard).
All 6 security layers (L1-L6) active.
JWT fields: userId, tenantId, roles[], securityVersion.
Shared global data: true (categories, ID templates shared across tenants).
Locked: yes — do not re-ask.

## Auth Strategy
Decision: Auth.js v5 with Credentials provider + JWT sessions.
Session type: JWT (stateless).
JWT fields: userId, tenantId, roles[], securityVersion.
MFA: false (not required).
Password hashing: bcrypt.
Locked: yes — do not re-ask.

## platformPrisma for Auth and Platform-Level Queries
Decision: Auth queries (authorize, session callback) and superadmin cross-tenant queries use `platformPrisma` — an unguarded PrismaClient WITHOUT the L6 tenant-guard extension.
Rationale: The L6 tenant guard (`tenantGuardExtension`) requires tenant context via `runWithTenant()`. Auth flows (login, session validation) run before any tenant context exists. Using the guarded `prisma` client causes "Tenant context not set" errors. Per `.claude/rules/security.md` superadmin section: "Superadmin queries that bypass tenant scoping MUST use a dedicated Prisma client instance WITHOUT the L6 tenant-guard extension."
Implementation: `platformPrisma` is created in `packages/db/src/client.ts` and exported from `packages/db/src/index.ts`. Used ONLY in `apps/web/src/server/auth/config.ts` (authorize + session callback) and future platform-level routers.
Locked: yes — never use guarded `prisma` for auth flows.

## Cloudflare Turnstile Bot Protection
Decision: Enabled on login page only (no open registration in FRMS).
Widget mode: managed (Cloudflare auto-decides checkbox visibility).
Protected pages: /login only.
Dev + staging: test keys (always pass, 0 hostname budget).
Prod: LIVE keys required (⏳ fill in CREDENTIALS.md before Phase 5).
Locked: yes — do not re-ask.

## SMTP Configuration
Decision: Per-tenant SMTP config stored encrypted in Tenant entity.
System-level fallback from environment variables (SMTP_HOST, SMTP_USER, etc.).
Dev: MailHog (local, no real SMTP).
Staging/Prod: mail.powerbyteitsolutions.com:465 (system fallback).
Locked: yes — do not re-ask.

## Komodo Deployment Model
Decision: V27 auto-update model.
Staging: auto_update: true — Komodo polls Docker Hub for new :staging-latest digests.
Production: auto_update: false — human clicks Deploy in Komodo UI after verifying staging.
Komodo UI: https://kmd.powerbyte.app/
Webhook deploy: optional (not required for V27 model).
Locked: yes — do not re-ask.

## Spec Stress-Test (Phase 2.7)
Decision: Enabled (vibe_test.enabled: true).
Phase 2.7 ran and PASSED with 0 gaps on 2026-05-02.
Locked: yes — re-run only via "Re-run Phase 2.7" trigger.

## App-level tsconfig — declaration off
Decision: Every `apps/[app]/tsconfig.json` overrides the base with
`"declaration": false, "declarationMap": false`.
Rationale: tsconfig.base.json keeps `declaration: true` so shared packages can
emit .d.ts for monorepo consumers. Apps in apps/* are runtime leaf consumers —
they never publish types. Inherited declaration: true makes TS validate
declaration portability and fire TS2742 "inferred type cannot be named without
a reference to ..." on tRPC + next-auth re-exports. Override fixes typecheck
without weakening type strictness elsewhere.
Locked: yes — applies to apps/web, future apps/mobile, apps/admin, etc.
Do not modify tsconfig.base.json — packages still need declarations.

## ESLint — type-aware config + strict-boolean-expressions options
Decision: Root `.eslintrc.js` uses
`parserOptions: { project: true, tsconfigRootDir: __dirname }` to enable
type-aware rules (typescript-eslint v8 auto-discovery picks the right tsconfig
per file). `@typescript-eslint/strict-boolean-expressions` is configured as
`['error', { allowString: true, allowNullableObject: true, allowNullableString: true }]`.
Rationale: Type-aware lint catches real bugs (no-unsafe-assignment,
no-unnecessary-type-assertion) but the default strict-boolean-expressions fires
on every idiomatic tRPC null-guard (`if (!ctx.tenantId)`,
`...(value && { value })`). The relaxed options permit nullable string/object
patterns while still catching numbers, any-typed, and falsy-coercion bugs.
Locked: yes — do not disable these rules; tune the options if a new false
positive is found, document the change, and add a 🟤 lessons.md entry.

## omitUndefined<T> — pattern for exactOptionalPropertyTypes + Prisma payloads
Decision: All apps/web tRPC routers that build Prisma create/update payloads
from Zod-parsed input use `omitUndefined()` from
`apps/web/src/server/lib/prisma-input.ts` to strip undefined keys before
passing to Prisma.
Rationale: tsconfig.base.json sets `exactOptionalPropertyTypes: true`. Prisma
input types use `field?:` (allow missing) not `field?: T | undefined`, while
Zod `.optional()` produces `T | undefined` after parse — direct spread fails
typecheck. The runtime helper filters undefined values and casts the result
type to drop `| undefined` from each property, returning a Prisma-compatible
input. Applied across category, ayuda, tenant, vessel, violation, fisherfolk,
idTemplate, kanbanTask, and future routers.
Locked: yes — do NOT cast Prisma input types with `as` (hides bugs); always
use omitUndefined for partial payloads.

## Edit Request Workflow — editable fields (PD-002)
Decision: ALL editable Fisherfolk fields may be changed via an edit request — the
whitelist is exactly the field set of `fisherfolkUpdateSchema`
(packages/shared/src/schemas/fisherfolk.ts). System/identity/audit columns
(id, tenantId, idNumber? , createdAt/updatedAt, createdById/updatedById, qrCode) are
NOT user-editable and are excluded by virtue of not being in fisherfolkUpdateSchema.
The edit request records "whatever field has been changed" — fieldChanges JSON holds
only the keys the encoder actually modified (changed-fields-only), which IS the history.
Rationale: Owner answer 2026-06-26 — "all fields, just add to the history whatever field
has been changed." editRequest.create must validate fieldChanges keys ⊆ fisherfolkUpdateSchema
shape (reject unknown keys) so approve()'s fisherfolk.update(fieldChanges) can never throw.
Locked: yes. Owner-decided. Back-port to PRODUCT.md flow #3 pending (Rule 1 — human edits PRODUCT.md).

## Edit Request Workflow — notification channels (PD-003)
Decision: In-app notifications (Notification model + notification.ts router already exist)
+ EMAIL (build a mailer using existing tenant SMTP settings) are ACTIVE. SMS is PREPARED
but inactive — define the channel interface / a no-op SMS sender stub + a config flag, so
SMS can be switched on later without re-architecting. This channel set becomes the standard
for ALL future system notifications (renewals, violations, etc.).
Rationale: Owner answer 2026-06-26 — "in-app & email but SMS just prepare."
Locked: yes. Owner-decided.

## Edit Request Workflow — approval-bypass + resubmit/history (PD-004)
Decision: (1) No-approval bypass covers a missing photo/signature AND any currently-EMPTY
required field — filling a blank completes the record (encoder-direct), but CHANGING an
already-populated field always routes through admin approval. (2) Resubmit creates a NEW
EditRequest per submission; rejection history is shown by querying prior requests for that
fisherfolk (and overlapping fields). Both are agent recommendations adopted as defaults —
owner asked for guidance ("how should I answer this?") and may override.
Rationale: Owner 2026-06-26 delegated; agent recommended. Filling blanks ≠ mutating data
(low risk, fast record completion); new-record-per-submit is simplest + fully auditable and
aligns with PD-002 changed-fields history.
Locked: provisional (agent default) — flip on owner request.

## Fisherfolk registration ID — format-agnostic / mixed IDs (PD-001)
Decision: Do NOT enforce any single ID format. `idNumber` is a freeform per-tenant-unique
string that must accept ANY format (legacy MR-CL-NNNNNN-YYYY, generated FF-YYYY-NNNN, or
arbitrary). New registrations: encoder may ENTER the ID manually (any format); the existing
generateNextIdNumber stays as an optional "suggest" helper, not a mandate. Remove rigid
format validation; search/sort/dedup already operate on the string and must remain
format-neutral. Imported legacy IDs are preserved exactly (already locked under Data
Management & Normalization Standards).
Rationale: Owner answer 2026-06-26 — "no ID format, just make it ready for mixed of any ID
format." Supersedes the FF-YYYY-NNNN-vs-MR-CL question — neither is mandated.
Locked: yes. Owner-decided. Scope: fisherfolk.create input + registration form idNumber
field (manual freeform + uniqueness check) + drop any format regex. Tracked as its own batch.

## Custom-domain "masking" — per-tenant own-domain support (2026-06-29)
Decision: A tenant (LGU) may serve the app from THEIR OWN domain (e.g.
`fisherfolk.calapancity.gov.ph`) while the single shared-schema codebase keeps
serving from the existing `/[tenant]/...` subdirectory routes. The browser shows
the tenant's domain (URL "masking" via internal `NextResponse.rewrite`, NOT iframes —
iframes break auth cookies, deep links, SEO). The data boundary is UNCHANGED: tenant
is still derived from the authenticated session (`session.user.tenantId`), never the
URL/host — so masking only changes the visible URL, never isolation.
Scope shipped this session:
  - Data model: `Tenant.customDomain` (unique, nullable) + `Tenant.domainVerifiedAt`
    (migration `20260629140000_tenant_custom_domain`).
  - Pure, unit-tested resolver `apps/web/src/lib/tenant-routing.ts`
    (`resolveTenantRoute` + `parseCustomDomainMap`); tests in
    `apps/web/src/lib/__tests__/tenant-routing.test.ts`.
  - Live middleware wiring (`apps/web/src/middleware.ts`): reads the host→slug map
    from `TENANT_CUSTOM_DOMAINS` (JSON) once per runtime and rewrites before auth.
    INERT while the env var is empty/unset (resolver returns rewriteTo=null → zero
    behaviour change) — safe to land before any domain is onboarded.
  - Cross-tenant isolation tests (forged `where.tenantId` override blocked).
  - Docs: `docs/MULTITENANCY.md` (model, resolver, DNS/TLS steps, activation checklist).
Per-tenant onboarding (DNS CNAME → TLS cert → set `Tenant.customDomain` +
`domainVerifiedAt` → add to `TENANT_CUSTOM_DOMAINS` → deploy) is documented; first
real activation must run the MULTITENANCY.md §Verify checklist against a live domain.
Rationale: Owner approved custom-domain masking as a new [WHAT] on 2026-06-29.
Foundation + inert wiring built so the feature is ready the moment a tenant brings a domain.
Locked: yes (technical [HOW] of the masking mechanism). Back-port to PRODUCT.md
✅ DONE 2026-06-30 (candidate J in docs/BACKPORT_CANDIDATES.md).

## 2026-06-30 — Rule 1 one-time waiver: agent applied custom-domain back-port to PRODUCT.md
Normally PRODUCT.md is human-owned (Rule 1) and agents never edit it. On 2026-06-30 the
owner (Bonito) explicitly authorized Claude Code to apply the candidate-J back-port directly
("can you do the appending of the draft you made for PRODUCT.md yourself?"). Scope of the
edit was limited to the pre-drafted candidate-J wording: a custom-domains paragraph under
## Tenancy Model, a per-tenant-custom-domains line under ## Domain / Base URL Expectations,
and the `customDomain` + `domainVerifiedAt` fields on the Tenant entity under ## Data Entities.
No other PRODUCT.md content was touched. Waiver is one-time and scoped to this back-port;
Rule 1 (human-only PRODUCT.md edits) otherwise remains in force.

## 2026-06-30 — Rule 1 waiver (extended): agent applied back-port candidates A–I to PRODUCT.md
Same session, the owner extended the waiver: "go do the next turn but please update the
PRODUCT.md, append all those updates we made." Claude Code applied the remaining
`docs/BACKPORT_CANDIDATES.md` candidates A–I (custom-domain candidate J was already done):
- **A (PD-001)** — Data Mgmt §: ID is format-agnostic / freeform per-tenant-unique; removed the stale "DEFERRED OWNER DECISION (PENDING)" sentence.
- **B** — Settings/General, Tenant entity, Design Identity: single-blue accent → **primary + secondary accent pair** + admin Theme editor + always-dark. ⚠ Used **ground-truth schema defaults** `primaryColor #F97316` / `secondaryColor #1E3A5F` (NOT the candidate's stale `#E8843C`/`#336F92`); `accentColor #4F8EF7` retained as legacy field. Current palette deferred to docs/DESIGN.md (Deep Sea Teal rehab supersedes earlier tangerine/marine).
- **C** — Category icons reworded to **font-independent lucide SVG** render (mapped by category name, colored-dot fallback) in 3 places. Category entity `iconType (emoji, image)` left unchanged — verified the `CategoryIconType` enum is still `EMOJI`/`IMAGE`; lucide is a render-layer mapping, not a data-model change.
- **D (PD-004, provisional)** — bypass broadened from photo/signature to any currently-empty required field; populated-field edits still need approval; new EditRequest per resubmit.
- **E (PD-002)** — Edit Request System: editable scope = full `fisherfolkUpdateSchema` set; system/identity/audit columns excluded.
- **F** — Data Import contact normalization `+63 prefix` → canonical `09xxxxxxxxx`.
- **G** — Settings: added **Barangay Aliases** tab + module bullet (typo-normalization CRUD).
- **H** — Dashboard: added asset-coverage (missing-photo/signature) counts + list `missing` filter.
- **I (PD-003)** — Integrations: stated the standard notification channel set (in-app + email ACTIVE, SMS prepared-inactive).
Where a candidate's pre-drafted text conflicted with shipped code, the **code won** (B hex defaults, C entity line). Waiver remains scoped to these candidates; Rule 1 otherwise stays in force.

---

## 2026-07-01 — Registration-Status Timeline: ID release, NEW/RENEWED badge, renew action, and activity timeline

Feature branch: `swarm/registration-status-timeline`. Decisions recorded by Swarm Worker SD (Rule 15 attribution).

### (a) ID "Released" flag — MANUAL staff action, not auto-on-print
Decision: Setting a fisherfolk registration as ID "Released" is a deliberate MANUAL staff action
("Mark as Released") performed by an encoder or admin. It is NOT triggered automatically when a
physical ID card is printed or generated. The action is backed by two fields on the `Fisherfolk`
model: `idReleasedAt` (DateTime) and `idReleasedById` (FK → User). The corresponding tRPC mutation
is `fisherfolk.markIdReleased` — role-gated to `encoderProcedure` (encoder + admin roles). Every
call writes an AuditLog entry (AuditAction.ID_RELEASED, entity FISHERFOLK).
Rationale: Auto-on-print would silently mark IDs released if the print flow ever re-ran; a manual
action preserves staff accountability and keeps the audit trail authoritative.
Locked: yes

### (b) NEW vs RENEWED registration badge — derived from renewal-history count
Decision: The "NEW" (green) vs "RENEWED" (orange) badge displayed on the fisherfolk list columns
and on the profile page header is DERIVED at render time from `_count.renewals` included in the
`fisherfolk.list` and `fisherfolk.getById` query results.
- `_count.renewals` = 0 → badge = **NEW** (green)
- `_count.renewals` ≥ 1 → badge = **RENEWED** (orange)
The fisherfolk profile page shows the original `dateJoined` field (never mutated on renewal) plus
a full renewal timeline (all `RegistrationRenewal` rows for that fisherfolk, ordered by
`renewalYear` desc).
Rationale: Avoids a separate boolean or enum column that could drift out of sync; the renewal-row
count is the single source of truth for registration status.
Locked: yes

### (c) `renew` action — encoder role, blocked on active violation
Decision: The registration renewal action (`fisherfolk.renew` tRPC mutation) is gated to the
encoder role (`encoderProcedure`). Before committing, the mutation MUST check for any linked
record with status `ACTIVE_VIOLATION`; if found, the call is rejected with a user-facing error
("Cannot renew — fisherfolk has an active violation"). On success the mutation:
1. Writes a new `RegistrationRenewal` row (`fisherfolkId`, `tenantId`, `renewedById`,
   `renewalYear`, optional `notes`).
2. Transitions `Fisherfolk.status` → `RENEWED`.
3. Bumps `Fisherfolk.registrationYear` to the renewal year.
4. Logs `AuditAction.RENEW` (entity FISHERFOLK) to the AuditLog.
All four writes execute in a single Prisma transaction.
Rationale: Blocking renewal on active violations enforces operational policy; the transaction
guarantees atomicity so a partial renewal can never leave the record in an inconsistent state.
Locked: yes

### (d) New data entities introduced in this wave
- **RegistrationRenewal** — `id`, `fisherfolkId`, `tenantId`, `renewedById`, `renewalYear` (Int),
  `notes?` (String), `createdAt`; unique constraint `@@unique([fisherfolkId, renewalYear])`;
  two indexes: `@@index([tenantId])` (tenant list queries) + `@@index([fisherfolkId])` (per-fisherfolk timeline).
- **Fisherfolk.idReleasedAt** — `DateTime?`, set to `now()` by `markIdReleased` mutation.
- **Fisherfolk.idReleasedById** — `String?` FK → `User.id`, set by `markIdReleased` mutation.
Migration: `20260701000000_registration_renewal_and_id_released` (additive-only — 2 ADD COLUMN on
`fisherfolk` + CREATE TABLE `registration_renewals` + FK constraints + indexes).
Schema committed on branch `swarm/registration-status-timeline` (commit 2687824).
Locked: yes (schema sealed; downstream sessions must not alter this migration)

### (e) Right-side profile activity timeline — sanitized per-entity audit feed
Decision: The right-side panel on the fisherfolk profile page (`/[tenant]/fisherfolk/[id]`)
displays a per-entity activity timeline sourced from the `AuditLog` table, filtered to
`entity = FISHERFOLK` AND `entityId = fisherfolk.id`. The feed exposes exactly:
- `action` (the AuditAction enum value, human-readable label in the UI)
- `actorName` (display name of the acting User)
- `createdAt` (timestamp)

**Before/after field diffs (`before` and `after` JSON columns on AuditLog) are NOT exposed to
this feed.** The tRPC procedure serving this feed is `protectedProcedure` — any authenticated,
same-tenant user (all staff roles) may view it; no public or cross-tenant access.
Rationale: Full before/after diffs are sensitive (may reveal PII edit contents or admin
operations); sanitizing to action/actor/timestamp satisfies the audit-visibility use case without
leaking granular diff data to front-line staff roles that should only know *what* happened, not
the exact field values that changed.
Locked: yes

---

## ID Generator Wave — ID Card Printing (2026-07-01)

Source: swarm/id-generator SD session. Rule 15 attribution: CLAUDE_CODE (Swarm Worker SD,
branch swarm/id-generator). Decisions (a)–(f) are [HOW] calls locked here; open [WHAT] product
questions flagged for owner at the end of this entry.

### (a) Template element schema — strict typed discriminated union, mm-based layout
Decision: The `frontElements` and `backElements` fields on `IDTemplate` store an array of
elements whose shape is a TypeScript **discriminated union** keyed on `type`. Permitted variants:
`text`, `variable`, `image`, `icon`, `qr`, `photo`, `signature`.
All variants carry a `position` (x, y in mm from top-left of card content area) and `size`
(width, height in mm). The authoritative card geometry:
- **Content area**: 86 × 54 mm (CR-80 standard, landscape).
- **Bleed area**: 90 × 58 mm (2 mm bleed per side — used only for background/border elements).
The `variable` element type resolves at render time to a named Fisherfolk field (e.g.
`idNumber`, `fullName`, `fishingBarangay`, `registrationYear`).
Rationale: A typed schema is machine-verifiable (Zod), future-proof for new element types, and
avoids free-form JSON blobs that would break the drag-and-drop editor on schema evolution.
Locked: yes

### (b) Template Editor is Admin-only; technology: dnd-kit + DOM/CSS-mm (NOT canvas)
Decision: The template editor UI (`/[tenant]/id-generator/editor`) is gated to
`adminProcedure` — encoder role cannot edit templates. The editor uses **dnd-kit** for
drag-and-drop element placement. Rendering is **positioned DOM + CSS `mm` units**, NOT
canvas/raster. Reasons: (1) DOM + `mm` CSS gives exact print fidelity when combined with
`@media print` (browsers map CSS `mm` → physical mm); (2) raster canvas at screen DPI would
introduce blurring at print resolution; (3) dnd-kit supports full keyboard navigation and meets
WCAG 2.2 AA accessibility requirements (canvas drag is not keyboard-navigable by default).

The **Select & Print** flow (printing existing IDs against a template) and the server-side
**print record** write are gated to `encoderProcedure` OR `adminProcedure` (both roles may
initiate a print run).
Locked: yes

### (c) ID rendering: positioned DOM + @media print; PVC 200×300 mm sheet; back mirrored
Decision: The printable output renders as a **positioned DOM** element styled with CSS `mm`
units, with a print stylesheet (`@media print`) that: (1) hides all navigation/chrome; (2)
sizes the page to **200 × 300 mm** (a standard PVC sheet that fits a laser/inkjet printer
tray); (3) auto-fills **1–4 ID pairs** (front+back per fisherfolk) in a 2-column × N-row
grid. Each pair = front face on the left, back face on the right.

**Back content** is rendered mirrored (`transform: scaleX(-1)`) so that when the PVC film is
flipped for back-printing on the same physical pass, text reads correctly.

**Empty slots** (when a batch has fewer than 4 IDs) are rendered as **dashed placeholder
boxes** at the correct card dimensions — this prevents the printer from scaling up the
remaining cards to fill the sheet.
Locked: yes

### (d) Select & Print validation gate — missing photo OR signature blocks checkout
Decision: Before a fisherfolk record may be added to a print batch (at checkout time in the
Select & Print UI), the system MUST verify that the record has both a stored `photo` AND a
`signature` file in MinIO. If either is missing, the record is marked **not print-eligible**
and cannot be checked out. The UI surfaces a "Missing photo" or "Missing signature" indicator
on the ineligible row. Staff must upload the missing asset first and then return to the print
queue.
Rationale: An ID without a photo or signature is physically incomplete; printing it wastes PVC
card stock and produces an invalid municipal ID.
Locked: yes

### (e) IDPrintBatch entity — persists each print event for Daily-Operations audit trail
Decision: A new Prisma model **`IDPrintBatch`** (also referred to as "issuance record") is
written on every confirmed print run. Fields (minimum required):
- `id` — CUID
- `tenantId` — tenant isolation
- `printedById` — FK → `User.id` (who triggered the print)
- `printedAt` — `DateTime` (`now()`)
- `count` — `Int` (number of IDs in this batch)
- `idType` — enum: `new | renewed | update` (type of ID issued)
- `fisherfolkIds` — `String[]` (native PostgreSQL `text[]` via Prisma — stores the list of fisherfolk CUIDs for this batch; no join table)

The `IDPrintBatch` table is the source of truth for the Daily-Operations dashboard summary
"today's printed IDs" and the "ready vs incomplete" print queue view (records with photo+sig
= ready; records missing either = incomplete).
Rationale: Printing without an audit trail makes it impossible to detect double-printing,
track throughput, or produce the daily issuance summary the FMO staff currently track manually.
Locked: yes

### (f) 'ID Released' stays a SEPARATE manual staff action (not linked to printing)
Decision: The **printing** step and the **ID Released** step are deliberately decoupled:
- **Printing** is the `IDPrintBatch` record + producing the physical printable output
  (browser `@media print`). Completing a print run does NOT set `idReleasedAt`.
- **ID Released** remains the explicit `fisherfolk.markIdReleased` mutation (introduced in
  Wave 1 — registration-status-timeline), which a staff member triggers AFTER the printed
  card is physically handed to the fisherfolk. It sets `Fisherfolk.idReleasedAt` and
  `idReleasedById`.

The **Select & Print** list surfaces both states per row: `released / not released` (from
`idReleasedAt`) AND `print-eligible / not eligible` (from photo + signature presence). Staff
can therefore see which IDs have already been issued vs which are newly printed and awaiting
hand-off.
Rationale: The physical card may be printed in a batch session but distributed later; forcing
a released flag at print time would produce inaccurate data on the release date and who
authorized the hand-off.
Locked: yes

### ⚠ PM FLAG — Open [WHAT] questions (do NOT write to PRODUCT.md — owner decision required)
These are product/scope questions that must be answered by the owner before the corresponding
implementation sessions run. They are NOT [HOW] decisions and are NOT locked here.

**[WHAT]-IDG-01 — Vessel IDs: in-scope for this wave or a later wave?**
The current ID Generator spec (PRODUCT.md) describes fisherfolk IDs. The system also registers
vessels (with MFVR numbers). It is unclear whether the `IDTemplate` / `IDPrintBatch` model
should also cover vessel registration cards in this wave, or whether vessel IDs are deferred
to a future Vessel-specific wave.
Options: (A) Vessel IDs in-scope now — extend template `targetEntity` enum to `fisherfolk |
vessel`; vessel Select & Print flow ships in the same sprint. (B) Vessel IDs deferred —
current wave covers fisherfolk IDs only; vessel ID template is a follow-up wave.

**[WHAT]-IDG-02 — Daily-Operations print-queue widget: this wave or a later Daily-Ops wave?**
The `IDPrintBatch` entity (decision e) enables a "today's printed IDs" summary and a
"ready vs incomplete" print queue. It is unclear whether the Daily-Operations dashboard widget
that DISPLAYS this data ships in the current ID Generator wave, or is bundled into a future
Daily-Operations / dashboard enhancement wave.
Options: (A) Ship the widget in this wave — the dashboard gains a "Print Queue" card
immediately. (B) Defer to a Daily-Ops wave — the IDPrintBatch data is recorded now but the
dashboard card is a follow-up session.

---

## 2026-07-01 — ID Generator Session S4a (Geometry Override)

### (g) ID card printed size corrected to 87×56mm (owner override)
Decision: The printed ID card size is **87mm × 56mm** (NOT 86×54mm as initially committed in S1).
- `ID_CARD_GEOMETRY.contentWidthMm`: 86 → **87**
- `ID_CARD_GEOMETRY.contentHeightMm`: 54 → **56**
- `ID_CARD_GEOMETRY.bleedWidthMm`: 90 → **91** (87 + 2×2mm bleed)
- `ID_CARD_GEOMETRY.bleedHeightMm`: 58 → **60** (56 + 2×2mm bleed)

Changed in: `packages/shared/src/schemas/id-template.ts`; geometry test updated to expect 87/56.
Rationale: Owner direct instruction on 2026-07-01 — takes precedence over the 86×54mm committed in S1.
All S4a canvas/renderer components built against the corrected 87×56mm constants.
Locked: yes

---

## 2026-07-04 — AdminCN Reskin wave (branch swarm/admincn-reskin)

### (a) App shell and theme reskinned to AdminCN template pattern
Decision: FRMS is reskinned to match the **AdminCN shadcn admin template** aesthetic.
- Scope: dashboard page + full app shell (sidebar + top header) + global theme tokens.
- **Dark stays the default.** `apps/web/src/app/[tenant]/layout.tsx` already sets
  `defaultTheme="dark"` — this is left unchanged. The reskin targets dark-mode surfaces only.
- **Surface palette**: AdminCN neutral-dark surfaces adopted — body/page `bg ~#0a0a0a`
  (`--background: 0 0% 3.9%`), card `bg ~#171717` (`--card: 0 0% 9%`), with matching border
  (`--border: 0 0% 14.9%`) and muted (`--muted: 0 0% 14.9%`) tokens.
- **Orange `--primary` kept.** FRMS's orange `--primary` is per-tenant runtime-overridable in
  `[tenant]/layout.tsx` (CSS-var injection at `#tenant-theme-root`); it lives outside the
  tokens this reskin changes and must not be overwritten.
- **Accent identity — teal/orange via `--accent` + `--chart-1..5`**: AdminCN's dark chart
  palette is blue/purple by default; we substitute AdminCN's *light* teal/orange hues into the
  dark chart slots per owner request (`--chart-1` teal, `--chart-2` orange, `--chart-3..5`
  supporting). `--accent` and `--accent-foreground` are set to the teal identity for
  interactive highlights (hover, focus rings) that are not covered by `--primary`.
Rationale: Owner directive — modernize FRMS look to a professional admin dashboard aesthetic
(AdminCN) while preserving the per-tenant theming contract and the existing dark default.
Locked: yes

### (b) DENSITY pass — compact KPI strip + tighter layout
Decision: A global density pass ships with the reskin:
- Dashboard KPI tiles: **6-across compact strip** (was 4-across or 3-across larger cards).
  `p-3` / `gap-3` inner padding; chart heights reduced (~180px → ~140px where applicable).
- App-wide: tighter `gap-3`/`gap-4` section spacing, reduced `p-4`/`p-6` page padding to
  `p-3`/`p-4`; sidebars and headers use `h-14` / `px-4` instead of `h-16` / `px-6`.
- Cards and section wrappers use `py-3 px-4` instead of `py-6 px-6`.
Rationale: LGU daily-operations use case — staff need more data visible per screen without
scrolling. The denser layout matches AdminCN's compact professional admin style.
Locked: yes

### (c) Implementation split — 5 code sessions + 1 docs session
Decision: The AdminCN reskin wave is split into 5 parallel/sequential code sessions + this SD
docs session:
- **S1** — Theme tokens: CSS custom-property overrides in `globals.css` (dark surface palette +
  accent/chart tokens); Tailwind config base-color updates.
- **S2** — Sidebar + shell: update `app-sidebar.tsx` / `sidebar.tsx` / shell layout to AdminCN
  spacing, icon sizing, group labels, collapsed state styling.
- **S3** — Top header: update `header.tsx` / breadcrumb / search bar / user-menu to AdminCN
  header pattern; `h-14` height, `border-b`, muted background.
- **S4** — Dense dashboard: rebuild KPI strip as 6-across compact row; reduce chart heights;
  apply density-pass padding/gap values to all dashboard sections.
- **S5** — QA: full typecheck + lint + build + visual smoke-test (Playwright screenshot or
  manual check); WCAG contrast ratio verification for new token values.
- **SD** (this session) — governance docs: DECISIONS_LOG + CHANGELOG_AI; PRODUCT.md untouched.
Rationale: Parallel fan-out (S1–S4 are largely independent surfaces) then serial QA gate (S5).
Locked: yes
- [swarm S5 · 2026-07-04 22:11:50] S5/q-S5-01 [A]: 6 <Switch> elements in barangay-density-map.tsx (L486-536) missing aria-label → axe button-name (SC 4.1.2, WCAG 2.2 AA hard gate, gov/LGU). Resolved: fix in-session on swarm/admincn-reskin with aria-label='Toggle <Category>' per switch. Governing rules: ui-rules.md R13 + privacy.md (V32.9) + Rule 32.
- [swarm S5 · 2026-07-04 22:12:09] S5 q-S5-02 (A): WCAG AA nav-active contrast fix — introduce --nav-active-bg/--nav-active-fg token pair and apply to sidebar active item; keep global --accent unchanged. Governing: ui-rules.md R13 (WCAG 2.2 AA gov/LGU hard gate) + V32.12 design-principles (INHERIT-not-REPLACE tokens).
- [swarm S5 · 2026-07-04 22:12:24] S5/q-S5-03: A — Fixed WCAG AA contrast failure on header ⌘K kbd (3.18:1). Removed opacity-60; use text-muted-foreground token per ui-rules.md R13 + privacy.md gov/LGU hard gate.
- [swarm S5 · 2026-07-04 22:12:40] S5/q-S5-04: A (framework) — resolved by Brain. Confirmed missing onToggleSidebar prop on <Header> in apps/web/src/components/app-shell.tsx. Directed worker to apply fix in-session (Rule 32 Verifiable-Done); reject 'defer to S5a / polish session' options.
- [swarm S5 · 2026-07-04 22:12:52] S5/q-S5-05: A — activeSpark guarded to undefined on stats==null to match totalSpark; enforces consistent StatCard empty-state per ui-rules.md.
- [swarm S5 · 2026-07-04 22:13:12] 2026-07-04 S5 q-S5-06 [Bucket A / framework]: --chart-3 dark 196 72% 23% (1.97:1 vs #171717) fails WCAG 2.2 AA SC 1.4.11 non-text contrast on gov/LGU app. Fix: raise to 196 60% 45% (hue-preserving lightness lift, keeps S1 teal palette). Authority: ui-rules.md R13 + privacy.md V32.9 + Rule 32. Rejected: revert to amber 43 96% 56% (breaks S1 palette).

### AdminCN reskin — PM ground-truth QA verification (2026-07-05)
The hung S5 QA worker's fixes were recovered + committed by PM (`7b32f9a`), then browser-verified
by the PM (not trusting the worker self-report) at :44387 dark mode, encoder role:
- Active nav contrast: **6.86:1** (was 3.59:1) ✅ AA · ⌘K kbd: **5.86:1** (was 3.18:1) ✅ AA
- Density-map switches: **9/9 have aria-label, 0 missing** (was 6 missing button-name critical) ✅
- 0 buttons missing accessible name · 0 app console errors · dark default · 6-across dense KPIs w/ real data
All S5 axe violations confirmed remediated. Reskin QA gate = PASS. Branch dev-only (merge owner-gated).

### FMO barangay alias corrections (2026-07-05, owner-confirmed data facts)
Owner: two barangays previously flagged "no mapped location" are real Calapan barangays under
other names — "San Rafael" is the former name of **Salong**; "Svs" abbreviates **San Vicente South**.
Added both to `BARANGAY_ALIASES` in barangay-density-map.tsx → resolve to existing centroids.
Verified: the density map's unmapped notice is now gone (0 unmapped, was 2). Committed `7b32f9a`.

## FRMS Dashboard Redesign wave (2026-07-05) — owner [WHAT] decisions (defaults applied, non-blocking)
Owner queued an 8-item dashboard redesign (see docs/plans/frms-dashboard-redesign-plan.md). PM+Architect
co-planned; grounded in real code (RegistrationRenewal model, fisherfolk.renew mutation, and
Tenant.currentRegistrationYear ALREADY EXIST). Six [WHAT] gaps deferred to owner with sane technical
defaults so the build proceeds un-blocked (Rule 1: PRODUCT.md untouched; re-surface until answered):
- **D1 — "Active Fisherfolk" headline definition.** Default applied: headline = status IN (ACTIVE, RENEWED, NEW). Owner to confirm whether NEW (freshly-registered, unreviewed) counts immediately.
- **D2 — Annual INACTIVE-reset trigger.** Default applied: admin-triggered bulk updateMany when a super-admin advances Tenant.currentRegistrationYear (auditable, no cron infra). Owner to confirm vs a hard automatic Jan-1-00:01 cron cutover.
- **D3 — Vessel "category" + vessel NEW/RENEWED.** Vessel has no category relation and no NEW/RENEWED states. Default applied: group the vessel tile by existing `vesselType` string; omit (not fabricate) a vessel NEW/RENEWED fraction. Owner to confirm whether vessels need a real Category relation (schema change) and a renewal lifecycle.
- **D4 — Renewal action per-record vs bulk.** Default applied: keep existing per-record fisherfolk.renew + add the missing `status==="INACTIVE"` guard. Owner to confirm if a bulk "renew all INACTIVE" admin action is needed this wave.
- **D5 — ARCHIVED vs INACTIVE interplay.** Default applied: annual sweep excludes ARCHIVED; archival is terminal (only INACTIVE can renew). Owner to confirm.
- **D6 — Lower-chart grouping (item 7).** Default applied: 5 existing charts → 3 tiles (barangay+status · gender+age · category+category-by-barangay). Owner may prefer a different pairing.

### SET-2 Dashboard Redesign — [HOW] locked implementation decisions (2026-07-05, CLAUDE_CODE SD)
PM+Architect co-planned this wave against real code (RegistrationRenewal, fisherfolk.renew, and
Tenant.currentRegistrationYear already exist). [WHAT] defaults D1–D6 are logged above; [HOW]
implementation choices below are locked for the build:

#### (a) Sequential wave S1→S6 — no parallel fan-out after S1
Decision: All six code sessions run strictly sequential. Sessions S2–S5 all write
`dashboard-client.tsx` (shared file) — no two sessions after S1 are file-disjoint. Wave order:
S1 (schema index) → S2 (backend lifecycle) → S3 (top-section UI) → S4 (group tiles) →
S5 (lower-chart reflow) → S6 (WCAG gate) → SD (governance docs).
Rationale: Shared file surface makes parallel agents unsafe; correctness over speed.
Locked: yes

#### (b) Schema — additive index only, no new relations
Decision: S1 adds `@@index([tenantId, status, registrationYear])` on `Fisherfolk` via an additive
migration (CREATE INDEX only). No `Vessel.categoryIds` relation added (D3 default: group by existing
`vesselType` string). No new enum values.
Rationale: Additive-only migration is safe (no DROP/ALTER). Vessel category model is owner [WHAT].
Locked: yes

#### (c) Annual-reset as admin-triggered updateMany via registration-lifecycle.ts helper
Decision: S2 creates `server/lib/registration-lifecycle.ts` with a `bulkResetToInactive(tenantId,
currentYear)` helper called by the tRPC admin mutation. A future cron reuses the same path without
duplicating logic. `fisherfolk.renew` gains an `existing.status === "INACTIVE"` guard (throws
PRECONDITION_FAILED if not INACTIVE) — the existing active-violation + duplicate-year guards are kept.
Rationale: Human-authority pattern (D2); no cron infrastructure exists in the repo; helper is reusable.
Locked: yes

#### (d) getStats shape — add new/renewed counts, drop totalUsers + pendingEditRequests
Decision: `dashboard.getStats` adds `newFisherfolk` (status NEW count) and `renewedFisherfolk`
(status RENEWED count). Removes `totalUsers` and `pendingEditRequests` (no longer displayed on the
redesigned dashboard). Sole consumer is `dashboard-client.tsx`.
Rationale: New group tiles need NEW/RENEWED breakdown; old KPI strip is deleted in S3 (D1).
Locked: yes

#### (e) New category-breakdown procedures with optional year param
Decision: S2 adds `getFisherfolkCategoryBreakdown(registrationType: ALL|NEW|RENEWED)` (counts per
Category using `categoryIds: { has: id }`) and `getVesselCategoryBreakdown` (groupBy `vesselType`
string, omits NEW/RENEWED fraction per D3). Both accept an optional `year` param defaulting to
`Tenant.currentRegistrationYear`.
Rationale: Group tiles (S4) need per-category breakdowns; Vessel has no Category model (D3).
Locked: yes

#### (f) "vs last year" comparison — placeholder text only, no fabricated percentage
Decision: `FisherfolkGroupTile` renders "–" in the year-over-year comparison slot; no historical stat
is estimated or fabricated.
Rationale: No prior-year snapshot mechanism exists in the repo. Owner must confirm data-retention
strategy before a real % comparison can be surfaced.
Locked: yes

### Ayuda mass-selection multi-filter (M1, 2026-07-09) — [HOW] locked (CLAUDE_CODE, owner asleep / Full Auto)

#### (a) HOUSEHOLD-mode filter operates on the household HEAD
Decision: For HOUSEHOLD-`distributionUnit` programs the 7-facet filter matches on the head fisherfolk's
attributes; the recorded beneficiary is the head. FISHERFOLK mode filters/selects fisherfolk directly.
Rationale: One code path (filter fisherfolk → project to head in HH mode); consistent with the household
feature's "household category = head's category" and the existing single-add HOUSEHOLD branch; honours
`@@unique([programId, fisherfolkId])` collapse on head id.
Locked: yes

#### (b) Bulk remove deletes PENDING beneficiaries only
Decision: `removeBeneficiaries` deletes only `verificationStatus === "PENDING"` rows; RECEIVED/CANCELLED
are skipped (and their checkboxes disabled in the UI).
Rationale: Never destroy a confirmed distribution record via a bulk action. Destructive-safety.
Locked: yes

#### (c) Bulk audit-log actions reuse the closed AuditAction enum
Decision: bulk add logs `action: "CREATE"`, bulk remove `action: "DELETE"`, both with `bulk: true` +
added/removed/skipped counts in the metadata payload (entityId = programId).
Rationale: `AuditAction` is a closed Prisma enum; invented `AYUDA_BULK_*` values would fail at the DB
layer. Metadata preserves the distinguishable bulk trail.
Locked: yes

#### (d) "Add all matching" capped at 5000 targets
Decision: `matchingIds`/bulk mutations cap at 5000 with a `matchingTruncated` flag surfaced in the UI.
Rationale: Bounds a pathological bulk op; FMO dataset (~3006) never approaches it.
Locked: yes

#### (e) Persisting the filter into AyudaProgram.filters Json — deferred (not this milestone)
Decision: the existing unused `AyudaProgram.filters` Json field is NOT wired up in M1; saved/named
filter presets are out of scope.
Rationale: YAGNI for the mass-select flow; revisit if the owner wants reusable saved filters.
Locked: no (candidate follow-up)

#### (g) WCAG 2.2 AA hard gate covers all new surfaces (gov/LGU)
Decision: S6 runs a full axe WCAG 2.2 AA audit on every new surface (year select, registration-type
filter, group tiles, lower-chart tiles). All violations found in S6 are fixed in-session — none
deferred. Governing: ui-rules.md R13 + privacy.md (V32.9) + Rule 33 (gov/LGU app, DICT MC 004).
Locked: yes

---

## 3-Tier Tenant RBAC (Milestone 3, 2026-07-11) — [HOW] locked (CLAUDE_CODE, Full Auto)
Retrofit of FRMS onto the fleet-wide 3-tier tenant RBAC standard
(`~/.claude/rules/tenant-rbac-standard.md`), dev-first, LOCAL commits only under HARD HOLD.
Shipped as Chunks A–C on `feat/household-management` (`e8265ec` / `ad5817a` / `2426039`).

#### (a) Enum rename is data-preserving — never DROP/CREATE
Decision: the three system tiers were introduced by renaming existing `UserRole` values in place —
`super_admin`→`tenant_manager`, `admin`→`tenant_superadmin`, plus a NEW `tenant_admin` value —
via `ALTER TYPE "UserRole" RENAME VALUE …` (×2) + `ADD VALUE` in migration
`20260710120000_tenant_rbac_3tier_rename`. No DML, no downtime; existing user rows kept their
renamed role automatically (dev: tenant_manager=1, tenant_superadmin=8, encoder=1, viewer=3).
Rationale: DROP/CREATE would lose every user's role (MG-proven). Domain roles
(`encoder`/`viewer`/`bantay_dagat`) are unchanged and sit below `tenant_admin`.
Locked: yes

#### (b) FRMS platform-tenant deviation — `tenant_manager` carries a NON-null tenant_id
Decision: unlike the fleet standard (`tenant_manager.tenant_id = NULL`), FRMS's platform manager
belongs to a real dedicated **`platform` tenant** (non-null `tenant_id`). Consequence: platform ops
resolve tenant-guarded models through **`platformPrisma`**, NOT `ctx.db` (which throws "Tenant
context not set" at runtime — passes tsc + isolated tests, fails live). The one-owner partial-unique
index therefore exempts the manager via its **role predicate** (`role='tenant_superadmin'`), not via
the standard's `tenant_id IS NOT NULL` clause; the clause is kept as a fleet-standard guard and the
deviation is documented in the migration SQL.
Rationale: FRMS was built NULL-tenant-free before the standard existed; a real platform tenant is
less invasive than re-architecting to NULL-based tenancy.
Locked: yes

#### (c) One owner per tenant — DB-enforced by a partial-unique index (migration-only)
Decision: `CREATE UNIQUE INDEX one_tenant_superadmin_per_tenant ON users(tenant_id) WHERE
role='tenant_superadmin' AND tenant_id IS NOT NULL` (migration `20260710130000`), preceded by a
generic `row_number()` window-function normalization that demotes every non-oldest owner per tenant
to `tenant_admin` (dev: only calapan-city had 2 → calapanadmin demoted; webmaster@localhost kept as
oldest). Applied via `migrate deploy`, never `migrate dev`.
⚠ **[WATCH] Prisma cannot represent a partial-unique index in schema.prisma** → a future
`migrate dev` may propose DROPping this index as drift. **Never accept the autogen DROP** — keep the
index migration-only (MG-proven footgun).
Rationale: DB is the only trustworthy place to enforce "exactly one owner"; app-layer checks race.
Locked: yes

#### (d) Two-way owner succession is mandatory (both directions built + tested)
Decision: ownership is always recoverable AND transferable, via two procedures, each doing
**demote-current-owner → promote-new-owner in that order** (the partial-unique index is non-deferred;
promote-first trips 23505 mid-transaction):
  - Platform break-glass **`tenant.reassignOwner`** (`tenantManagerProcedure`, `platformPrisma`) —
    reassigns a tenant's owner; NOT_FOUND on bad tenant/user, BAD_REQUEST on deactivated/already-owner.
  - Self-service **`user.transferOwnership`** (`tenantSuperadminProcedure`, `$transaction`) — owner
    promotes a target and demotes self; body-guarded so a platform `tenant_manager` can't self-transfer.
Both bump `securityVersion` (logs affected sessions out) and write an audit row.
Rationale: an owner may leave; the platform must be able to recover, and owners must be able to hand off.
Locked: yes

#### (e) Owner role is reachable ONLY via succession — never via create/updateRole
Decision: `user.create` and `user.updateRole` zod enums **exclude `tenant_superadmin`**; the assignable
in-tenant set is `tenant_admin / encoder / viewer / bantay_dagat`. A tenant_admin or owner can no
longer mint a second owner through ordinary user management.
Rationale: attack-informed (BFLA / privilege-escalation) — removes the only runtime path that could
trip the one-owner index, so 23505 is structurally unreachable outside succession.
Locked: yes

#### (f) Succession audits reuse the closed AuditAction enum
Decision: `AuditAction` is a fixed Prisma enum with no REASSIGN/TRANSFER value → succession events log
`action: "UPDATE"` with a descriptive `after` payload naming the previous/new owner.
Rationale: inventing enum values would fail at the DB layer (same class as the Ayuda-bulk decision above).
Locked: yes

#### (g) `tenant_admin` is the capability ceiling; custom-role matrix deferred
Decision: `tenant_admin` is broad tenant admin minus User Management + Tenant Settings, and is the
ceiling for any future custom role. The data-driven custom-role permission-matrix + role-builder UI
(feature_registry + role_permissions CRUD + `hasPermission` 3-surface enforcement) is **DEFERRED** to a
later milestone (see PENDING_DECISIONS PD-005).
Locked: yes (matrix layer deferred, not cancelled)

#### (h) PRODUCT.md back-port deferred (Rule 1 human-only)
Decision: PRODUCT.md line 44 still lists the OLD role names (`Super Admin, Admin, Encoder, Viewer,
Bantay Dagat`). Under Rule 1 (PRODUCT.md is human-edited only) this back-port is surfaced as a
candidate in BACKPORT_CANDIDATES.md, not auto-applied.
Locked: yes (deferred to human back-port)

## 2026-07-11 — PRODUCT.md back-port: Candidates K/L/M/N applied (Rule 1 waiver — owner-approved)
Decision: owner APPROVED back-porting BACKPORT_CANDIDATES.md Candidates K, L, M, N into
docs/PRODUCT.md (PD-005/PD-006 owner-approval precedent, mirroring the A–J/J Rule 1 waiver of
2026-06-30). All four candidates were previously ⏳ DRAFT/awaiting-application; the shipped code
already implements each. Applied LOCAL-only (not committed by this session — commit is a separate
owner-triggered step per HARD HOLD).
- **Candidate K (Household Management):** added a `### Household Management` subsection (after
  Fisherfolk Registration) + a Distribution Unit paragraph under `### Ayuda Programs` + a new
  `Household` Data Entity + `householdId` on Fisherfolk/AyudaBeneficiary + `distributionUnit` on
  AyudaProgram.
- **Candidate L (ToDo — Kanban + Calendar):** renamed `### Kanban Task Board` to `### ToDo (Kanban +
  Calendar)` describing the Kanban/Calendar view toggle, due dates, source-entity linking, "Make
  ToDo," and the any-user-assignable picker; `KanbanTask` entity extended with `dueDate`,
  `sourceEntityType`, `sourceEntityId`; `/[tenant]/kanban` → `/[tenant]/todo` route noted.
- **Candidate M (Ayuda mass-selection multi-filter):** added a "Filter & Bulk Add" paragraph under
  `### Ayuda Programs` (barangay/household/category/age/status/vessel-owner/vessel-type filters,
  add-all/add-selected/bulk-remove, 5000-target cap, Distribution-Unit-aware). No Data Entities change.
- **Candidate N (3-Tier Tenant RBAC role names):** renamed the RBAC bullet (line 44) and every
  formal role-gating reference (Roles+Permissions matrix, Data Entities `User.role` enum +
  `customRoleId`, Access Control route map, Tenant Settings/User Management/Data Import/Reports/
  Audit Logging section headers) from the old `Super Admin/Admin/SuperAdmin/BantayDagat` naming to
  the shipped 3-tier standard: **Tenant Manager** (platform) / **Tenant Superadmin** (tenant owner)
  / **Tenant Admin** (day-to-day, excluded from User Mgmt + Tenant Settings), plus domain roles
  Encoder/Viewer/Bantay Dagat; noted two-way succession + the tenant_superadmin-only custom-role
  Role Builder (PD-005, shipped) as an additional capability below the fixed tiers.
Note: informal narrative mentions of "Admin" in Core User Flows prose (flows #3, #5, #7, #8, #11,
#13), the Mobile Needs table notes column, and entity relation field labels (e.g. `liftedBy (Admin
user, nullable)`) were intentionally left as-is — out of the assigned rename scope (grep-verified:
zero remaining `Super Admin` / `SuperAdmin` / `BantayDagat` one-word matches).
Attribution: CLAUDE_CODE. Locked: yes.

---

## PRODUCT.md back-port — Fish Catch (M2/M3) + Universal Report Hub (M4) — [WHAT] applied
Decision: On owner's explicit "do all 3 gated items" directive (2026-07-17, Full Auto), the
already-built-and-verified M2 Fish Catch activity, M3 Fish Catch analytics, and M4 Universal Report
Hub features (batch 2026-07-09, branch `feat/household-management`, since merged to main) were
back-ported into `docs/PRODUCT.md`:
  (a) New **### Fish Catch (catch-landing & effort tracking)** module section (M2 activity + M3
      analytics tabs) inserted between Dashboard and Reports.
  (b) **Universal Report Hub** paragraph appended to the **### Reports** section (6-domain faceted
      ledger+charts tab; the 9 fixed official-header report types unchanged).
  (c) New **FishCatch** + **FishCatchSpecies** entries under **## Data Entities** (fields transcribed
      from the shipped Prisma schema — code won over the 8-day-old draft memory).
  (d) Removed the now-stale `- No fish catch reporting or harvest tracking` line from **## Out of Scope**.
Rationale: PRODUCT.md is human-owned (Rule 1); the owner waived Rule 1 for this back-port (precedent:
the 2026-06-30 "Rule 1 waiver (extended)" and the 2026-07-11 M1/N waivers). Where the pre-drafted
candidate text and the shipped code diverged, the **code won** (entity fields taken from
`packages/db/prisma/schema.prisma`, analytics/report shapes from the shipped routers).
Locked: yes

---

## Site Access & Tenancy Bootstrap Standard — [WHAT] locked (2026-08-16, owner-approved)
Decision: Adopt the per-environment tenancy topology + access-routing standard defined in the owner's
`NEW SITE CREDENTIALS.pdf`, captured canonically in `docs/SITE_ACCESS_STANDARD.md`. Locked sub-decisions:
  (a) **3-layer model per real env**: `/tm` Tenant Management Site (platform/SaaS owner) → `/{client-slug}`
      Client Tenant → optional Demo Tenant.
  (b) **Management slug rename `platform` → `tm`** (routes `/platform/*` → `/tm/*`).
  (c) **Platform-tier RBAC gains two curated roles**: `tenant_billing` (BILLING) + `tenant_tech`
      (TECH SUPPORT), alongside the default `tenant_manager` (ADMIN). The `/tm` site gets its own internal
      role/permission-set system (default ADMIN, can create more).
  (d) **Per-tenant URL scheme (ONE login form, role-routed post-login)**: admin-tier
      (`tenant_superadmin` + `tenant_admin`) land at `/{slug}/admin`; regular users login/land at `/{slug}/login`.
  (e) **Demo stays a SEPARATE deployment** (not merged into prod), always a client-facing subdomain
      (`demo.<domain>.com/admin` or `{app}-demo.powerbyte.app/admin`), with **NO `/tm` platform layer**.
  (f) **Fleet-wide standard** — authored globally (tenant-rbac-standard.md + framework rbac.md + SOPS vault),
      FRMS is the reference implementation, then broadcast to other tenant apps (never cross-seat repo edits).
  (g) **Demo accounts renamed**: `tenant_superadmin` = `superadmin@demo.com`, `tenant_admin` = `admin@admin.com`.
  (h) **Platform passwords are distinct per role**; all passwords live ONLY in the SOPS vault, never in repo.
Rationale: resolves the tenant-URL confusion by giving every environment one uniform, self-documenting
access shape; cleanly separates the SaaS platform owner (`/tm`) from the client's top access
(`tenant_superadmin`); keeps demo isolated as its own subdomain deployment. Owner clarified: `/tm` = server/
real-app owner (SaaS operator); `tenant_superadmin` = per-tenant client topmost access; demo needs no
Tenant Manager because it is always a single-tenant subdomain.
Locked: yes. HARD HOLD — local commits only; deploys + live re-seeds owner-gated.

---

## FIS-35 Calendar of Activities (unified agenda home) — [WHAT] locked (2026-09-05, owner-approved)
Owner green-lit the build (resume session: "start FIS-35 then FIS-36 then FIS-37"). The 7 plan
decisions (`docs/plans/PLAN_calendar_activities_dashboard.md`) resolve as:
  1. **Recurring events** — DEFERRED (single-instance MVP; RRULE = Phase 3). _[HOW default]_
  2. **Events model** — REUSE `KanbanTask` (`kind=EVENT`, `audience=ANNOUNCED`); NO separate `Event`
     model — one agenda query, one detail dialog, one colour system. _[HOW default]_
  3. **Calendar rendering** — hand-rolled month + list grid (reuse existing `monthMatrix`); no calendar
     library dep in MVP; revisit only if week/day time-grids get heavy. _[HOW default]_
  4. **Home layout** — ⭐ OWNER: **Calendar becomes the home** at `/[tenant]/dashboard`; the heatmap +
     KPI + barangay-density `DashboardClient` RELOCATES intact to `/[tenant]/insights` with a new sidebar
     nav link. Nothing deleted. (Option A.)
  5. **Announce-to-all rights** — ⭐ OWNER: `tenant_admin`+ **AND `encoder` + `bantay_dagat`** may post
     org-wide announced events; `viewer` may NOT (read-only). Broader than the plan's admin-only default.
  6. **Announcement lifecycle** — events stay (no auto-archive in MVP); per-user hide → Phase 2. _[HOW default]_
  7. **Notification fan-out** on share/announce — Phase 2 (calendar renders without it). _[HOW default]_
Data model: additive only — new nullable/defaulted columns on `KanbanTask` (`createdById`, `startAt`,
`endAt`, `allDay`, `kind`, `audience`) + new `KanbanTaskShare` join table + new enums `KanbanTaskKind`,
`TaskAudience`. No `ALTER TYPE`, no destructive change, existing rows valid (calendar falls back
`startAt ?? dueDate`). Locked: yes. HARD HOLD — local commits only; deploy owner-gated.
## FIS-36 Field Diary / Notes → Projects — [WHAT] defaults (2026-09-05, owner green-lit build)
Owner: "start FIS-35 then FIS-36 then FIS-37." FIS-36 is a 4-phase module (`docs/plans/PLAN_diary_notes_projects.md`);
this session builds **Phase 1 (usable stamped field diary)**. The 6 plan [WHAT]s taken to conservative best-judgment
defaults (documented; owner may override) — the two ⚠ flagged are worth explicit owner confirmation:
  - **D1 Editor** — TipTap v2 (ProseMirror, headless, JSON doc → Note.body). _[HOW]_ (verify API via context7, Rule 30).
  - **D2 Report format** — print→PDF first (Phase 3), XLSX follow-on reusing report.ts ExcelJS; DOCX only on demand. _[HOW]_
  - **D3 Privacy** ⚠ — **notes PRIVATE by default** (author + tenant_admin+ only); author may mark a note `shared`
    (visible to tenant users with notes:view). This is the SAFEST/most privacy-conservative default (RA 10173 / Rule 33,
    notes reference citizen PII). Owner may widen/narrow. Audit-logged (entityType "note").
  - **D4 Projects vs Kanban** — Projects/ProjectTodo DEFERRED (Phase 4); when built, lightweight ProjectTodo checklist +
    LINK KanbanTask (never merge the models). _[HOW]_
  - **D5 Chip depth** — entity chip = labelSnapshot (link + snapshot text), no live-fetch detail block in MVP. _[HOW]_
  - **D6 Back-dating capturedAt** ⚠ — allow back-dating within a 14-day window (payroll integrity); default now(). Owner
    may change the window or lock to createdAt.
Data model: additive migration (Note, NoteMedia, NoteEntityRef + enums NoteVisibility/NoteRefType + FeatureKey values
`notes`,`projects`); Project* models NOT added yet. Notes are personal data → authed routes noindex (Rule 35), audit-logged
(Rule 33). PRODUCT.md back-port owed on accept (Rule 1). Locked: Phase-1 defaults; HARD HOLD — local commits only.
## FIS-37 Mobile App — [WHAT] locked (2026-09-05, owner-answered)
Owner: "start FIS-37" + answered the 3 pivotal decisions. Plan: `docs/plans/PLAN_mobile_app.md`.
  - **D1 Stack** — ⭐ OWNER: **Expo (managed React Native)**, new `apps/mobile/` workspace, consumes the tRPC API
    (AppRouter type only, never @frms/db — Rule 13) + `@frms/shared` RBAC.
  - **D2 Offline** — ⭐ OWNER: **online-first MVP** (reads cache, writes need connectivity + graceful errors); full
    offline write-outbox is a later phase.
  - **D5 Field-staff violation creation** — ⭐ OWNER: **NO** — mobile is read/scan/confirm + notes only; `violation.create`
    stays admin-only, ZERO authz change (safest; keeps the permission model intact).
  - **D9 Diary alignment** — RESOLVED: mobile notes reuse the FIS-36 `note` router (already built).
  [HOW] calls taken: additive Auth.js-Credentials-backed **bearer-token** endpoint → Expo SecureStore (ONE shared
  credential-verify path for web+mobile, never fork bcrypt/securityVersion); QR **payload v2 type-tag** (`t:`), backward-
  compatible with printed v1 cards; ayuda `regNo` optional in v2 payload. Push notifications DEFERRED.
Still OWNER-owed (do NOT block the build — distribution/branding prerequisites, tracked in PENDING_DECISIONS):
  - **D3 App-store accounts** — Apple Developer ($99/yr) + Google Play ($25); under Powerbyte or the LGU? (blocks store
    DISTRIBUTION only, not building/dev testing).
  - **D4 App identity/branding** — name, icon, splash, bundle id (`ph.gov.calapan.frms`?), LGU vs Powerbyte white-label.
  - **D6 Push notifications** — in scope at all? (recommend post-MVP).
Scope note: FIS-37 is a greenfield native app — CANNOT be browser-verified here (needs emulator/device). This session
builds the VERIFIABLE, security-critical foundation (the mobile bearer-token auth endpoint, server-side, unit-tested);
the Expo app scaffold + screens + device QA are the dedicated follow-on. Locked: yes. HARD HOLD — local commits only,
no store submission, no deploy.
