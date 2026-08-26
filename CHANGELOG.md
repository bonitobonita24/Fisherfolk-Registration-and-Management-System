# Changelog

All notable changes per release. A version is assigned at each push/merge to `main`;
entries are auto-derived from Conventional-Commit types. See
`~/.claude/rules/release-changelog-discipline.md`.

## v0.18.0 — 2026-08-26

### [FEATURE]
- host-aware in-app links — tenant-relative paths on masked custom-domain hosts, killing the demo 308-on-click (`266449b`)
- host-aware server `redirect()` guards — 12 RSC guard sites emit clean paths on masked hosts (`cba0295`)

### [FIXED]
- invalid fisherfolk record id renders 404 not 400 (`2ed5cb9`)
- import-tempfiles `--dir` arg + telegram `media_objects` ledger write (`29a6cbd`)

### [DOCS]
- 08-14-26 masterlist import (dev + prod + live FMO) + host-aware links session logs


## v0.17.0 — 2026-08-21

### [FEATURE]
- horizontal grouped Profile-tab layout (name / identity / other) (`979ffa0`)

### [DOCS]
- 2026-08-21 Profile-tab layout + design principle; Cargorix queued (`dd3270b`)
- Profile-tab layout done + promoted to design-defaults Entry 6 (`84ccd53`)
- queue full Cargorix-template UX/UI redesign (big, architect-planned) (`bb05ada`)
- queue Profile-tab horizontal grouped layout + space-assessment principle (`479158f`)
- add interim owner todo queue (until Squirlnote launches) (`3e14127`)
- v0.16.0 relayout + demo category alignment shipped to prod+demo (`e07de96`)


## v0.16.0 — 2026-08-20

### [FEATURE]
- move profile fields to a default Profile tab + click-to-zoom media (`b7b4870`)

### [FIXED]
- align demo tenant categories to official calapan-city taxonomy (`9b77d27`)

### [DOCS]
- /tm platform-role UX fixes + platform seed shipped as v0.15.1 (`072b462`)


## v0.15.1 — 2026-08-17

### [FIXED]
- show real platform tier in header badge, not hardcoded "super admin" (`7918902`)
- permission-aware /tm landing for restricted platform roles (`3139296`)

### [DOCS]
- platform-account seed DONE on prod+demo; track /tm UX branches (`b09b46a`)
- 2026-08-17 — ship Site Access Standard v0.15.0 to prod+demo + vault edit (`7568597`)

### [CHORE]
- scoped idempotent platform-accounts seed for reseed-never envs (`4aa3b6e`)


## v0.15.0 — 2026-08-17

### [FEATURE]
- M5 — seed platform ADMIN/BILLING/TECH roles + accounts + resolution tests (`6ab1151`)
- M4b — forge-proof guard headers + /login picker + optional /{slug}/ landing + canManage dedup (`e61c64d`)
- M4a — per-tenant /{slug}/login + /tm/login, role-routed landing, drop global /admin (`639b5f2`)
- M3 — rename /platform management site to /tm + redirect shim (`7f44ac8`)
- M2 — platform RBAC resolver + platformRole router + cross-scope guards (`2b43679`)
- M1 — platform-scope custom-role schema foundation (`5bb7f12`)

### [FIXED]
- drop redundant ctx.userId! assertions in tenantUser (M6 fallout) (`8239d96`)
- M6 — close platform-authz escalation (HIGH from secure-code-guardian) (`0a488d3`)

### [DOCS]
- 2026-08-16/17 save — Site Access Standard Phase 0 + Phase 1 (FRMS ref impl) done (`f9c4b03`)
- per-tenant login form model + optional /{slug}/ landing page (`a30f29f`)
- fleet adoption plan for Site Access & Tenancy Bootstrap Standard (`6312a9d`)
- lock Site Access & Tenancy Bootstrap Standard (`29a4419`)
- 2026-08-15 — v0.14.1 release + dev refresh; session save (`365ff17`)


## v0.14.1 — 2026-08-15

### [FIXED]
- fail-open on transient DB error in session securityVersion check (`0963346`)
- WCAG 2.2 AA static fixes — keyboard, skip-link, heading semantics (`5a0b6e2`)

### [DOCS]
- 2026-08-15 save — reboot health check + a11y remediation + auth fail-open fix (`bba3436`)
- v0.14.0 ship log + chore: playwright-core root devDep (live-smoke harness) (`8e48ce2`)


## v0.14.0 — 2026-08-14

