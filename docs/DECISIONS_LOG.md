# Decisions Log — FRMS
# Locked decisions. Never re-ask anything listed here.
# Format: ## Decision Title → Decision / Rationale / Locked: yes

---

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
