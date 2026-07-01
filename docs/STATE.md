# FRMS — Project State

## Current State (2026-07-01)

Branch `swarm/registration-status-timeline` is the active feature branch for the registration-status timeline work.

### Completed this session (S0)

- **Prisma schema** — `RegistrationRenewal` model added; `Fisherfolk` extended with `idReleasedAt`/`idReleasedById`/`idReleasedBy`/`renewals`; inverse relations wired on `User` and `Tenant`.
- **Migration** — `20260701000000_registration_renewal_and_id_released` (additive: CREATE TABLE + 2 ADD COLUMN).
- **Prisma client** regenerated (v6.19.3).
- **Typecheck** passes (0 errors).

### Open / pending (not in S0 scope)

- S1+: TRPC router for `registrationRenewal` (create, list) and `fisherfolk.releaseId` mutation
- S1+: UI for renewal action and ID-release action on the fisherfolk detail page
- S1+: `getById` router include for `renewals` and `idReleasedBy`
- Zod schemas (`fisherfolkUpdateSchema`) need `idReleasedAt`/`idReleasedById` fields when that mutation is wired
- Performance indexes deferred from code review: `@@index([tenantId, renewalYear])` on RegistrationRenewal, index on `fisherfolk(id_released_by_id)`

### Main branch state

`main` is clean at `08f9054` (back-port candidates A–I). All prior PRs (#1–#9) merged.

### Deployment gate

HARD HOLD — no staging/production deploy until owner explicitly authorizes.
