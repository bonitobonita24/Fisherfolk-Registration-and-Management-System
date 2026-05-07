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