### [FEATURE]
- nexacrm wave 4 — forms + operations screens (`c4eff7d`)
- nexacrm wave 3 — record detail pages + vessel identification compression (`17df57c`)
- compact clickable rows + deep links (`aa4fb4d`)
- nexacrm wave 2 — record list screens (`c9aae27`)
- year-over-year comparison chart (`e8f92ee`)
- vessel photos + QR backfill for demo tenant (`3fd282b`)
- nexacrm wave 1 — shell + dashboard (`bb766e1`)
- nexacrm wave 0 — design tokens (`ecd8e8a`)

### [FIXED]
- notification entity refs for demo tenant (`8622073`)
- bell popover scroll + view-all footer (`00df9e0`)
- assign demo categoryIds + real barangay names + households target (`98157dd`)

### [DOCS]
- nexacrm redesign + demo polish batch — swarm session log (`6b6815c`)
- NexaCRM port map — token/shell/idiom authority for reskin waves (`40079f0`)
- log held-docs-commit push (752c6a5..c101981); main clean (`c121a17`)
- final live journey smoke on frms-demo v0.13.1 — 7/7 PASS (Sign in nav verified desktop+mobile) (`e01faf9`)
- landing-first demo root (v0.13.0–v0.13.1), journey E2E 7/7 PASS (`6a65635`)


## v0.13.1 — 2026-08-14

### [FIXED]
- add Sign in button to nav (desktop + mobile sheet) (`54fa422`)


## v0.13.0 — 2026-08-14

### [FEATURE]
- marketing landing at custom-domain root for anonymous visitors (`00204bf`)

### [DOCS]
- v0.12.5–v0.12.6 — stale-session loop + login-hang fixes, final E2E PASS (`caf9b1b`)


## v0.12.6 — 2026-08-14

### [FIXED]
- clean callbackUrl on custom-domain hosts — post-login nav stalled on 308 (`fabbfa5`)


## v0.12.5 — 2026-08-14

### [FIXED]
- break redirect loop for foreign-tenant sessions on custom-domain hosts (`1b98c23`)

### [DOCS]
- demo at subdomain root via custom-domain masking (v0.12.1–v0.12.4, live-verified) (`b210749`)


## v0.12.4 — 2026-08-14

### [FIXED]
- serve /data public static files — tenant cross-check swallowed them (`a58e34d`)


## v0.12.3 — 2026-08-14

### [FIXED]
- tenant-root redirect page + reserve /data static prefix (`7b11be0`)


## v0.12.2 — 2026-08-14

### [FIXED]
- guard inverse-mask redirect against middleware re-run on rewrite (`1abc071`)


## v0.12.1 — 2026-08-14

### [FIXED]
- custom-domain clean URLs — app-level route exemption + inverse masking (`0aac6a1`)

### [DOCS]
- demo deployed — frms-demo.powerbyte.app/demo = official Calapan City demo (v0.12.0, smoke 8/8) (`7b3a83e`)


## v0.12.0 — 2026-08-14

### [FEATURE]
- Calapan City demo tenant seed — 500+ fisherfolk + full records, all with media (`974ab45`)

### [FIXED]
- allow DEMO_SEED_PASSWORD env override for demo-stack seeding (`4728f24`)
- validated photo re-seed + build notifications list page (`cff67e1`)

### [DOCS]
- session handoff — Calapan City demo tenant seeded (500+ ff, all menus) + v0.11.0 shipped (`2a923e7`)


## v0.11.0 — 2026-08-14

### [FEATURE]
- public marketing landing page + relocate login to /admin (`6268bc5`)
- adopt AdminCN idiom on RBAC admin surface (Phase D-2, styling-only) (`e5e304c`)
- adopt AdminCN animated StatCard — Skeleton loading + reduced-motion-safe NumberTicker (`c363899`)
- add AdminCN Phase A primitives (skeleton, collapsible, progress, pagination, circular-progress, timeline, number-ticker) (`c12db6a`)

### [FIXED]
- align Traefik router labels with server static config (prod+stage) (`79693f0`)
- correct js-yaml override floor to clear CI HIGH audit (`c383b52`)
- raise stale dompurify override floor to >=3.4.13 (`cc7ee4c`)
- resolve 8 HIGH prod advisories — next 15.5.21 + transitive overrides (`aeb666f`)
- amd64-only build + 45m timeout — unblock deploy image publish (`3d619b4`)
- bump next-auth beta.25->beta.32 + @auth/prisma-adapter, patch brace-expansion DoS (`5a1937a`)
- match public paths on a boundary, not loose prefix (`59cd415`)

