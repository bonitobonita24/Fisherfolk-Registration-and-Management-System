# Lessons Memory — Spec-Driven Platform V31
# Entry format: ## YYYY-MM-DD — [ICON] [Title]
# Types: 🔴 gotcha | 🟡 fix | 🟤 decision | ⚖️ trade-off | 🟢 change
# READ ORDER: 🔴 first → 🟤 second → rest by relevance
# ---

## 2026-07-01 — 🔴 Prisma nullable-relation select: always optional-chain the result even on non-nullable FK
- Type:      🔴 gotcha
- Phase:     Phase 4 S1/S5 — tRPC backend + QA gate
- Files:     apps/web/src/server/trpc/routers/fisherfolk.ts (getActivity mapper)
- Concepts:  prisma, nullable-relation, null-deref, optional-chain, audit-log, getActivity
- Narrative: AuditLog.userId is non-nullable in the Prisma schema and the FK is RESTRICT (user can't be deleted if audit logs exist). Despite this, `log.user.name` is risky: direct SQL operations or future cascade-delete changes could leave user null at runtime. Prisma returns null for unresolvable relations even when the schema declares non-nullable. Pattern: always optional-chain relation selects: `log.user?.name ?? log.user?.email ?? null`. Caught by code review in S5. Fix: one-liner optional-chain, tsc+build stay green.

## 2026-07-01 — 🟡 Invalidate all query keys that display mutation side-effects — not just the primary entity
- Type:      🟡 fix
- Phase:     Phase 4 S3/S5 — profile UI + QA gate
- Files:     apps/web/src/app/[tenant]/fisherfolk/[id]/fisherfolk-detail-client.tsx
- Concepts:  tanstack-query, invalidation, stale-cache, mutation-side-effect, timeline, trpc
- Narrative: After a renew/markIdReleased mutation, only `getById` was invalidated. The activity timeline uses a separate `getActivity` query with a 60-second staleTime — so the sidebar stayed stale after the action, making it look like the audit log entry was not written. Fix: invalidate BOTH `getById` AND `getActivity` in each mutation handler. General rule: when a mutation writes to multiple query surfaces (entity + audit log, entity + timeline, entity + list), invalidate ALL of them. Omitting one stales a sibling view.

## 2026-05-08 — 🔴 jq is not installed on this WSL2 system — use node or python3 in hooks
- Type:      🔴 gotcha
- Phase:     Hooks installation / governance tooling
- Files:     .claude/settings.json hook commands; future shell tooling
- Concepts:  jq, wsl2, hooks, json-parsing, node, python3, settings.json
- Narrative: The framework's CLAUDE.md examples (and the update-config skill's example hooks) all assume `jq` is available for parsing JSON in hook command strings. On this WSL2 dev env, `which jq` returns "jq not found". Initial anti-thrashing hook command was built around `jq -r '.prompt'` — pipe-test failed silently (exit 127, command not found). Fix: switched the hook to `node -e '...'` (node 22.20.0 is already a project dependency via .nvmrc, always available). Python3 is also available as a fallback. NEVER write a hook command that depends on jq for this project unless `apt install jq` is added to the dev setup checklist. Standard pattern for hooks in this project: `node -e 'let i="";process.stdin.on("data",c=>i+=c);process.stdin.on("end",()=>{const x=JSON.parse(i);...})'`. Same applies to any future formatter/linter hook examples copied from external docs.
# ---

