# Changelog AI — FRMS
# Agent-attributed change log. Every entry states which agent made the change.
# Format: ## YYYY-MM-DD — [Phase or Feature Name]
# Attribution: CLINE | CLAUDE_CODE | COPILOT | HUMAN | UNKNOWN

---

## 2026-05-03 — Phase 4 Part 4 (packages/ui + packages/jobs + packages/storage)
- Agent:               CLAUDE_CODE
- Why:                 Generate shared UI library, typed job queues with BullMQ/Valkey, and S3/MinIO storage wrapper (Part 4 of 8)
- Files added:         packages/ui/package.json, packages/ui/tsconfig.json, packages/ui/src/lib/utils.ts, packages/ui/src/globals.css, packages/ui/src/components/index.ts, packages/jobs/package.json, packages/jobs/tsconfig.json, packages/jobs/src/connection.ts, packages/jobs/src/types.ts, packages/jobs/src/queues/bulk-import.ts, packages/jobs/src/queues/yearly-status-reset.ts, packages/jobs/src/queues/email-notification-digest.ts, packages/jobs/src/queues/index.ts, packages/jobs/src/workers/bulk-import.worker.ts, packages/jobs/src/workers/yearly-status-reset.worker.ts, packages/jobs/src/workers/email-notification-digest.worker.ts, packages/jobs/src/workers/index.ts, packages/jobs/src/index.ts, packages/storage/package.json, packages/storage/tsconfig.json, packages/storage/src/client.ts, packages/storage/src/validation.ts, packages/storage/src/upload.ts, packages/storage/src/index.ts
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Phase 4 Part 3 (packages/db)
- Agent:               CLAUDE_CODE
- Why:                 Generate full ORM schema with all 15 entities, multi-tenant RLS, seed script, and security layers L2/L5/L6
- Files added:         packages/db/src/index.ts, packages/db/src/client.ts, packages/db/src/audit.ts, packages/db/src/rls.ts, packages/db/src/middleware/tenant-guard.ts, packages/db/prisma/schema.prisma, packages/db/prisma/seed.ts, packages/db/prisma/migrations/00000000000000_init/migration.sql, packages/db/prisma/migrations/00000000000000_init/down.sql, packages/db/prisma/migrations/migration_lock.toml, packages/db/tsconfig.json, packages/db/package.json
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   Prisma schema with 15 entities (Tenant, User, Fisherfolk, Vessel, Violation, EditRequest, Comment, AuditLog, Category, KanbanTask, Notification, AyudaProgram, AyudaBeneficiary, AyudaUpload, IDTemplate) + initial migration with active RLS policies on all 12 tenant-scoped tables
- Errors encountered:  TypeScript rootDir error (prisma/seed.ts outside src/), missing @types/node, seed.ts field mismatches with schema, audit.ts EntityType reference, exactOptionalPropertyTypes incompatibility with Prisma JSON fields
- Errors resolved:     Changed rootDir to ".", added @types/node, rewrote seed.ts to match schema field names, removed EntityType import (used string), used spread pattern for optional JSON fields

## 2026-05-02 — Phase 2.6 Design System (SKIPPED)
- Agent:               CLAUDE_CODE
- Why:                 UI UX Pro Max skill not installed — Phase 2.6 skipped per conditional rule
- Files added:         none
- Files modified:      none
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-02 — Phase 2.7 Spec Stress-Test
- Agent:               CLAUDE_CODE
- Why:                 Automatic spec validation before Phase 3 — 4-category check (completeness, consistency, ambiguity, security)
- Files added:         none
- Files modified:      none
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none
- Result:              PASSED — 0 gaps found. PRODUCT.md is implementation-ready.

