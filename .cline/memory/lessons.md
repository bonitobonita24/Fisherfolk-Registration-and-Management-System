# Lessons Memory — Spec-Driven Platform V31
# Entry format: ## YYYY-MM-DD — [ICON] [Title]
# Types: 🔴 gotcha | 🟡 fix | 🟤 decision | ⚖️ trade-off | 🟢 change
# READ ORDER: 🔴 first → 🟤 second → rest by relevance
# ---

## BOOTSTRAP — 🔴 WSL2 + Docker Desktop known pitfalls
- Type:      🔴 gotcha
- Phase:     Phase 0 Bootstrap / Phase 1 dev environment open
- Files:     .env.dev, docker-compose.*.yml, .nvmrc
- Concepts:  wsl2, docker-desktop, pnpm, nvm, permissions
- Narrative: Real failures on WSL2 + Docker Desktop. All fixes baked into Bootstrap template.
  (1) Never use corepack enable — use npm install -g pnpm. corepack symlinks fail in some WSL2 setups.
  (2) pnpm install must run from WSL2 terminal — not Windows PowerShell or CMD.
  (3) Docker Desktop must be running before any docker compose command. Check with: docker ps.
  (4) Port conflicts: dev services use non-standard random ports (Rule 22). If conflict occurs,
      regenerate ports in inputs.yml → run Phase 7 → restart services.
  (5) nvm must be sourced in .bashrc — add: [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  (6) WSL2 file permissions: always develop inside WSL2 filesystem (/home/user/) not /mnt/c/.
      Working in /mnt/c/ causes severe pnpm and docker performance issues.
# ---

## 2026-05-03 — 🔴 tRPC v11 TransformerOptions + exactOptionalPropertyTypes incompatibility
- Type:      🔴 gotcha
- Phase:     Phase 4 Part 2 — packages/api-client
- Files:     packages/api-client/src/index.ts
- Concepts:  trpc, v11, TransformerOptions, exactOptionalPropertyTypes, conditional-types, generics
- Narrative: When `exactOptionalPropertyTypes: true` is set in tsconfig.base.json, calling
  `httpBatchLink({ url })` inside a generic function `createApiClient<TRouter extends AnyRouter>()`
  fails because `TransformerOptions<TRoot>` is a conditional type (`TRoot['transformer'] extends true ? ... : ...`).
  TypeScript cannot resolve which branch the conditional takes when `TRouter` is still generic,
  making it impossible to construct a compatible object literal. Five attempts were needed.
  FIX: Do NOT call httpBatchLink inside the generic function. Instead, accept a pre-built
  `links: TRPCLink<TRouter>[]` array. Consumers call `httpBatchLink({ url })` directly outside
  the generic context where TypeScript can resolve the conditional type. Re-export httpBatchLink
  for consumer convenience.
# ---