## 2026-05-08 — 🟤 Anti-thrashing enforcement: UserPromptSubmit hook (mechanical) over rule alone (advisory)
- Type:      🟤 decision
- Phase:     Hooks installation / governance tooling
- Files:     .claude/settings.json
- Concepts:  hooks, anti-thrashing, scope-assessment, UserPromptSubmit, mechanical-enforcement, governance
- Narrative: The locked anti-thrashing rule (this lessons.md 2026-05-08 🟤 — "per-task token estimates required") was discoverable via memory and CLAUDE.md but not auto-injected on phase/batch triggers. Worked when the user manually pasted the scope-assessment preamble at session start but was easy to forget — a single missed paste = thrashing risk on the next batch. Decision: enforce via UserPromptSubmit hook in .claude/settings.json that auto-prepends the preamble whenever the prompt contains "Start Phase" | "Continue Phase" | "Feature Update" | "Batch" | "Resume Session" | "Resume from handoff" (case-insensitive). Single inline node -e command, preamble base64-encoded inside the JS to sidestep two-layer quote escaping (JSON string → shell single-quoted arg). 5-second timeout. Logged as locked decision in DECISIONS_LOG.md.
  How to apply: any future "auto-inject context on prompt match" pattern in this project follows this template — node -e single-liner, base64-encoded payload inside the JS, regex test against prompt field, output `{hookSpecificOutput: {hookEventName, additionalContext}}` JSON via process.stdout.write. Do NOT use jq (not installed). Do NOT use a separate script file unless the payload exceeds ~3K chars (then maintenance gets awkward inline). Activation gotcha: settings watcher only watches .claude/ if a settings file existed at session start — first-time hook install requires /hooks reload or restart to fire in current session; fresh sessions auto-activate.
# ---

## 2026-05-08 — 🟤 TDD (Rule 25) deferred until dedicated test-infra batch
- Type:      🟤 decision
- Phase:     Phase 8 Batch 2a — registration form
- Files:     n/a (project-wide gap)
- Concepts:  tdd, vitest, jest, rule-25, test-infrastructure, batch-atomicity
- Narrative: Rule 25 requires writing a failing test before any implementation, with no exceptions. The project's package.json defines `test: turbo run test` but NO package has a test script, NO test runner is configured (no vitest, no jest, no jest.config or vitest.config files anywhere), and zero `*.test.*` or `*.spec.*` files exist in the repo. Applying Rule 25 to Batch 2a would require first building the entire test infra — that is its own batch (`Phase 8 Batch X — test infra setup`), not a sub-task of feature work.
  Decision: continue feature batches without TDD until a dedicated test-infra batch lands. Each post-infra feature batch resumes Rule 25 strictly. The TDD gap is a project-wide debt, not a per-batch regression — same framing as the 🟤 batch atomicity decision below.
  How to apply: when a new feature batch starts, check if vitest/jest config + at least one passing example test exists. If yes → enforce Rule 25. If no → declare the exception in the two-stage review output and proceed; track the missing infra as an outstanding follow-up. Do NOT silently violate Rule 25 — every batch that skips TDD must explicitly call it out in commit message + governance docs.
# ---

## 2026-05-08 — 🟤 encoderProcedure for tRPC role gating: super_admin + admin + encoder
- Type:      🟤 decision
- Phase:     Phase 8 Batch 2a — registration form
- Files:     apps/web/src/server/trpc/trpc.ts
- Concepts:  trpc, rbac, encoderProcedure, role-gating, fisherfolk, vessel, registration
- Narrative: PRODUCT.md Roles + Permissions table grants Encoders "Register new fisherfolk and vessels" — meaning encoder must be allowed on `fisherfolk.create` and (eventually) `vessel.create`. Existing `adminProcedure` only permits super_admin + admin, which produced a spec-vs-code gap that would silently 403 every Encoder submission. Added `encoderProcedure = protectedProcedure.use(requireRole("super_admin", "admin", "encoder"))` next to adminProcedure in trpc.ts.
  How to apply: any future tRPC mutation that PRODUCT.md grants to Encoder (register, renew, generate IDs from approved templates, post comments, manage own Kanban) MUST use encoderProcedure, NOT adminProcedure. Page-level role gating still applies to UI access — the procedure guard is defence-in-depth.
# ---