## 2026-05-02 — Phase 3 Generate Spec Files
- Agent:               CLAUDE_CODE
- Why:                 Generate all spec files, environment configs, and credential scaffold from confirmed PRODUCT.md
- Files added:         inputs.yml, inputs.schema.json, .env.dev, .env.staging, .env.prod, .env.example, scripts/sync-credentials-to-env.sh
- Files modified:      docs/DECISIONS_LOG.md (8 locked decisions added), docs/CHANGELOG_AI.md (this entry), .cline/STATE.md, .cline/memory/agent-log.md
- Files deleted:       none
- Schema/migrations:   none (Prisma schema generated in Phase 4 Part 3)
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Governance Sync
- Agent:               CLAUDE_CODE
- Why:                 Reconcile governance docs with actual project state after Phase 3 completion
- Files added:         none
- Files modified:      docs/IMPLEMENTATION_MAP.md (rewritten — was stale, showed Phase 0 in progress), docs/CHANGELOG_AI.md (this entry), .cline/memory/agent-log.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     IMPLEMENTATION_MAP.md was stale (showed Bootstrap in progress, all phases Not Started despite Phase 3 being complete). Rewritten to reflect current state.

## 2026-05-03 — Phase 4 Part 1 — Root Config Files
- Agent:               CLAUDE_CODE
- Why:                 Generate all root configuration files for the pnpm monorepo scaffold (Part 1 of 8)
- Files added:         pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .editorconfig, .prettierrc, .eslintrc.js
- Files modified:      package.json (root scripts + devDependencies added), .gitignore (coverage, .vitest, swap files added), .cline/STATE.md (Phase 4 Part 1 complete)
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Phase 4 Part 2 — packages/shared + packages/api-client
- Agent:               CLAUDE_CODE
- Why:                 Generate shared TypeScript types, Zod validation schemas, constants, and typed tRPC api-client (Part 2 of 8)
- Files added:         packages/shared/package.json, packages/shared/tsconfig.json, packages/shared/src/types/enums.ts, packages/shared/src/types/tenant.ts, packages/shared/src/types/user.ts, packages/shared/src/types/fisherfolk.ts, packages/shared/src/types/vessel.ts, packages/shared/src/types/violation.ts, packages/shared/src/types/edit-request.ts, packages/shared/src/types/comment.ts, packages/shared/src/types/audit-log.ts, packages/shared/src/types/category.ts, packages/shared/src/types/kanban-task.ts, packages/shared/src/types/notification.ts, packages/shared/src/types/ayuda.ts, packages/shared/src/types/id-template.ts, packages/shared/src/types/index.ts, packages/shared/src/schemas/enums.ts, packages/shared/src/schemas/tenant.ts, packages/shared/src/schemas/user.ts, packages/shared/src/schemas/fisherfolk.ts, packages/shared/src/schemas/vessel.ts, packages/shared/src/schemas/violation.ts, packages/shared/src/schemas/edit-request.ts, packages/shared/src/schemas/comment.ts, packages/shared/src/schemas/audit-log.ts, packages/shared/src/schemas/category.ts, packages/shared/src/schemas/kanban-task.ts, packages/shared/src/schemas/notification.ts, packages/shared/src/schemas/ayuda.ts, packages/shared/src/schemas/id-template.ts, packages/shared/src/schemas/index.ts, packages/shared/src/constants/index.ts, packages/api-client/package.json, packages/api-client/tsconfig.json, packages/api-client/src/index.ts
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  tRPC v11 TransformerOptions conditional type incompatible with exactOptionalPropertyTypes when calling httpBatchLink inside generic function
- Errors resolved:     Restructured createApiClient to accept pre-built TRPCLink[] array — consumers call httpBatchLink directly outside generic context where TypeScript can resolve the conditional type

