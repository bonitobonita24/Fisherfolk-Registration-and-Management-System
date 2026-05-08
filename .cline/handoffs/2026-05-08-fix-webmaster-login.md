# Handoff — Fix Webmaster Login Auth
# Date: 2026-05-08
# Branch: fix/webmaster-login-auth
# Status: FIX COMPLETE — governance docs updated, WIP committed, not merged

---

## What Was Done

Fixed webmaster login returning "invalid credentials" after Phase 6 completion.
Root cause was a 3-layer failure: Docker container networking, L6 tenant guard blocking auth queries, and TypeScript build errors.

### Errors Fixed (4 in this session)

1. **L6 tenant guard blocks auth queries** — `authorize()` in Auth.js runs before any tenant context exists. `prisma.user.findFirst()` hit the tenant guard and threw "Tenant context not set". Fix: created `platformPrisma` (unguarded PrismaClient) for auth and platform-level queries.

2. **Docker container networking** — `.env.dev` has `DATABASE_URL` pointing to `localhost:44377` which works from the host but not inside the app container. Fix: added `DATABASE_URL` and `REDIS_URL` environment overrides in `docker-compose.app.yml` using Docker internal hostnames (`frms_dev_postgres:5432`).

3. **Variable name mismatch** — Prior edit renamed `basePrismaConfig` to `basePrismaLog` but didn't update the two function references. Fix: changed both `new PrismaClient(basePrismaConfig)` to `new PrismaClient({ log: basePrismaLog })`.

4. **ESLint unnecessary type assertion** — `token.userId as string` on line 108 was redundant after `typeof` check on line 106. Fix: removed the `as string` assertion.

### Files Modified

- `packages/db/src/client.ts` — added `platformPrisma` export + fixed `basePrismaLog` reference
- `packages/db/src/index.ts` — added `platformPrisma` to barrel export
- `apps/web/src/server/auth/config.ts` — switched auth queries to `platformPrisma`, removed unnecessary type assertion
- `deploy/compose/dev/docker-compose.app.yml` — added DATABASE_URL and REDIS_URL overrides with Docker internal hostnames

### Verification

Login verified working via curl CSRF flow: 302 redirect to app root (not error page).
Session endpoint returns correct user data: webmaster, super_admin, tenantId, securityVersion=1.

---

## Resume Instructions

1. `git checkout fix/webmaster-login-auth`
2. Review changes: `git diff main`
3. If satisfied: squash-merge to main and delete the branch
4. If not: continue fixing on this branch

## Pending (for next session)

- Squash-merge `fix/webmaster-login-auth` to main
- Delete the branch after merge
- Continue with Phase 7 Feature Updates or Phase 8 Iterative Buildout