## 2026-05-08 — 🟤 Phase 8 batch atomicity: pre-existing errors do not block new batches but block branch merge
- Type:      🟤 decision
- Phase:     Phase 8 Iterative Buildout — Batch 1b commit
- Files:     apps/web/src/components/ui/{dropdown-menu,sonner,form,toaster}.tsx, apps/web/src/hooks/use-toast.ts, apps/web/src/components/shared/confirm-dialog.tsx
- Concepts:  phase-8, atomicity, anti-thrashing, output-contract, squash-merge, scope-discipline
- Narrative: Batch 1a (commit 28ad99e) was committed with 9 lint errors + 3 typecheck errors in shadcn-installed files (dropdown-menu, sonner, form, toaster, use-toast, confirm-dialog). These violate the Phase 4/8 OUTPUT CONTRACT (0 lint/typecheck before merge) but were not caught at the time of that batch's commit. When Batch 1b started, the choice was: (A) fold the Batch 1a fixes into Batch 1b's commit, or (B) commit Batch 1b cleanly and track the Batch 1a errors as a separate follow-up.
  Decision: B. Reasons: (1) atomic commits per batch — Batch 1b's commit message and diff should reflect ONLY Batch 1b work; (2) anti-thrashing — folding two batches into one session inflates context and obscures the diff; (3) the pre-existing errors are a Batch 1a debt, not a Batch 1b regression — verified by checking that none of the failing files are in the Batch 1b WIP set. Constraint: feat/shared-ui-components CANNOT squash-merge to main until those 6 files are fixed (recorded as Task #5 + STATE.md "Outstanding follow-ups"). Future Phase 8 batches on the same branch can proceed; merge is gated on debt resolution.
  How to apply: When discovering pre-existing lint/typecheck errors mid-batch, do NOT silently absorb them into the current commit. Verify they are pre-existing (git log on the affected files), record them as a follow-up task with concrete file list, document in STATE.md "Outstanding follow-ups", and proceed with the current batch's clean scope. The branch may accumulate debt across batches but every commit must be atomic to its declared scope.
# ---

## 2026-05-08 — 🟤 Anti-thrashing: per-task token estimates required before starting Phase 8 work
- Type:      🟤 decision
- Phase:     Phase 8 Iterative Buildout — session handoff
- Files:     n/a (process)
- Concepts:  anti-thrashing, claude-sonnet-4-6, context-budget, scope-assessment, batch-split, opus-vs-sonnet
- Narrative: User explicitly requires concrete token estimates for each upcoming task before deciding whether to split. Pattern locked in this session: itemize CLAUDE.md+rules (~5K), STATE.md (~1K), lessons.md gotchas (~2-3K), PRODUCT.md relevant section ONLY (~3-5K), schema/router files needed (~2-3K each), output (~2-5K per file written), reasoning overhead (~10-15K). Sum and compare to 80K SAFE zone. If >70K, default to split.
  Concrete handoff at end of this session: Batch 1a fixes ≈ 31-36K (SAFE single session), Batch 2 Registration Form ≈ 52-72K (EDGE — read fisherfolkCreateSchema and PRODUCT.md fisherfolk subsection FIRST, then re-estimate before writing code).
  How to apply: Before any Phase 8 batch starts, output a token table broken down by category. If the table sum approaches 70K, propose a split immediately — do not start writing code "to see how far we get". Sonnet 4.6 has the same 200K window as Opus 4.7 but the SAFE zone is ≤80K input regardless of model. Cost of unnecessary split = one extra session boundary. Cost of underestimated single session = thrashing, partial code, broken state — orders of magnitude worse.
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

