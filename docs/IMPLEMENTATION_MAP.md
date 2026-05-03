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
| Phase 4 — Full Scaffold | ⏳ In Progress (Part 1 of 8 complete) | 2026-05-03 |
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

## Apps

| App | Framework | Status |
|-----|-----------|--------|
| web | Next.js (App Router) | Not scaffolded (Phase 4 Part 5) |

## Packages

| Package | Status |
|---------|--------|
| packages/shared | Not scaffolded (Phase 4 Part 2) |
| packages/api-client | Not scaffolded (Phase 4 Part 2) |
| packages/db | Not scaffolded (Phase 4 Part 3) |
| packages/ui | Not scaffolded (Phase 4 Part 4) |
| packages/jobs | Not scaffolded (Phase 4 Part 4) |
| packages/storage | Not scaffolded (Phase 4 Part 4) |

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
| CHANGELOG_AI.md | ✅ Active (5 entries) |
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
