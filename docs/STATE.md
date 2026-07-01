# FRMS — Project State

## Current State (2026-07-01)

Branch `swarm/registration-status-timeline` is the active feature branch for the registration-status timeline work.

### Completed this session (S0)

- **Prisma schema** — `RegistrationRenewal` model added; `Fisherfolk` extended with `idReleasedAt`/`idReleasedById`/`idReleasedBy`/`renewals`; inverse relations wired on `User` and `Tenant`.
- **Migration** — `20260701000000_registration_renewal_and_id_released` (additive: CREATE TABLE + 2 ADD COLUMN).
- **Prisma client** regenerated (v6.19.3).
- **Typecheck** passes (0 errors).

### Completed this session (SD — docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 entry with 5 locked sub-decisions (a–e): ID-release manual staff action, NEW/RENEWED badge derivation from `_count.renewals`, renew mutation rules (encoder role + active-violation block + AuditAction.RENEW), new entities (RegistrationRenewal + Fisherfolk.idReleasedAt/idReleasedById), activity timeline sanitization policy (action/actor/timestamp only, no diffs, protectedProcedure).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added NEW/RENEWED badge row to Batch 1b list table; added 4 pending (⏳ S1+) rows to Batch 3 profile table for renew mutation, markIdReleased mutation, renewal timeline panel, and right-side activity timeline.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Open / pending (not in S0/SD scope)

- S1+: tRPC mutation `fisherfolk.renew` (encoder, active-violation block, RegistrationRenewal row, status→RENEWED, AuditAction.RENEW)
- S1+: tRPC mutation `fisherfolk.markIdReleased` (encoder+admin, sets idReleasedAt/idReleasedById, AuditAction.ID_RELEASED)
- S1+: `fisherfolk.getById` include for `renewals` (ordered renewalYear desc) and `idReleasedBy` (name)
- S1+: UI — profile renewal timeline panel + "Mark as Released" action button
- S1+: UI — right-side activity timeline (sanitized AuditLog feed: action/actor/timestamp)
- S1+: UI — NEW/RENEWED badge on fisherfolk list columns (derived from `_count.renewals`)
- Zod schemas (`fisherfolkUpdateSchema`) need `idReleasedAt`/`idReleasedById` guard when mutation is wired
- Performance indexes (deferred from S0 code review): `@@index([tenantId, renewalYear])` on RegistrationRenewal; index on `fisherfolk(id_released_by_id)`

### Main branch state

`main` is clean at `08f9054` (back-port candidates A–I). All prior PRs (#1–#9) merged.

### Deployment gate

HARD HOLD — no staging/production deploy until owner explicitly authorizes.
