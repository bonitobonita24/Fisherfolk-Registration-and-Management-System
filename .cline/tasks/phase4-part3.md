# Phase 4 Part 3 — packages/db
TASK: Generate full ORM schema with all entities (Part 3 of 8).
- Read STATE.md first. Read inputs.yml + PRODUCT.md (Core Entities section).
- Read DECISIONS_LOG.md (tenancy mode, security layers).
- Create scaffold/part-3 branch.
- Generate: Prisma schema, migrations (up+down), seed script, AuditLog, tenant-guard middleware, RLS helpers (if multi-tenant).
- Seed script MUST include the first admin account (MANDATORY):
    username: webmaster
    password: read from CREDENTIALS.md "First Admin Account" section.
    role: super_admin
    email: webmaster@frms.local
  bcrypt hash the plaintext value before writing to seed script.
- Run: pnpm db:generate + pnpm typecheck. Fix all errors.
- Rewrite STATE.md. Commit. Squash-merge. Delete branch.
- Output: "✅ Part 3 complete. Open phase4-part4.md in a NEW Claude Code session."
STOP HERE.
