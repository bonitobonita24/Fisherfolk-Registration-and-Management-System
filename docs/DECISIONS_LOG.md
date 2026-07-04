# Decisions Log — FRMS
# Locked decisions. Never re-ask anything listed here.
# Format: ## Decision Title → Decision / Rationale / Locked: yes

---

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
