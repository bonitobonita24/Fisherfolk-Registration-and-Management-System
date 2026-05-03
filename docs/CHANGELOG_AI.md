# Changelog AI — FRMS
# Agent-attributed change log. Every entry states which agent made the change.
# Format: ## YYYY-MM-DD — [Phase or Feature Name]
# Attribution: CLINE | CLAUDE_CODE | COPILOT | HUMAN | UNKNOWN

---

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
