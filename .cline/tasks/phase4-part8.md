# Phase 4 Part 8 — CI + governance docs + MANIFEST.txt + SocratiCode index
TASK: Generate CI workflows, governance docs, and final manifest (Part 8 of 8).
- Read STATE.md first. Confirm Part 7 complete.
- Read ALL 9 governance docs.
- Create scaffold/part-8 branch.
- Generate: .github/workflows/ci.yml, .github/workflows/docker-publish.yml (conditional),
  docs/CHANGELOG_AI.md (full history), docs/IMPLEMENTATION_MAP.md (complete state),
  MANIFEST.txt (every file generated across Parts 1-8).
- Trigger SocratiCode index: codebase_index + codebase_context_index.
- Run: pnpm lint + pnpm typecheck + pnpm build. Fix all errors.
- Rewrite STATE.md. Commit. Squash-merge. Delete branch.
- Output: "✅ Part 8 complete. Say 'Start Phase 5' in a NEW Claude Code session."
STOP HERE. Human manually triggers Phase 5.
