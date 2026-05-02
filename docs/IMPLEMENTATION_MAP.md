# Implementation Map — FRMS
# Current build state. Rewritten after every feature update.
# Shows what is built, what is pending, and what changed last.

---

## Phase Status

| Phase | Status | Last Updated |
|-------|--------|--------------|
| Phase 0 — Bootstrap | In Progress | 2026-05-02 |
| Phase 1 — Dev Environment | Not Started | — |
| Phase 2 — Discovery Interview | Not Started | — |
| Phase 3 — Generate Spec Files | Not Started | — |
| Phase 4 — Full Scaffold | Not Started | — |
| Phase 5 — Validation | Not Started | — |
| Phase 6 — Docker + Visual QA | Not Started | — |
| Phase 7 — Feature Updates | Not Started | — |
| Phase 8 — Iterative Buildout | Not Started | — |

## Apps

| App | Framework | Status |
|-----|-----------|--------|
| web | Next.js (App Router) | Not scaffolded |

## Packages

| Package | Status |
|---------|--------|
| packages/shared | Not scaffolded |
| packages/api-client | Not scaffolded |
| packages/db | Not scaffolded |
| packages/ui | Not scaffolded |
| packages/jobs | Not scaffolded |
| packages/storage | Not scaffolded |

## Infrastructure

| Service | Status |
|---------|--------|
| PostgreSQL + PgBouncer | Not configured |
| Valkey (cache + jobs) | Not configured |
| MinIO (file storage) | Not configured |
| MailHog (dev email) | Not configured |
| pgAdmin | Not configured |

## Governance Docs

| Document | Status |
|----------|--------|
| PRODUCT.md | Pre-existing (complete) |
| DESIGN.md | Pre-existing (complete) |
| CHANGELOG_AI.md | Created (Bootstrap) |
| DECISIONS_LOG.md | Created (Bootstrap) |
| IMPLEMENTATION_MAP.md | Created (Bootstrap) |
| inputs.yml | Not generated |
| inputs.schema.json | Not generated |
| CREDENTIALS.md | Not generated |
| lessons.md | Created (Bootstrap) |
| agent-log.md | Created (Bootstrap) |
| project.memory.md | Created (Bootstrap) |
| STATE.md | Not created |
