# Phase 4 Part 7 — tools/ + deploy/compose/ + SocratiCode artifacts
TASK: Generate tooling, Docker Compose configs, and SocratiCode artifacts (Part 7 of 8).
- Read STATE.md first. Confirm Part 5 or Part 6 complete.
- Read inputs.yml (ports, docker, infra sections).
- Create scaffold/part-7 branch.
- Generate: tools/ (validate-inputs.mjs, check-env.mjs, check-product-sync.mjs, hydration-lint.mjs),
  deploy/compose/dev|stage|prod/ (all compose files + start.sh + push.sh + pgadmin configs),
  COMMANDS.md, .socraticodecontextartifacts.json.
- Run: pnpm typecheck. Fix all errors.
- Rewrite STATE.md. Commit. Squash-merge. Delete branch.
- Output: "✅ Part 7 complete. Open phase4-part8.md in a NEW Claude Code session."
STOP HERE.
