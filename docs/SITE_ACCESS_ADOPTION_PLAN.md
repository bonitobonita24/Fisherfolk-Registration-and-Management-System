# Site Access & Tenancy Bootstrap Standard — Fleet Adoption Plan

> Produced by a 6-lens multi-agent brainstorm + synthesis (2026-08-16). Companion to the locked spec
> `docs/SITE_ACCESS_STANDARD.md`. HARD HOLD throughout — author globally → prove on FRMS → broadcast →
> owner-gated deploy. Secrets live only in the SOPS vault.

## Executive summary
The standard is currently trapped in FRMS-local docs and invisible fleet-wide. It adds two concerns on top
of the existing 3-tier RBAC backbone: (1) a **site/URL topology** — `/tm` platform site, per-tenant one
role-routed login (`/{slug}/admin` admin-tier, `/{slug}/login` regular users), demo as a separate subdomain
with no `/tm`; and (2) a **data-driven platform-role system** — ADMIN(=tenant_manager)/BILLING/TECH seeded,
more creatable in-frontend, via a `scope` discriminator on the existing PD-005 custom-role tables with a
**distinct** platform permission vocabulary.

**Framing recommendations (both reconciled):**
- **A —** Add a NEW constitutional **Rule 41** owning the site-access *topology* (broader than RBAC), and
  **extend Rule 34 / `rbac.md`** in place with the platform-scope RBAC *mechanics*.
- **B —** Author ONE new global **`~/.claude/library/site-access-standard.md`** (own ROUTER row) as the fleet
  canonical, PLUS a **reconciling amendment to `tenant-rbac-standard.md`** (its §1/§4 assert the top tiers are
  fixed — the platform tier now gains a data-driven sub-role layer). Both land in the same change.
- Framework version **V32.49 → V32.50, MINOR** — held MINOR only by keeping `tenant_manager` the fixed ADMIN
  seed and every schema change strictly additive.

## Framework changes (Spec-Driven / AIEF) — priority order
| P | Surface | Change | SemVer |
|---|---|---|---|
| P0 | Master_Prompt.md Sync Impact Report | Prepend SIR: V32.49→V32.50 MINOR + counts (Rules 40→41, Scenarios 49→50, Checklist 147→~159/21→22) | governance |
| P0 | RULES block (+ compact + app CLAUDE.md) | NEW **Rule 41 "Site Access & Tenancy Bootstrap"** (topology) | new-rule |
| P0 | `.ai_prompt/rbac.md` Part E (+ Rule 34 xref, security.md L3) | Platform-scope roles: `scope` discriminator, tenant_manager=fixed ADMIN, seeded BILLING/TECH, distinct platform vocab, tenant guardrail restated | extend-rule |
| P1 | `rbac.md` Part F (+ phases 3/3.3 note) | Site-access URL topology + `/platform`→`/tm` + reserved-slug list (tm, demo, admin, login, api) | content |
| P1 | scenarios.md | NEW **Scenario 50** "Existing-App Site-Access & /tm Bootstrap Retrofit" (dev-first, HARD HOLD) | new-scenario |
| P1 | phases.md MODEL HOOKs (count-neutral, stays 18) | Seed platform roles @ Phase 4 Part 3; extend RBAC hook w/ scope enforcement + platformRole router; Parts 5-6 route-topology contract; Phase 3/3.3 cue | phase-hook |
| P1 | Security_Checklist.md | NEW **Section 22 "Platform Site-Access"** (scope enforcement, CHECK constraint, /tm gating, distinct vocab, role-routed login) | checklist |
| P2 | templates.md · LESSONS_REGISTRY.md · compact loading table · all mirror files | seed/.env cred keys; anti-regression fingerprint; doc pointer; count propagation | mixed |

## Global / fleet surfaces (~/.claude + vault)
| P | Surface | Change |
|---|---|---|
| P0 | NEW `~/.claude/library/site-access-standard.md` | Fleet canonical discipline: 3-layer topology, role-routed URL scheme, data-driven platform roles + distinct vocab, `/platform`→`/tm`, reserved slugs, demo-no-/tm. HARD HOLD + vault-only banner |
| P0 | `~/.claude/library/tenant-rbac-standard.md` | Reconciling amendment: platform tier gains a data-driven sub-role layer; tenant_manager stays fixed identity/ceiling; tenant guardrail unchanged; platform vocab is a distinct namespace |
| P1 | `~/.claude/CLAUDE.md` universal-login block | Describe TARGET (owner-gated, labelled not-deployed): add platform BILLING/TECH accounts, demo owner → superadmin@demo.com + demo tenant_admin, topology pointer |
| P1 | `~/.claude/CLAUDE.md` ROUTER | ONE new row mapping site-access/topology intent → the new library file |
| P0 | SOPS vault `universal-login-credentials.enc.yaml` (own owner-gated step) | Add `tenant_billing`/`tenant_tech` universal platform accounts; demo rename + demo tenant_admin. MUST land + verify before any live seed |

## Rollout sequence (HARD HOLD)
1. **Phase 0 — Author globally:** SIR first, then all framework governance edits + the new library file + the
   reconciling amendment + CLAUDE.md/ROUTER, AIEF authoring memory. LOCAL commits; counts consistent.
2. **Phase 0b — Vault (owner-gated):** add the platform accounts + demo rename; verify decrypt/parse. Before any live seed.
3. **Phase 1 — Prove on FRMS (dev-first):** scope schema + additive migration + disjoint platform resolver + `platformRole` router + `/platform`→`/tm` rename w/ redirect shim + role-routed login + `/{slug}/login` guard exception (both middleware AND `[tenant]/layout`) + seed. secure-code-guardian review + cross-scope tests + Visual QA. LOCAL.
4. **Phase 2 — Broadcast:** tailored inbox notes into each app's OWN memory (MG, Orqafy, FerryBook, CueLane). Never cross-repo edits.
5. **Phase 3 — Deploy + live re-seed:** owner-gated per env; vault verified first; demo rename coordinated with comms.

## Top guardrails (security-critical)
- **Two physically separate permission namespaces** (`FeatureKey`/`RolePermission` vs `PlatformPermissionKey`/`PlatformRolePermission`) + a CHECK constraint `(scope='tenant' AND tenant_id IS NOT NULL) OR (scope='platform' AND tenant_id IS NULL)` — a tenant role can NEVER resolve a platform permission (strongest anti-escalation).
- **`/{slug}/login` public exception** = exact `pathname === '/{slug}/login'`, never `startsWith` (a sibling would leak unauthenticated); grant in BOTH guard layers or it fail-closes into an infinite bounce.
- **`/platform`→`/tm`** ships a redirect shim; cutover gated on owner word (live bookmarks, callbackUrl, Traefik/Komodo path-matching, existing sessions would 404).
- **Vault/credential drift:** CLAUDE.md TARGET labelled; vault lands before any live seed or demo logins break.
- **Broadcast discipline:** never edit MG/Orqafy/FerryBook/CueLane from this seat; Orqafy naming divergence is a data-preservation landmine.

## Fleet targets
FRMS (reference) · Marine-Guardian · Orqafy (reconcile `tenant_super_admin` naming first via `ALTER TYPE…RENAME VALUE`) · FerryBook + CueLane (bake in at build phase) · **Flairr / Yelli out of scope** (single-tenant, no /tm).
