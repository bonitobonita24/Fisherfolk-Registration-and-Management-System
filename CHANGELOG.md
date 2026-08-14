# Changelog

All notable changes per release. A version is assigned at each push/merge to `main`;
entries are auto-derived from Conventional-Commit types. See
`~/.claude/rules/release-changelog-discipline.md`.

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

