# Implementation Map — FRMS
# Current build state. Rewritten after every feature update.
# Shows what is built, what is pending, and what changed last.

---

> **Framework: V32.14** (upgraded from V31 on 2026-06-25 via sync-to-project.sh + deploy.sh).
> 33 rules. CLAUDE.md is the compact auto-load; detail files in `.ai_prompt/` (load-on-demand);
> `.claude/rules/` intentionally empty (V32.7). New gov-app gates: Rule 33 / `.ai_prompt/privacy.md`
> (PH Data Privacy Act + WCAG 2.2 AA). Stack unchanged & fully aligned. ⚠ Requires Claude Code
> restart for V32 layout to load — Batch 3b runs in that fresh session.

---

## Phase Status

| Phase | Status | Last Updated |
|-------|--------|--------------|
| Phase 0 — Bootstrap | ✅ Complete | 2026-05-02 |
| Phase 1 — Dev Environment | ⏭ Skipped (already set up) | — |
| Phase 2 — Discovery Interview | ✅ Complete | 2026-05-02 |
| Phase 2.5 — Spec Summary | ✅ Complete | 2026-05-02 |
| Phase 2.6 — Design System | ⏭ Skipped (UI UX Pro Max not installed) | 2026-05-02 |
| Phase 2.7 — Spec Stress-Test | ✅ Passed (0 gaps) | 2026-05-02 |
| Phase 3 — Generate Spec Files | ✅ Complete | 2026-05-02 |
| Phase 4 — Full Scaffold | ✅ Complete (all 8 Parts) | 2026-05-07 |
| Phase 5 — Validation | ✅ Complete (all 9 commands pass) | 2026-05-07 |
| Phase 6 — Docker + Visual QA | ✅ Complete (15 errors fixed) | 2026-05-08 |
| Post-Phase 6 — Fix login auth | ✅ Complete (4 errors fixed, on fix branch) | 2026-05-08 |
| Phase 7 — Feature Updates | Not Started | — |
| Phase 8 — Iterative Buildout | ⏳ In Progress (Batches 1, 2a, 2b-1, 2b-2, 3a, 3b, 3d, 3c-1, 3c-2, 3f merged to main — Edit Request feature complete; next unit owner's call) | 2026-06-26 |

---

## Root Config Files (Phase 4 Part 1 Output)

| File | Status |
|------|--------|
| pnpm-workspace.yaml | ✅ Generated |
| turbo.json | ✅ Generated |
| tsconfig.base.json | ✅ Generated |
| .editorconfig | ✅ Generated |
| .prettierrc | ✅ Generated |
| .eslintrc.js | ✅ Generated |
| .gitignore | ✅ Updated (coverage, .vitest, swap files) |
| .nvmrc | ✅ Pre-existing (22) |
| package.json | ✅ Rewritten (root scripts + devDependencies) |
| pnpm-lock.yaml | ✅ Generated (124 packages) |

---

## Spec Files (Phase 3 Output)

| File | Status |
|------|--------|
| inputs.yml | ✅ Generated (~490 lines) |
| inputs.schema.json | ✅ Generated (~321 lines) |
| .env.dev | ✅ Generated (gitignored) |
| .env.staging | ✅ Generated (gitignored) |
| .env.prod | ✅ Generated (gitignored) |
| .env.example | ✅ Generated (committed template) |
| CREDENTIALS.md | ✅ Generated (gitignored) |
| scripts/sync-credentials-to-env.sh | ✅ Generated |

---

## Shared Packages (Phase 4 Part 2 Output)

| File | Status |
|------|--------|
| packages/shared/package.json | ✅ Generated |
| packages/shared/tsconfig.json | ✅ Generated |
| packages/shared/src/types/enums.ts | ✅ Generated (14 const object enums) |
| packages/shared/src/types/tenant.ts | ✅ Generated |
| packages/shared/src/types/user.ts | ✅ Generated |
| packages/shared/src/types/fisherfolk.ts | ✅ Generated |
| packages/shared/src/types/vessel.ts | ✅ Generated |
| packages/shared/src/types/violation.ts | ✅ Generated |
| packages/shared/src/types/edit-request.ts | ✅ Generated |
| packages/shared/src/types/comment.ts | ✅ Generated |
| packages/shared/src/types/audit-log.ts | ✅ Generated |
| packages/shared/src/types/category.ts | ✅ Generated |
| packages/shared/src/types/kanban-task.ts | ✅ Generated |
| packages/shared/src/types/notification.ts | ✅ Generated |
| packages/shared/src/types/ayuda.ts | ✅ Generated (AyudaProgram + AyudaBeneficiary + AyudaUpload) |
| packages/shared/src/types/id-template.ts | ✅ Generated |
| packages/shared/src/types/index.ts | ✅ Generated (barrel export) |
| packages/shared/src/schemas/enums.ts | ✅ Generated (14 Zod enum schemas) |
| packages/shared/src/schemas/tenant.ts | ✅ Generated |
| packages/shared/src/schemas/user.ts | ✅ Generated |
| packages/shared/src/schemas/fisherfolk.ts | ✅ Generated |
| packages/shared/src/schemas/vessel.ts | ✅ Generated |
| packages/shared/src/schemas/violation.ts | ✅ Generated |
| packages/shared/src/schemas/edit-request.ts | ✅ Generated |
| packages/shared/src/schemas/comment.ts | ✅ Generated |
| packages/shared/src/schemas/audit-log.ts | ✅ Generated |
| packages/shared/src/schemas/category.ts | ✅ Generated |
| packages/shared/src/schemas/kanban-task.ts | ✅ Generated |
| packages/shared/src/schemas/notification.ts | ✅ Generated |
| packages/shared/src/schemas/ayuda.ts | ✅ Generated |
| packages/shared/src/schemas/id-template.ts | ✅ Generated |
| packages/shared/src/schemas/index.ts | ✅ Generated (barrel export) |
| packages/shared/src/constants/index.ts | ✅ Generated (enum arrays + pagination defaults) |
| packages/api-client/package.json | ✅ Generated |
| packages/api-client/tsconfig.json | ✅ Generated |
| packages/api-client/src/index.ts | ✅ Generated (typed tRPC v11 wrapper) |

---

## Database Package (Phase 4 Part 3 Output)

| File | Status |
|------|--------|
| packages/db/package.json | ✅ Generated |
| packages/db/tsconfig.json | ✅ Generated |
| packages/db/prisma/schema.prisma | ✅ Generated (15 entities, multi-tenant, all relations) |
| packages/db/prisma/seed.ts | ✅ Generated (webmaster admin + category data) |
| packages/db/prisma/migrations/00000000000000_init/migration.sql | ✅ Generated (up — creates all tables + RLS) |
| packages/db/prisma/migrations/00000000000000_init/down.sql | ✅ Generated (down — drops all tables) |
| packages/db/prisma/migrations/migration_lock.toml | ✅ Generated |
| packages/db/src/index.ts | ✅ Generated (barrel export) |
| packages/db/src/client.ts | ✅ Generated (PrismaClient with tenant-guard extension) |
| packages/db/src/audit.ts | ✅ Generated (L5 — immutable AuditLog helper) |
| packages/db/src/rls.ts | ✅ Generated (L2 — PostgreSQL RLS withTenant helper) |
| packages/db/src/middleware/tenant-guard.ts | ✅ Generated (L6 — Prisma $allOperations extension) |

---

## UI + Jobs + Storage Packages (Phase 4 Part 4 Output)

| File | Status |
|------|--------|
| packages/ui/package.json | ✅ Generated |
| packages/ui/tsconfig.json | ✅ Generated |
| packages/ui/src/lib/utils.ts | ✅ Generated (cn() utility — clsx + tailwind-merge) |
| packages/ui/src/globals.css | ✅ Generated (shadcn/ui CSS custom properties — light + dark) |
| packages/ui/src/components/index.ts | ✅ Generated (placeholder barrel) |
| packages/jobs/package.json | ✅ Generated |
| packages/jobs/tsconfig.json | ✅ Generated |
| packages/jobs/src/connection.ts | ✅ Generated (Redis URL parser for BullMQ) |
| packages/jobs/src/types.ts | ✅ Generated (BaseJobPayload + 3 typed payloads) |
| packages/jobs/src/queues/bulk-import.ts | ✅ Generated (5 retries, exponential backoff) |
| packages/jobs/src/queues/yearly-status-reset.ts | ✅ Generated (3 retries) |
| packages/jobs/src/queues/email-notification-digest.ts | ✅ Generated (3 retries) |
| packages/jobs/src/queues/index.ts | ✅ Generated (barrel export) |
| packages/jobs/src/workers/bulk-import.worker.ts | ✅ Generated (concurrency 1, rate limited) |
| packages/jobs/src/workers/yearly-status-reset.worker.ts | ✅ Generated (concurrency 1) |
| packages/jobs/src/workers/email-notification-digest.worker.ts | ✅ Generated (concurrency 5) |
| packages/jobs/src/workers/index.ts | ✅ Generated (barrel export) |
| packages/jobs/src/index.ts | ✅ Generated (full barrel export) |
| packages/storage/package.json | ✅ Generated |
| packages/storage/tsconfig.json | ✅ Generated |
| packages/storage/src/client.ts | ✅ Generated (S3Client lazy singleton, forcePathStyle) |
| packages/storage/src/validation.ts | ✅ Generated (magic-byte MIME, 10MB limit, tenant-scoped keys) |
| packages/storage/src/upload.ts | ✅ Generated (upload, download URL, delete, exists — tenant verified) |
| packages/storage/src/index.ts | ✅ Generated (barrel export) |

---

## Web App (Phase 4 Part 5 Output)

| File | Status |
|------|--------|
| apps/web/package.json | ✅ Generated |
| apps/web/tsconfig.json | ✅ Generated (declaration: false override for runtime app) |
| apps/web/next.config.ts | ✅ Generated (7 security headers + standalone output) |
| apps/web/Dockerfile + .dockerignore | ✅ Generated (multi-stage Node 22) |
| apps/web/components.json + tailwind.config.ts + postcss.config.js | ✅ Generated (shadcn/ui init) |
| apps/web/src/env.ts | ✅ Generated (Zod-validated env vars) |
| apps/web/src/middleware.ts | ✅ Generated (tenant slug resolution + auth gate) |
| apps/web/src/app/layout.tsx + page.tsx + globals.css | ✅ Generated (root layout + redirect + theme tokens) |
| apps/web/src/app/login/page.tsx | ✅ Generated (Credentials sign-in + Turnstile) |
| apps/web/src/app/[tenant]/layout.tsx + 15 module pages | ✅ Generated (dashboard, fisherfolk, vessels, violations, edit-requests, ayuda, kanban, id-generator, audit-log, notifications, reports, settings, user-management, map, analytics) |
| apps/web/src/app/[tenant]/reports (page + reports-client) | ✅ Built out 2026-06-27 — 9-type list generator, filters, print/PDF, Admin+ Excel export (report.ts router) |
| apps/web/src/app/[tenant]/analytics (page + analytics-client) | ✅ Built out 2026-06-27 — 7 Recharts charts (chart.tsx + analytics.ts router); recharts@3 |
| apps/web/src/app/[tenant]/import (page + import-wizard) | ✅ Built out 2026-06-27 (DM-5) — admin Import Wizard (upload→preview→commit) over import.ts router; new parseWorkbook proc; sidebar nav. Live-QA verified (3002→import→3002). **DM-6 2026-06-27** — Full/Incremental mode toggle; INCREMENTAL upserts existing records by idNumber (commit returns `updated` count); live-QA verified (record updated, count held at 3002). |
| apps/web/src/app/[tenant]/settings (page + barangay-aliases) + server/trpc/routers/settings.ts | ✅ Built out 2026-06-27 (DM-7) — Barangay alias CRUD UI (typoMap consumed by validate.ts): settings.ts router barangayAlias listAliases/createAlias(upsert)/deleteAlias + barangayList; admin Select-add + table + delete. Live-QA verified full CRUD. **Theme 2026-06-27** — Accent Colors editor (theme-settings.tsx) + settings.theme.get/update; per-tenant primary(tangerine)/secondary(marine) hex, live preview + reset-to-default. |
| Theme system — globals.css tokens + Tenant.primaryColor/secondaryColor + [tenant]/layout.tsx injection + lib/theme/color.ts | ✅ 2026-06-27 — Default accents tangerine #E8843C (hsl 25 79% 57%) + marine #336F92 (hsl 202 48% 39%), WCAG AA, dark bg preserved, --accent decoupled. Per-tenant CSS-var injection on #tenant-theme-root via hex→HSL util w/ luminance-derived foreground. Always-dark (next-themes). Live-QA verified. |
| apps/web/src/app/platform/layout.tsx + tenants/page.tsx | ✅ Generated (`tenant_manager` platform routes; RBAC 3-tier 2026-07-11 renamed super_admin→tenant_manager) + `tenant.reassignOwner` break-glass owner succession (Chunk C `2426039`) |
| RBAC 3-tier retrofit (UserRole enum + procedures + succession) | ✅ 2026-07-11 (M3 Chunks A–D, `e8265ec`/`ad5817a`/`2426039`) — data-preserving enum rename (super_admin→tenant_manager, admin→tenant_superadmin, +tenant_admin), `one_tenant_superadmin_per_tenant` partial-unique index (migration-only, [WATCH] Prisma can't represent), two-way owner succession (`tenant.reassignOwner` + `user.transferOwnership`), owner reachable only via succession (create/updateRole enums drop tenant_superadmin). `tenant-succession.test.ts` 11/11 LIVE, suite 320/320. ⚠ FRMS deviation: tenant_manager NON-null tenant_id → platformPrisma. Docs: DECISIONS_LOG "3-Tier Tenant RBAC", Security_Checklist §21, CREDENTIALS. See PD-005 (custom-role matrix deferred). |
| apps/web/src/app/api/{trpc,auth,health}/* | ✅ Generated (tRPC handler + NextAuth + health endpoint) |
| apps/web/src/components/{header,sidebar}.tsx | ✅ Generated (signOut header + tenant nav sidebar) |
| apps/web/src/lib/{utils,trpc/{client,provider}}.tsx | ✅ Generated (cn helper + tRPC client + React Query provider) |
| apps/web/src/server/auth/{config,index}.ts | ✅ Generated (Auth.js v5 Credentials + Prisma adapter + JWT + securityVersion invalidation) |
| apps/web/src/server/lib/rate-limit.ts | ✅ Generated (LRU, 4 tiers: public/auth/api/upload) |
| apps/web/src/server/lib/sanitize.ts | ✅ Generated (DOMPurify wrappers) |
| apps/web/scripts/link-fmo-assets.ts + photo/signature display | ✅ 2026-06-27 — FMO photos(.JPG)/signatures(.PNG) linked to all 3,002 records (2,979 photos + 2,991 sigs, 0 errors) via DB-lookup linker → sharp <200KB → MinIO `frms-dev` (bucket created via mc). next.config.ts CSP img-src extended with STORAGE_ENDPOINT origin so presigned URLs render. header.tsx role badge contrast fixed. Live-QA: detail page renders photo+signature, 0 console errors. Audit: 23 records truly missing photo / 11 missing signature (reconciled vs disk — genuinely absent). Detail empty states = "No Image"/"No Signature available". |
| Missing-asset tracking (dashboard + list filter) | ✅ 2026-06-27 — dashboard.getStats missingPhoto/missingSignature; "Data Completeness" dashboard section w/ 2 clickable cards → fisherfolk?missing=photo\|signature; fisherfolk.list `missing` filter (photo/signature IS NULL); list reads ?missing= URL param + clearable banner. Live-QA verified (23/11). |
| apps/web/src/components/shared/category-picker.tsx | ✅ 2026-06-27 — category icons switched from OS-emoji (tofu boxes) to lucide per-category (Ship/Fish/Shell/Store/Factory/Waves) + colored-dot fallback; fixed nested-<button> hydration error (radix Checkbox → presentational checkbox + aria-pressed). |
| apps/web/src/server/lib/prisma-input.ts | ✅ Generated (typed omitUndefined<T> helper for exactOptionalPropertyTypes) |
| apps/web/src/server/trpc/{trpc,context,root}.ts | ✅ Generated (init + ctx + router barrel) |
| apps/web/src/server/trpc/routers/*.ts (×14) | ✅ Generated (auditLog, ayuda, category, comment, dashboard, editRequest, fisherfolk, idTemplate, kanbanTask, notification, tenant, user, vessel, violation) |

---

## Mobile App (Phase 4 Part 6)

| Status |
|--------|
| ⏭ Skipped — no mobile app declared in inputs.yml (apps list contains web only) |

---

## Tools + Deploy + Infrastructure (Phase 4 Part 7 Output)

| File | Status |
|------|--------|
| tools/validate-inputs.mjs | ✅ Generated (inputs.yml schema validation) |
| tools/check-env.mjs | ✅ Generated (env var completeness check) |
| tools/check-product-sync.mjs | ✅ Generated (PRODUCT.md ↔ inputs.yml sync + private tag leak check) |
| tools/hydration-lint.mjs | ✅ Generated (SSR hydration mismatch detection) |
| deploy/compose/dev/docker-compose.db.yml | ✅ Generated (PostgreSQL + PgBouncer, dev ports) |
| deploy/compose/dev/docker-compose.cache.yml | ✅ Generated (Valkey 7-alpine) |
| deploy/compose/dev/docker-compose.storage.yml | ✅ Generated (MinIO) |
| deploy/compose/dev/docker-compose.infra.yml | ✅ Generated (MailHog SMTP + UI) |
| deploy/compose/dev/docker-compose.app.yml | ✅ Generated (build: + image: — dev rebuilds from source) |
| deploy/compose/dev/docker-compose.pgadmin.yml | ✅ Generated (pgAdmin 4) |
| deploy/compose/dev/pgadmin-servers.json | ✅ Generated (pre-configured server connection) |
| deploy/compose/stage/docker-compose.db.yml | ✅ Generated (PostgreSQL + PgBouncer, standard ports) |
| deploy/compose/stage/docker-compose.cache.yml | ✅ Generated (Valkey) |
| deploy/compose/stage/docker-compose.storage.yml | ✅ Generated (MinIO) |
| deploy/compose/stage/docker-compose.app.yml | ✅ Generated (image: only — no build: — Traefik labels) |
| deploy/compose/stage/docker-compose.pgadmin.yml | ✅ Generated (pgAdmin 4) |
| deploy/compose/stage/pgadmin-servers.json | ✅ Generated |
| deploy/compose/prod/docker-compose.db.yml | ✅ Generated (PostgreSQL + PgBouncer, standard ports) |
| deploy/compose/prod/docker-compose.cache.yml | ✅ Generated (Valkey) |
| deploy/compose/prod/docker-compose.storage.yml | ✅ Generated (MinIO) |
| deploy/compose/prod/docker-compose.app.yml | ✅ Generated (image: only — no build: — Traefik labels) |
| deploy/compose/prod/docker-compose.pgadmin.yml | ✅ Generated (pgAdmin 4) |
| deploy/compose/prod/pgadmin-servers.json | ✅ Generated |
| deploy/compose/start.sh | ✅ Generated (one-command startup — dev: --build on app) |
| deploy/compose/push.sh | ✅ Generated (manual image promotion: dev→staging→prod) |
| COMMANDS.md | ✅ Generated (master dev command reference) |

---

## CI Workflows (Phase 4 Part 8 Output)

| File | Status |
|------|--------|
| .github/workflows/ci.yml | ✅ Generated (3-job pipeline: governance → quality matrix → security audit) |
| .github/workflows/docker-publish.yml | ✅ Generated (Docker Hub push — bonitobonita24/frms — :latest + :staging-latest + :sha-{hash}) |
| MANIFEST.txt | ✅ Generated (all files from all 8 Parts) |

---

## Apps

| App | Framework | Status |
|-----|-----------|--------|
| web | Next.js (App Router) | ✅ Scaffolded (Phase 4 Part 5 — typecheck + lint clean) |

---

## Packages

| Package | Status |
|---------|--------|
| packages/shared | ✅ Generated (36 files — types, Zod schemas, constants for 15 entities; extended in Part 5 with new enums: ViolationTargetType, UserStatus, TenantStatus, AyudaUploadType, CategoryIconType, CategoryStatus, IDTemplateType, IDTemplateStatus, CommentTicketStatus + 8 new AuditAction values) |
| packages/api-client | ✅ Generated (typed tRPC v11 wrapper — accepts pre-built TRPCLink[] array) |
| packages/db | ✅ Generated (Prisma schema — 15 entities, multi-tenant RLS, seed, audit L5, tenant-guard L6, RLS L2) |
| packages/ui | ✅ Generated (shadcn/ui shared library — cn() utility, CSS custom properties, globals.css) |
| packages/jobs | ✅ Generated (BullMQ + Valkey — 3 queues: bulk-import, yearly-status-reset, email-notification-digest — with typed payloads, workers, DLQ) |
| packages/storage | ✅ Generated (S3/MinIO wrapper — upload, download presigned URL, delete, exists — magic-byte MIME validation, tenant-scoped paths) |

---

## Infrastructure

| Service | Status |
|---------|--------|
| PostgreSQL + PgBouncer | ✅ Configured (deploy/compose/{dev,stage,prod}/docker-compose.db.yml) |
| Valkey (cache + jobs) | ✅ Configured (deploy/compose/{dev,stage,prod}/docker-compose.cache.yml) |
| MinIO (file storage) | ✅ Configured (deploy/compose/{dev,stage,prod}/docker-compose.storage.yml) |
| MailHog (dev email) | ✅ Configured (deploy/compose/dev/docker-compose.infra.yml) |
| pgAdmin | ✅ Configured (deploy/compose/{dev,stage,prod}/docker-compose.pgadmin.yml) |
| Traefik (staging + prod) | ✅ Configured (labels on stage/prod app service — HTTPS + LetsEncrypt) |

---

## CI/CD Pipeline

| Component | Status |
|-----------|--------|
| GitHub Actions — CI | ✅ .github/workflows/ci.yml (governance + quality matrix + security audit) |
| GitHub Actions — Docker publish | ✅ .github/workflows/docker-publish.yml (bonitobonita24/frms — push on main) |
| Docker image | ✅ bonitobonita24/frms — linux/amd64 + linux/arm64 |
| Komodo deployment | ✅ Configured in inputs.yml (auto_update staging, manual prod) |

---

## Phase 8 — Iterative Buildout

### Batch 1a — Shared UI Components (complete)

| Component | File | Status |
|-----------|------|--------|
| DataTable + DataTableColumnHeader | apps/web/src/components/shared/data-table.tsx | ✅ Built |
| StatusBadge | apps/web/src/components/shared/status-badge.tsx | ✅ Built |
| SearchInput | apps/web/src/components/shared/search-input.tsx | ✅ Built |
| ConfirmDialog | apps/web/src/components/shared/confirm-dialog.tsx | ✅ Built |
| FileUpload | apps/web/src/components/shared/file-upload.tsx | ✅ Built |
| Barrel index | apps/web/src/components/shared/index.ts | ✅ Built |

21 shadcn/ui base components installed. Commit 28ad99e on feat/shared-ui-components.

### Batch 1b — Fisherfolk List Page (complete)

| Component | File | Status |
|-----------|------|--------|
| Fisherfolk list RSC page | apps/web/src/app/[tenant]/fisherfolk/page.tsx | ✅ Built |
| List client component (search, filter, paginate) | apps/web/src/app/[tenant]/fisherfolk/fisherfolk-list-client.tsx | ✅ Built |
| Column definitions (FisherfolkListItem + 6 columns) | apps/web/src/app/[tenant]/fisherfolk/columns.tsx | ✅ Built |
| DataTable showPagination prop | apps/web/src/components/shared/data-table.tsx | ✅ Extended |
| NEW/RENEWED badge column (derived from `_count.renewals` — 0=NEW/green, ≥1=RENEWED/orange) | apps/web/src/app/[tenant]/fisherfolk/columns.tsx | ⏳ S1+ (swarm/registration-status-timeline) |

Commit 5c83d0c on feat/shared-ui-components. Server-side pagination via tRPC fisherfolk.list query with keepPreviousData. Client-rendered custom pager (first/prev/next/last).

**Batch 1 squash-merged → main as commit 79e79d6** (59 files, 30824 insertions). 6 TypeScript strict-mode/ESLint errors fixed before merge: 3x `strict-boolean-expressions` in dropdown-menu.tsx (`inset === true`), 1x `exactOptionalPropertyTypes` in sonner.tsx (`Exclude<T, undefined>`), plus form.tsx, toaster.tsx, use-toast.ts, confirm-dialog.tsx. feat/shared-ui-components branch deleted.

### Batch 2a — Fisherfolk Registration Form (basic) (complete)

| Component | File | Status |
|-----------|------|--------|
| Registration RSC page + role gate | apps/web/src/app/[tenant]/fisherfolk/register/page.tsx | ✅ Built |
| Multi-step form client (Personal → Address → Review) | apps/web/src/app/[tenant]/fisherfolk/register/registration-form-client.tsx | ✅ Built |
| encoderProcedure tRPC role gate | apps/web/src/server/trpc/trpc.ts | ✅ Added |
| generateNextIdNumber query (FF-YYYY-NNNN) | apps/web/src/server/trpc/routers/fisherfolk.ts | ✅ Added |
| fisherfolk.create permission fix (adminProcedure → encoderProcedure) | apps/web/src/server/trpc/routers/fisherfolk.ts | ✅ Fixed |
| Mount sonner Toaster in tenant layout | apps/web/src/app/[tenant]/layout.tsx | ✅ Mounted |

5 files (3 modified, 2 new). Repo-wide typecheck + lint clean.

### Batch 2b — Registration polish (complete — merged to main)

Split into 2b-1 (pickers + duplicate search gate + memory governance, squash `77efa8c`) and 2b-2 (photo + signature + QR + Auth/L6 fix, squash `9ab5039`).

| Component | Status |
|-----------|--------|
| Pre-registration duplicate search (ID/name/RSBSA + create shortcut) | ✅ Built (2b-1, `77efa8c`) — searchForDuplicates 4-level matchType taxonomy |
| Barangay picker (replaces free-text input) | ✅ Built (2b-1) — PSA PSGC source, admin verify before go-live |
| Category multi-select picker | ✅ Built (2b-1) |
| Memory governance layer (.claude/rules/memory-governance.md) | ✅ Added (2b-1) |
| Photo upload (tRPC + S3) | ✅ Built (2b-2, `9ab5039`) |
| Signature capture (signature-pad) | ✅ Built (2b-2) — ts-expect-error workaround for react-signature-canvas v1.1.0-alpha.2 |
| QR code data string generation | ✅ Built (2b-2) — wired into create mutation |
| Auth.js v5 Edge runtime + L6 tenant-context fix | ✅ Fixed (2b-2) — unblocked dev login |

### Batch 3 — Fisherfolk Detail View + Vessel Registration (in progress)

Original Batch 3 split into 3a (detail view, read-only), 3b (vessel registration), 3c (Edit Request workflow — extracted after PRODUCT.md flow #3 review revealed admin queue + diff viewer complexity).

| Component | Status |
|-----------|--------|
| Fisherfolk detail view (/[tenant]/fisherfolk/[id]) — read-only | ✅ Built (Batch 3a, squash on main) |
| List page idNumber column → detail link | ✅ Built (Batch 3a) |
| Vessel registration form (/[tenant]/vessels/register) | ✅ Built (Batch 3b, squash c52a1ab on main) |
| Vessel list (/[tenant]/vessels) + detail (/[tenant]/vessels/[id]) | ✅ Built (Batch 3b) |
| Vessel QR auto-generation on create + render on detail | ✅ Built (Batch 3b) |
| Recent violations panel (on vessel detail) | ✅ Built (Batch 3b — active violations list on vessel detail) |
| Edit Request workflow — encoder form + admin queue + diff viewer | ✅ Built (Batch 3c-1, d73a77c) |
| Edit Request — in-app + email notifications (SMS prepared) | ✅ Built (Batch 3c-2, 0a7a403) |
| In-app notification bell/center (header) | ✅ Built (Batch 3c-2) |
| Fisherfolk ID format-agnostic / mixed IDs | ✅ Built (Batch 3f, b6572cd) |
| `fisherfolk.renew` mutation — encoder role, active-violation block, writes RegistrationRenewal + status→RENEWED + bumps registrationYear + AuditAction.RENEW (fisherfolk.ts) | ⏳ S1+ (swarm/registration-status-timeline) |
| `fisherfolk.markIdReleased` mutation — encoder+admin role, sets idReleasedAt/idReleasedById + AuditAction.ID_RELEASED (fisherfolk.ts) | ⏳ S1+ (swarm/registration-status-timeline) |
| Profile renewal timeline panel — full RegistrationRenewal history, renewalYear desc; shows original dateJoined (fisherfolk-detail-client.tsx) | ⏳ S1+ (swarm/registration-status-timeline) |
| Right-side activity timeline — sanitized AuditLog feed: action/actor/timestamp only, no diffs; protectedProcedure (fisherfolk-detail-client.tsx) | ⏳ S1+ (swarm/registration-status-timeline) |

**Batch 3b shipped — Vessel Registration** (10 files: 6 new + 4 modified, squash c52a1ab on main). Full vessel feature mirroring the fisherfolk pattern: list (`/[tenant]/vessels` + columns + client, MFVR linked to detail, status filter), read-only detail (`/[tenant]/vessels/[id]` — all MFVR fields grouped, linked owners → fisherfolk profiles, active violations panel, QR render, role-gated photo), single-page register form (`/[tenant]/vessels/register` — all fields, fishing-gear chips, optional fisherfolk owner picker via `fisherfolk.list` search, optional photo). Router `vessel.create` hardened to spec: auto-generates+stores QR (`buildQRPayload`, regNo=mfvrNumber, in a transaction); `ownerIds` made OPTIONAL (default `[]`) per PRODUCT.md "optionally link owner"; clearer duplicate-MFVR message; accepts optional `vesselPhoto`. Shared: `upload` ENTITY_TYPES += `"vessel-photo"`; `PhotoUpload` given optional `entityType` prop (backward-compatible). Verified: apps/web tsc EXIT=0, next lint clean across src (no fisherfolk regression), shared tsc EXIT=0. Carried debt: `upload.getDownloadUrl` `encoderProcedure` → Viewer/Bantay Dagat see photo placeholder (same gap as fisherfolk; Batch 3d). Browser/visual QA deferred to Phase 6 (Rule 16).

**Batch 3a shipped — read-only detail view** (3 files +267/-1). New route `/[tenant]/fisherfolk/[id]` = server page + client component rendering profile fields, photo (signed URL via `upload.getDownloadUrl`), signature (signed URL), QR code (data URL via `renderQRDataUrl`). Reused `fisherfolk.getById` — no router changes. List page `idNumber` column wrapped in `<Link>` via `IdNumberCell` sub-component (uses `useParams` for tenant slug). Locked scope: read-only only, core identity + media only, no future-relation placeholders. Follow-up flagged (✅ RESOLVED Batch 3d, 28ca431): `upload.getDownloadUrl` was `encoderProcedure` — Viewer + Bantay Dagat saw "No photo/No signature" placeholders. Batch 3d converted it to `protectedProcedure` (tenant isolation still enforced in `getFileDownloadUrl`), so all authenticated same-tenant roles now see media on fisherfolk + vessel detail.

---

### Batch 4 — ID Generator / ID Card Printing (swarm/id-generator — in planning)

Scope: Full fisherfolk ID card lifecycle — template design, select-and-print, issuance
tracking. Decisions locked 2026-07-01 (SD session, DECISIONS_LOG.md "ID Generator Wave").

#### Schema / Entities

| Entity | Status |
|--------|--------|
| `IDTemplate` model — `frontElements`/`backElements` as strict typed discriminated-union element array (text \| variable \| image \| icon \| qr \| photo \| signature); position+size in mm; content 86×54mm, bleed 90×58mm | ⏳ Schema pending — implementation sessions not started |
| `IDPrintBatch` model — `id`, `tenantId`, `printedById`, `printedAt`, `count`, `idType` (new\|renewed\|update), `fisherfolkIds` | ⏳ Schema pending |
| `idTemplate` tRPC router (scaffold ✅ Generated) — needs `create`/`update`/`delete`/`list`/`getById` (adminProcedure) + `getForPrint` (encoder+admin) implemented | ⏳ Router procedures pending |
| `idPrintBatch` tRPC router — `create` (encoder+admin, writes batch record + validates photo+sig gate); `list`/`getToday` (for Daily-Ops summary) | ⏳ Not yet created |

#### Template Editor UI

| Component | Status |
|-----------|--------|
| Template editor page (`/[tenant]/id-generator/editor`) — dnd-kit drag-and-drop; positioned DOM+CSS-mm elements; adminProcedure only | ⏳ Pending |
| Element palette sidebar — add text / variable / image / icon / qr / photo / signature elements | ⏳ Pending |
| Properties panel — position (x, y mm), size (w, h mm), font/color per element | ⏳ Pending |
| Live card preview — 86×54mm DOM render matching print output exactly | ⏳ Pending |
| Front / back tab toggle in editor | ⏳ Pending |

#### Select & Print Flow

| Component | Status |
|-----------|--------|
| Print-eligible fisherfolk list — shows released/not-released + print-eligible/not-eligible (missing photo or signature blocks checkout) | ⏳ Pending |
| Checkout validation gate — server-side: rejects any fisherfolkId missing `photo` OR `signature` in MinIO | ⏳ Pending |
| Print preview page — positioned DOM, 200×300mm PVC layout, 1–4 ID pairs; back face `scaleX(-1)` mirrored; empty slots = dashed placeholders | ⏳ Pending |
| `@media print` stylesheet — hides chrome, sets page size 200×300mm | ⏳ Pending |
| `IDPrintBatch` record write on confirmed print (who/when/count/idType) | ⏳ Pending |

#### ID Release Integration (from Wave 1)

| Component | Status |
|-----------|--------|
| `fisherfolk.markIdReleased` — already shipped (Wave 1, swarm/registration-status-timeline) | ✅ Shipped (separate wave) |
| Select & Print list surfaces `idReleasedAt` state alongside print-eligibility — decoupled: printing ≠ releasing | ⏳ Pending |

#### Open [WHAT] Questions (owner decision required before implementation)

| ID | Question | Options |
|----|----------|---------|
| [WHAT]-IDG-01 | Vessel IDs in-scope for this wave or a later wave? | (A) In-scope now — extend IDTemplate targetEntity enum to fisherfolk\|vessel; (B) Defer vessel IDs to future wave |
| [WHAT]-IDG-02 | Daily-Operations print-queue widget ships this wave or a later Daily-Ops wave? | (A) Ship now — dashboard "Print Queue" card; (B) Defer widget, IDPrintBatch data recorded now |

---

## Governance Docs

| Document | Status |
|----------|--------|
| PRODUCT.md | ✅ Complete (505 lines) |
| DESIGN.md | ✅ Complete (pre-existing) |
| CHANGELOG_AI.md | ✅ Active (reconciled 2026-06-25 — Batch 2b-1 + 2b-2 entries added) |
| DECISIONS_LOG.md | ✅ Active (17 locked decisions) |
| IMPLEMENTATION_MAP.md | ✅ Active (this file — Phase 4 all 8 Parts complete) |
| inputs.yml | ✅ Generated |
| inputs.schema.json | ✅ Generated |
| CREDENTIALS.md | ✅ Generated (gitignored) |
| lessons.md | ✅ Active (4 typed entries) |
| agent-log.md | ✅ Active |
| project.memory.md | ✅ Active |
| STATE.md | ✅ Active |
| MANIFEST.txt | ✅ Generated (Phase 4 Part 8) |

---

## Locked Decisions (from DECISIONS_LOG.md)

17 decisions locked: Anti-Thrashing Enforcement (UserPromptSubmit hook), Dev Environment (WSL2 native), Git Branching, Model Routing, Port Strategy (base 44377), Docker Image Publishing (bonitobonita24/frms), Tenancy Model (multi-tenant, subdirectory, L1-L6), Auth Strategy (Auth.js v5 + JWT), platformPrisma (unguarded client for auth/platform queries), Cloudflare Turnstile (login only), SMTP Configuration (per-tenant + fallback), Komodo Deployment (V27 auto-update), Spec Stress-Test (enabled, passed), TypeScript declaration: false (apps/web), ESLint type-aware + strict-boolean-expressions options, omitUndefined&lt;T&gt; (exactOptionalPropertyTypes + Prisma payloads), ID Generator Wave — ID Card Printing (typed element schema, dnd-kit DOM/CSS-mm editor, @media print PVC layout, photo+sig validation gate, IDPrintBatch entity, printing decoupled from ID Release).

---

## Port Assignments (Dev)

| Service | Port |
|---------|------|
| App (Next.js) | 44387 |
| PostgreSQL | 44377 |
| PgBouncer | 44378 |
| Valkey (Redis) | 44379 |
| MinIO API | 44380 |
| MinIO Console | 44381 |
| MailHog SMTP | 44382 |
| MailHog UI | 44383 |
| pgAdmin | 44384 |
| Worker | 44388 |
| Prisma Studio | 44397 |
