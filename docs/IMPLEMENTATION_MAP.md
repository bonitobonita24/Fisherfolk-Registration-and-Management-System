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
| Phase 4 — Full Scaffold | ⏳ In Progress (Part 4 of 8 complete — PAUSED) | 2026-05-03 |
| Phase 5 — Validation | Not Started | — |
| Phase 6 — Docker + Visual QA | Not Started | — |
| Phase 7 — Feature Updates | Not Started | — |
| Phase 8 — Iterative Buildout | Not Started | — |

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

## UI + Jobs + Storage Packages (Phase 4 Part 4 Output)

| File | Status |
|------|--------|
| packages/ui/package.json | ✅ Generated |
| packages/ui/tsconfig.json | ✅ Generated |
| packages/ui/src/lib/utils.ts | ✅ Generated (cn() utility — clsx + tailwind-merge) |
| packages/ui/src/globals.css | ✅ Generated (shadcn/ui CSS custom properties — light + dark) |
| packages/ui/src/components/index.ts | ✅ Generated (placeholder — components added in Part 5) |
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

## Apps

| App | Framework | Status |
|-----|-----------|--------|
| web | Next.js (App Router) | Not scaffolded (Phase 4 Part 5) |

## Packages

| Package | Status |
|---------|--------|
| packages/shared | ✅ Generated (36 files — types, Zod schemas, constants for 15 entities) |
| packages/api-client | ✅ Generated (typed tRPC v11 wrapper — accepts pre-built TRPCLink[] array) |
| packages/db | ✅ Generated (Prisma schema — 15 entities, multi-tenant RLS, seed, audit L5, tenant-guard L6, RLS L2) |
| packages/ui | ✅ Generated (shadcn/ui shared library — cn() utility, CSS custom properties, globals.css) |
| packages/jobs | ✅ Generated (BullMQ + Valkey — 3 queues: bulk-import, yearly-status-reset, email-notification-digest — with typed payloads, workers, DLQ) |
| packages/storage | ✅ Generated (S3/MinIO wrapper — upload, download presigned URL, delete, exists — magic-byte MIME validation, tenant-scoped paths) |

## Infrastructure

| Service | Status |
|---------|--------|
| PostgreSQL + PgBouncer | Not configured (Phase 4 Part 7) |
| Valkey (cache + jobs) | Not configured (Phase 4 Part 7) |
| MinIO (file storage) | Not configured (Phase 4 Part 7) |
| MailHog (dev email) | Not configured (Phase 4 Part 7) |
| pgAdmin | Not configured (Phase 4 Part 7) |

## Governance Docs

| Document | Status |
|----------|--------|
| PRODUCT.md | ✅ Complete (505 lines) |
| DESIGN.md | ✅ Complete (pre-existing) |
| CHANGELOG_AI.md | ✅ Active (6 entries) |
| DECISIONS_LOG.md | ✅ Active (11 locked decisions) |
| IMPLEMENTATION_MAP.md | ✅ Active (this file) |
| inputs.yml | ✅ Generated |
| inputs.schema.json | ✅ Generated |
| CREDENTIALS.md | ✅ Generated (gitignored) |
| lessons.md | ✅ Active (1 entry) |
| agent-log.md | ✅ Active (14 entries) |
| project.memory.md | ✅ Active |
| STATE.md | ✅ Active |

## Locked Decisions (from DECISIONS_LOG.md)

11 decisions locked: Dev Environment (WSL2 native), Git Branching, Model Routing, Port Strategy (base 44377), Docker Image Publishing (bonitobonita24/frms), Tenancy Model (multi-tenant, subdirectory, L1-L6), Auth Strategy (Auth.js v5 + JWT), Cloudflare Turnstile (login only), SMTP Configuration (per-tenant + fallback), Komodo Deployment (V27 auto-update), Spec Stress-Test (enabled, passed).