## 2026-05-03 — 🔴 Mid-Part interruption: Prisma router code drifts from Prisma schema
- Type:      🔴 gotcha
- Phase:     Phase 4 Part 5 — apps/web tRPC routers
- Files:     apps/web/src/server/trpc/routers/*.ts (kanbanTask, fisherfolk, idTemplate, comment)
- Concepts:  prisma, exactOptionalPropertyTypes, type-mismatch, partial-recovery, schema-drift, typecheck
- Narrative: When a Phase 4 Part scaffold session is interrupted (autocompact / timeout / closed window), the in-progress code in apps/[app]/ may have field-name and enum-value mismatches with the Prisma schema in packages/db. The agent that originally wrote the routers was working from memory or an earlier draft, and never got to run typecheck before the interruption. On recovery: ALWAYS run pnpm typecheck on the in-progress app directory FIRST and use the actual Prisma schema (not the zod schemas) as the ground truth for field names and enum values. Real failures found: KanbanTask used assigneeId/assignee/dueDate/createdById/REVIEW (Prisma has assignedToId/assignedTo only, no dueDate, no createdBy relation, only TODO|IN_PROGRESS|DONE statuses); Fisherfolk used lowercase status values + nonexistent gears/licenses relations + AuditLog.entity (correct: entityType); IDTemplate used isActive boolean (correct: status: IDTemplateStatus enum); Comment used entityType+entityId for what is fisherfolkId-only. Always cross-check against packages/db/prisma/schema.prisma during recovery, and grep `fullName` usages on User selects (User has `name`; Fisherfolk has `fullName`).
# ---

## 2026-05-03 — 🟡 omitUndefined<T> helper for exactOptionalPropertyTypes + Prisma payloads
- Type:      🟡 fix
- Phase:     Phase 4 Part 5 — apps/web tRPC routers
- Files:     apps/web/src/server/lib/prisma-input.ts; 9 routers using create/update payloads
- Concepts:  exactOptionalPropertyTypes, prisma, typescript, zod, optional, undefined, util
- Narrative: With `exactOptionalPropertyTypes: true` (set in tsconfig.base.json), Prisma's create/update input types reject objects with `field: undefined` because the input shape uses optional `field?:` (allow missing) and not `field?: T | undefined`. Zod `.optional()` produces `T | undefined` after parse, so spreading parsed Zod objects into Prisma calls fails typecheck. Solution: a typed runtime helper `omitUndefined<T extends Record<string, unknown>>(obj: T): WithoutUndefined<T>` that filters undefined values and casts the result type to drop `| undefined` from each property. Applied in apps/web/src/server/lib/prisma-input.ts and used in category, ayuda, tenant, vessel, violation, fisherfolk, idTemplate, kanbanTask routers. Pattern: `data: omitUndefined({ ...input, tenantId: ctx.tenantId })`. Do NOT cast Prisma input types with `as` — that hides real bugs.
# ---

## 2026-05-03 — 🟤 declaration: false in app-level tsconfig (apps/[app] are runtime apps)
- Type:      🟤 decision
- Phase:     Phase 4 Part 5 onwards — every apps/[app]/tsconfig.json
- Files:     apps/web/tsconfig.json; future apps/[mobile]/tsconfig.json (Part 6 if mobile)
- Concepts:  typescript, declaration, isolatedModules, ts2742, monorepo, packages-vs-apps
- Narrative: The base tsconfig.base.json sets `declaration: true` because shared packages (packages/shared, packages/db, packages/api-client, packages/ui, packages/jobs, packages/storage) need to emit .d.ts so other packages can typecheck against them. But runtime apps in apps/* are leaf consumers — they never publish .d.ts, and their tsconfig already has `noEmit: true`. With declaration: true inherited, TS still validates declaration portability and fires TS2742 "inferred type cannot be named without a reference to ..." on tRPC and next-auth library re-exports. The fix is to override at the app level: `"declaration": false, "declarationMap": false` in apps/[app]/tsconfig.json. Apply this to every new app added (web, mobile, admin, etc.). Do NOT change tsconfig.base.json — packages still need declarations.
# ---

## 2026-05-03 — 🟤 ESLint type-aware config: parserOptions.project + strict-boolean-expressions options
- Type:      🟤 decision
- Phase:     Phase 4 Part 5 onwards — root .eslintrc.js
- Files:     /.eslintrc.js
- Concepts:  eslint, typescript-eslint, type-aware-rules, strict-boolean-expressions, lint
- Narrative: To make `@typescript-eslint/strict-boolean-expressions` and `no-unsafe-assignment` work across the monorepo, the root .eslintrc.js sets `parserOptions: { project: true, tsconfigRootDir: __dirname }` (typescript-eslint v8 auto-discovery — finds the right tsconfig per file). The default strict-boolean-expressions rule is too strict for idiomatic tRPC code (`if (!ctx.tenantId)`, `...(value && { value })` — fires on every nullable string check). Configure with `{ allowString: true, allowNullableObject: true, allowNullableString: true }` to permit these patterns. Don't disable the rule entirely — it still catches genuine bugs on numbers and any-typed conditions. Also: `ctx.userId!` post-`enforceAuth` middleware is unnecessary because enforceAuth narrows ctx.userId from `string | null` to `string` via the explicit return shape — the lint rule no-unnecessary-type-assertion correctly flags these.
# ---

## 2026-05-07 — 🔴 .js extensions in relative barrel imports break Next.js webpack under bundler resolution
- Type:      🔴 gotcha
- Phase:     Phase 4 Part 8 (build verification)
- Files:     packages/{shared,db,jobs,storage}/src/**/*.ts (32 files)
- Concepts:  typescript, nodenext, bundler-resolution, webpack, barrel-exports, transpilePackages
- Narrative: Barrel files in packages/{shared,db,jobs,storage} were authored with NodeNext-style `.js` extensions on relative imports (e.g. `export * from "./enums.js"`). tsconfig.base.json uses `moduleResolution: "bundler"`, which TOLERATES `.js` extensions but does not require them. tsc passed because bundler resolution accepts both forms. Next.js webpack — invoked via `transpilePackages: ["@frms/shared", "@frms/db", "@frms/ui"]` — consumed the source `.ts` files but tried to resolve `./enums.js` literally, found no such file, and emitted "Module not found". Fix: strip `.js` extensions across all relative barrel imports. Single sed pass: `sed -i -E 's|(from "\.\.?/[^"]+)\.js"|\1"|g'`. Standard for any monorepo using bundler resolution + transpilePackages.