## 2026-05-03 — Phase 4 Part 5 — apps/web Next.js + tRPC + Auth.js scaffold
- Agent:               CLAUDE_CODE
- Why:                 Complete Phase 4 Part 5 — generate the Next.js web application with App Router, all 14 tRPC routers, Auth.js v5 Credentials provider, security headers, rate limiter, sanitizer, Dockerfile, and shadcn/ui base. Resumes from session-interrupted Part 5 (TYPE 4 recovery per H3) — apps/web tree was already written in working directory but typecheck had 41 errors and nothing was committed.
- Files added:         63 in apps/web/ — App Router pages for 17 modules (analytics, audit-log, ayuda, dashboard, edit-requests, fisherfolk, id-generator, kanban, map, notifications, reports, settings, user-management, vessels, violations) + platform/tenants superadmin route + login + api/{trpc,auth,health}; src/server/trpc/{context,trpc,root}.ts + 14 routers (auditLog, ayuda, category, comment, dashboard, editRequest, fisherfolk, idTemplate, kanbanTask, notification, tenant, user, vessel, violation); src/server/auth/{config,index}.ts; src/server/lib/{rate-limit,sanitize,prisma-input}.ts; src/middleware.ts; src/components/{header,sidebar}.tsx; src/lib/{utils,trpc/{client,provider}}.tsx; src/env.ts; src/app/{layout,page,globals.css}; next.config.ts (7 security headers + standalone output); Dockerfile + .dockerignore (multi-stage Node 22); tsconfig.json (declaration: false override); tailwind.config.ts; postcss.config.js; components.json (shadcn/ui init).
- Files modified:      14 packages/shared/src/schemas/*.ts (audit-log, ayuda, category, comment, edit-request, enums, fisherfolk, id-template, kanban-task, notification, tenant, user, vessel, violation); packages/shared/src/types/enums.ts — extended with new enums (ViolationTargetType, UserStatus, TenantStatus, AyudaUploadType, CategoryIconType, CategoryStatus, IDTemplateType, IDTemplateStatus, CommentTicketStatus) and 8 new AuditAction values; .eslintrc.js (parserOptions.project: true + tsconfigRootDir + strict-boolean-expressions options); pnpm-lock.yaml.
- Files deleted:       none
- Schema/migrations:   none — schema.prisma unchanged. Shared zod/type extensions are additive.
- Errors encountered:  41 TypeScript errors across 13 router files after resuming Part 5: (a) Prisma router/schema field-name mismatches — kanbanTask used assigneeId/assignee/dueDate/createdById that don't exist on the model (schema has assignedToId/assignedTo only); fisherfolk used lowercase status enum, fisherfolkId field name, gears/licenses relations that don't exist, AuditLog "entity" instead of "entityType"; idTemplate used isActive boolean instead of status enum; comment used entityType/entityId for what is actually fisherfolkId-only relation. (b) exactOptionalPropertyTypes: true Prisma payload incompatibilities — Prisma create/update inputs reject fields with `T | undefined` from optional Zod fields. (c) auth/config.ts where: { id: token.userId } passing unknown to Prisma findUnique. (d) After fixes, 7 TS2742 "inferred type cannot be named" errors fired on tRPC and next-auth re-exports because base tsconfig sets declaration: true.
- Errors resolved:     (a) Rewrote kanbanTask, fisherfolk, idTemplate, comment routers to match the actual Prisma schema field names; corrected AuditLog writes to use entityType. (b) Created src/server/lib/prisma-input.ts with typed omitUndefined<T>(obj) helper that strips keys whose values are undefined and returns WithoutUndefined<T>; applied across category, ayuda, tenant, vessel, violation, fisherfolk, idTemplate, kanbanTask routers. (c) Added `as string` cast then later removed in favour of narrowing token.userId via typeof+length check. (d) Set declaration: false + declarationMap: false in apps/web/tsconfig.json (apps/web is a runtime app, not a published library — declaration emission unnecessary). After fixes pnpm typecheck cleaned to 0 errors. (e) Lint surfaced ~60 strict-boolean-expressions errors on idiomatic null-guards — configured rule with allowNullableObject + allowNullableString. (f) 9 remaining lint errors fixed: unnecessary `as UserRole` assertions removed (context types already accept the value); unnecessary `ctx.userId!` removed (protectedProcedure narrows userId to string via enforceAuth middleware); Promise misuse on form onSubmit + button onClick wrapped with `void` IIFE; `if (user)` widened to `user !== undefined`; redundant `Parameters<...>[0]["data"]` cast on JSON-typed Prisma update data dropped.