### [REFACTOR]
- decompose ReportHub (CC 90 -> 41) (`b18e97e`)
- dedupe cellValueToString into lib/import/excel (`594636f`)

### [DOCS]
- session handoff — public landing page built + login→/admin + decision-#1 merged (LOCAL/HARD HOLD) (`62c4cfe`)
- close decision #1 — 3 held branches merged to main (LOCAL only) (`46d21db`)
- session handoff — Traefik-label drift resolved [HOW] + loop stopped by owner (`a072e36`)
- close Traefik-label drift — resolved [HOW] on fix/traefik-label-drift (`7bb2a2e`)
- hand off open [WHAT]s to next session — refactor merge gate + Traefik-label drift (`95ea63b`)
- session handoff — CGC established + 2 CGC-driven refactors (local, held) (`03d341e`)
- session handoff — audit fixes shipped to main, import cleanup verified (`024a40f`)
- session handoff — V32.49 sync merged to local main (push held) (`76c4f42`)
- session handoff — held commits pushed, CGC established, framework synced to V32.49 (branch, HARD HOLD) (`e8daf33`)
- CI green on main (js-yaml HIGH cleared); uuid moderate deferred with rationale (`c91ab13`)
- push shipped 8 security commits to origin; close cosmetic decision; stop loop (`1fecd17`)
- mark dompurify override fix done (cc7ee4c), refresh git head (`4fde84a`)
- checkpoint — dockerignore merged, 8 HIGH advisories resolved, full audit (`d85fef6`)
- handoff — .dockerignore nested-node_modules hardening done (LOCAL) (`eaf9056`)
- mark .dockerignore nested-node_modules hardening done (adfb7d6) (`6863c8a`)
- Auth.js beta.32 SHIPPED TO PROD + CI amd64/timeout fix (verified live) (`c029d75`)
- queue prod-ship + .dockerignore + Next.js highs for next session (owner green-lit) (`3a664a8`)
- Auth.js beta.32 bump merged to main + dev-verified (LOCAL, prod chain still open) (`7ea017c`)
- record Auth.js beta.32 bump + brace-expansion (CHANGELOG/STATE/PENDING) (`3e4d370`)
- AdminCN adoption shipped to production (frms.powerbyte.app) (`cf9f4b0`)
- queue Auth.js beta.32+ security bump for next session (CRITICAL fail-open) (`20366cd`)
- record AdminCN adoption consolidated onto local main (Phases A/D-1/D-2/E) (`44b078c`)
- resolve approved deploy set (all already-done) + AdminCN D1-D4 approved (`29bded9`)
- 2026-08-07 late handoff — framework V32.45 sync + AdminCN adoption plan (full-auto) (`fd3ee44`)
- full-site adoption plan (planning-only) + D1-D4 owner decisions (`7449fc6`)
- 2026-08-07 handoff — v0.10.1 CI fix shipped; preserve incoming AdminCN planning directive (`ae3240b`)

### [CHORE]
- untrack stale .bak files, fix compose depends_on YAML, reconcile STATE (`edd4193`)
- gitignore .cgcignore (CGC per-seat dev-nav tooling) (`04bd72d`)
- sync V32.45.1 → V32.49 (governance-only) (`f6170d7`)
- untrack .ai_prompt/starter/admincn reference slice (framework V32.48.1) (`fda4d52`)
- untrack AdminCN reference slice (framework V32.48.1) (`3b60cdd`)
- ignore nested node_modules to prevent deps-stage overwrite (`adfb7d6`)
- gitignore screenshots/ (test artifacts, never committed) (`fa44e80`)
- sync V32.28 → V32.45 (governance-only) — land AdminCN deliverables (`8cdd5da`)


## v0.10.1 — 2026-08-07

### [FIXED]
- pin pnpm to 10.0.0 in Dockerfile to match packageManager (`5d3fc85`)


## v0.10.0 — 2026-08-06

### [FEATURE]
- masterlist batch importer for delta fisherfolk records (`420f6d0`)

### [FIXED]
- correct DOB parsing for date-typed/serial Excel cells (`43f7ab6`)
- let /api/media bypass tenant URL-routing (`685eaa9`)

### [DOCS]
- record import+audit queue; mark San Rafael→Salong merge done (`3f1b553`)

### [CHORE]
- seed San Rafael→Salong barangay alias for durability (`d69a1ec`)