## 2026-05-07 — 🟡 isomorphic-dompurify needs serverExternalPackages in Next.js 15
- Type:      🟡 fix
- Phase:     Phase 4 Part 8 (build verification)
- Files:     apps/web/next.config.ts
- Concepts:  nextjs-15, jsdom, isomorphic-dompurify, server-bundling, prisma, bcryptjs
- Narrative: pnpm build compiled successfully but failed at page-data collection with `ENOENT: no such file or directory, open '.next/server/app/api/browser/default-stylesheet.css'`. Root cause: jsdom (transitive dep of isomorphic-dompurify) ships a default stylesheet at a virtual path that webpack tries to bundle. Fix: add `serverExternalPackages: ["isomorphic-dompurify", "@prisma/client", "bcryptjs"]` to next.config.ts. Per Next.js 15 bundling reference: this directive is for native-binding packages (bcrypt), packages with bundling issues (jsdom-based), and ORMs (Prisma) — exactly our three. Loaded via Node.js runtime instead of bundled.

## 2026-05-07 — 🔴 ports.dev.base meta-field causes validate-inputs false duplicate detection
- Type:      🔴 gotcha
- Phase:     Phase 5 validation
- Files:     inputs.yml, tools/validate-inputs.mjs
- Concepts:  inputs-yml, validate-inputs, ports-dev, duplicate-detection, meta-field
- Narrative: inputs.yml had `ports.dev.base: 44377` as a documentation meta-field (the base number ports are derived from) AND `ports.dev.db: 44377` as the actual PostgreSQL port. The validator collects ALL numeric values from `ports.dev` and checks for duplicates. `base` was included in that set, creating a false positive: "Duplicate port values detected — each service must have a unique port." Fix: remove `base:` from `ports.dev` in inputs.yml entirely. The base value is implicit from the db port. Never add meta/documentation fields with numeric values to `ports.dev` — the validator treats every numeric value in that section as a service port assignment.
# ---

