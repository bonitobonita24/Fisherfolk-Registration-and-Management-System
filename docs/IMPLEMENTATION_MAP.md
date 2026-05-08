# Implementation Map — FRMS
# Current build state. Rewritten after every feature update.
# Shows what is built, what is pending, and what changed last.

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
| Phase 8 — Iterative Buildout | ⏳ In Progress (Batch 1a + 1b complete) | 2026-05-08 |

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
| apps/web/src/app/platform/layout.tsx + tenants/page.tsx | ✅ Generated (super_admin platform routes) |
| apps/web/src/app/api/{trpc,auth,health}/* | ✅ Generated (tRPC handler + NextAuth + health endpoint) |
| apps/web/src/components/{header,sidebar}.tsx | ✅ Generated (signOut header + tenant nav sidebar) |
| apps/web/src/lib/{utils,trpc/{client,provider}}.tsx | ✅ Generated (cn helper + tRPC client + React Query provider) |
| apps/web/src/server/auth/{config,index}.ts | ✅ Generated (Auth.js v5 Credentials + Prisma adapter + JWT + securityVersion invalidation) |
| apps/web/src/server/lib/rate-limit.ts | ✅ Generated (LRU, 4 tiers: public/auth/api/upload) |
| apps/web/src/server/lib/sanitize.ts | ✅ Generated (DOMPurify wrappers) |
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

Commit 5c83d0c on feat/shared-ui-components. Server-side pagination via tRPC fisherfolk.list query with keepPreviousData. Client-rendered custom pager (first/prev/next/last). Pre-existing Batch 1a lint/typecheck errors remain on branch — must be fixed before squash-merge.

### Batch 2 — Fisherfolk Registration Form (pending)

| Component | Status |
|-----------|--------|
| Registration form page (/fisherfolk/register) | ⬜ Not started |
| Multi-step form (personal, address, fishing details) | ⬜ Not started |
| ID auto-generation via tRPC create mutation | ⬜ Not started |

### Batch 3 — Fisherfolk Detail View + Vessel Registration (pending)

| Component | Status |
|-----------|--------|
| Fisherfolk detail view (/fisherfolk/[id]) | ⬜ Not started |
| Vessel registration sub-form | ⬜ Not started |
| Recent violations panel | ⬜ Not started |

---

## Governance Docs

| Document | Status |
|----------|--------|
| PRODUCT.md | ✅ Complete (505 lines) |
| DESIGN.md | ✅ Complete (pre-existing) |
| CHANGELOG_AI.md | ✅ Active (9 entries) |
| DECISIONS_LOG.md | ✅ Active (12 locked decisions) |
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

12 decisions locked: Dev Environment (WSL2 native), Git Branching, Model Routing, Port Strategy (base 44377), Docker Image Publishing (bonitobonita24/frms), Tenancy Model (multi-tenant, subdirectory, L1-L6), Auth Strategy (Auth.js v5 + JWT), Cloudflare Turnstile (login only), SMTP Configuration (per-tenant + fallback), Komodo Deployment (V27 auto-update), Spec Stress-Test (enabled, passed), TypeScript declaration: false (apps/web — runtime app, no .d.ts emission).

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
