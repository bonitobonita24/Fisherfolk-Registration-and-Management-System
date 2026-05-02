# Phase 4 Part 5 — apps/web (Next.js full scaffold)
TASK: Generate the FRMS Next.js web application (Part 5 of 8).
- Read STATE.md first. Confirm Part 4 complete.
- Read inputs.yml + PRODUCT.md (modules, roles, workflows).
- Read DECISIONS_LOG.md. Read .cline/memory/lessons.md.
- Create scaffold/part-5 branch.
- FIRST: run npx shadcn@latest init + install base components.
- Generate: src/app/ (App Router), src/server/trpc/, src/server/auth/, src/middleware.ts,
  src/components/, next.config.ts (with security headers), src/server/lib/rate-limit.ts,
  src/server/lib/sanitize.ts, Dockerfile, .dockerignore.
- Run: pnpm lint + pnpm typecheck. Fix all errors.
- Rewrite STATE.md. Commit. Squash-merge. Delete branch.
- Output: "✅ Part 5 complete. Open phase4-part6.md in a NEW Claude Code session."
STOP HERE.