## 2026-05-07 — 🟡 check-product-sync required sections use generic V31 template names, not FRMS headers
- Type:      🟡 fix
- Phase:     Phase 5 validation
- Files:     tools/check-product-sync.mjs
- Concepts:  check-product-sync, product-md, required-sections, alternation, frms-specific-headers
- Narrative: The generated `extractRequiredSections()` in check-product-sync.mjs checked for generic V31 interview template header names ("App Name", "Purpose", "Target Users") but FRMS PRODUCT.md uses descriptive project-specific headers ("App Identity", "Problem Statement", "Core User Flows", "Data Entities", "Roles + Permissions"). This caused 6 false "missing section" failures. Fix: update the required array to use pipe-separated alternation strings ("App Identity|App Name") and change the matching logic to `alts.some((alt) => pattern.test(productMd))`. Either the generic template name OR the project-specific name satisfies the check. Apply same alternation approach to all future projects where PRODUCT.md headers deviate from the V31 template.
# ---

## 2026-05-07 — 🟡 useSearchParams requires Suspense boundary in Next.js 15 static prerender
- Type:      🟡 fix
- Phase:     Phase 4 Part 8 (build verification)
- Files:     apps/web/src/app/login/page.tsx
- Concepts:  nextjs-15, suspense, useSearchParams, csr-bailout, static-export
- Narrative: /login uses useSearchParams() to read ?callbackUrl=. Build failed: "useSearchParams() should be wrapped in a suspense boundary at page /login. Read more: missing-suspense-with-csr-bailout". Next.js 15 enforces this for any client component using useSearchParams when the page can be statically prerendered. Fix: split the inner JSX using useSearchParams into its own component (LoginForm), keep the default export as a thin wrapper (LoginPage) returning `<Suspense fallback={null}><LoginForm /></Suspense>`. After fix /login prerenders as static (○) and the rest of the app routes are server-rendered on demand (ƒ). Apply same pattern to any future page using useSearchParams or usePathname at module scope.
# ---

## 2026-05-08 — 🔴 L6 tenant guard blocks auth queries — use platformPrisma
- Type:      🔴 gotcha
- Phase:     Post-Phase 6 (fix webmaster login)
- Files:     packages/db/src/client.ts, packages/db/src/index.ts, apps/web/src/server/auth/config.ts
- Concepts:  auth, tenant-guard, prisma, L6, platformPrisma, authorize, session-callback
- Narrative: Auth.js authorize() runs BEFORE any tenant context exists — it IS the login flow. Using the guarded `prisma` client (which has the L6 tenantGuardExtension via $allOperations) causes "Tenant context not set for User.findFirst". The error surfaces as a generic Auth.js `?error=Configuration` redirect with no useful message in browser DevTools. Fix: create `platformPrisma` — a second PrismaClient WITHOUT the tenant extension — and use it exclusively for auth queries and platform-level operations. This follows the pattern in `.claude/rules/security.md`: "Superadmin queries that bypass tenant scoping MUST use a dedicated Prisma client instance WITHOUT the L6 tenant-guard extension." NEVER use guarded `prisma` for authorize(), session callbacks, or any query that runs before tenant context is established.
# ---

## 2026-05-08 — 🔴 Docker container DATABASE_URL must use internal hostname not localhost
- Type:      🔴 gotcha
- Phase:     Post-Phase 6 (fix webmaster login)
- Files:     deploy/compose/dev/docker-compose.app.yml
- Concepts:  docker, networking, localhost, container-hostname, DATABASE_URL, REDIS_URL
- Narrative: `.env.dev` sets DATABASE_URL with `localhost:44377` — correct when running the app from the host (WSL2 terminal via `pnpm dev`) but WRONG inside a Docker container. Inside the container, `localhost` refers to the container itself, not the host or other containers. Fix: override DATABASE_URL and REDIS_URL in docker-compose.app.yml environment section using Docker internal hostnames (e.g. `frms_dev_postgres:5432` and `frms_dev_valkey:6379`). The internal hostname is the container_name from docker-compose.db.yml / docker-compose.cache.yml. Port is the CONTAINER port (5432/6379), not the host-mapped port (44377/44379). This override is needed for ALL backing services the app connects to when running inside Docker.
# ---

## 2026-05-08 — 🟡 Variable rename must update all references
- Type:      🟡 fix
- Phase:     Post-Phase 6 (fix webmaster login)
- Files:     packages/db/src/client.ts
- Concepts:  typescript, refactor, variable-rename, basePrismaConfig, basePrismaLog
- Narrative: A prior edit renamed `basePrismaConfig` to `basePrismaLog` (changing from a config object to just the log array) but did not update the two function bodies that referenced `basePrismaConfig`. Both `createPrismaClient()` and `createPlatformPrismaClient()` still passed the old variable name. Fix: changed `new PrismaClient(basePrismaConfig)` to `new PrismaClient({ log: basePrismaLog })` in both functions. Lesson: when renaming a variable, always search for ALL references in the same file — TypeScript would catch this at build time but it's better to fix during the same edit.

## 2026-05-08 — 🟡 strict-boolean-expressions: nullable boolean props require explicit === true check
- Type:      🟡 fix
- Phase:     Phase 8 Batch 1 — TypeScript strict fixes
- Files:     apps/web/src/components/ui/dropdown-menu.tsx
- Concepts:  typescript-strict, eslint, strict-boolean-expressions, nullable-boolean, shadcn
- Narrative: shadcn/ui dropdown-menu uses `inset?: boolean`. With strict-boolean-expressions enabled, `inset ? "pl-8" : undefined` is rejected because `inset` is `boolean | undefined` and the rule requires handling nullish explicitly. Fix: `inset === true ? "pl-8" : undefined`. Apply this pattern to any optional boolean prop used in a conditional expression.

## 2026-05-08 — 🟡 exactOptionalPropertyTypes: indexed optional prop types include undefined — use Exclude<T, undefined>
- Type:      🟡 fix
- Phase:     Phase 8 Batch 1 — TypeScript strict fixes
- Files:     apps/web/src/components/ui/sonner.tsx
- Concepts:  typescript-strict, exactOptionalPropertyTypes, Exclude, indexed-type, sonner
- Narrative: With exactOptionalPropertyTypes: true, accessing an optional prop via indexed type (e.g. `ToasterProps["theme"]`) yields the full union including `undefined`. Passing this to a required prop fails typecheck. Fix: cast with `Exclude<ToasterProps["theme"], undefined>` to strip undefined from the union. Required any time an optional prop's type is accessed via indexing and used where undefined is not acceptable.

## 2026-06-28 — 🔴 tsc --noEmit passes but next build fails — ESLint + a11y only run at build/lint
- Type:      🔴 gotcha
- Phase:     CRUD demo build loop — T4 verify
- Files:     apps/web/src/app/[tenant]/{ayuda/[id]/ayuda-detail-client,kanban/kanban-board-client,violations/[id]/violation-detail-client}.tsx
- Concepts:  eslint, next-build, tsc, strict-boolean-expressions, no-unnecessary-type-assertion, no-img-element, radix-dialog, dialog-title, wcag, a11y, docker-rebuild
- Narrative: Every CRUD task verified `tsc --noEmit` clean and was committed, but the T4 Docker rebuild's `next build` (which runs ESLint) failed with 4 errors tsc never checks: strict-boolean-expressions (always-true object conditional on a required Prisma relation), no-unnecessary-type-assertion ×3 (`as KanbanPriority/Status` on already-typed query fields), and an `eslint-disable @next/next/no-img-element` for a rule NOT loaded in this config → "Definition for rule not found" is itself a HARD build error (the Next ESLint plugin is undetected here, so that rule is inactive — never disable it; raw <img> is unflagged). Separately, runtime QA caught a Radix `DialogContent` rendering with no `DialogTitle` during its loading branch → console a11y error (WCAG, Rule 33 gov/LGU gate); fix = sr-only DialogHeader/Title/Description in the loading state. TAKEAWAY: before any done-claim run `pnpm exec next lint` (or a full Docker build), not just tsc. Also: the dev container is a baked `node server.js` standalone image (no source mounts) — you MUST rebuild + `up -d --force-recreate app` to QA a branch; it does not hot-reload.
