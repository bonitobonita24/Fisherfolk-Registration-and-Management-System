# Changelog

All notable changes per release. A version is assigned at each push/merge to `main`;
entries are auto-derived from Conventional-Commit types. See
`~/.claude/rules/release-changelog-discipline.md`.

## v0.23.0 — 2026-09-03

### [FEATURE]
- family-scoped head badge on fisherfolk detail (Phase C slice 2) (`012c226`)
- show family count in households list (Phase C slice 1) (`0e0176d`)
- Phase B — family-aware tRPC layer (multi-family households) (`b280f59`)
- Phase A — add Family model (multi-family households, additive foundation) (`7261dda`)
- add employment type (full-time/part-time) + primary source of income (`8a95b5d`)
- relabel 'Active Violations' → 'Number of Violations' + show count (display-only) (`5048d5c`)

### [FIXED]
- reject adding another family's head as a member (orphan guard) (`96f47e5`)
- FIS-33 Mark-Received dialog — target-size + focus-restore (WCAG 2.5.8, 2.4.3) (`c488012`)

### [DOCS]
- sharpen landing overhaul into a scope [WHAT]; correct 'being built' claim (`43aef47`)
- full-auto loop handoff — un-gated build queue exhausted, holding on owner [WHAT]s (`b34b2c5`)
- reconcile FIS-9/FIS-11 status — built on branches, awaiting owner merge (`5ac4c80`)
- surface FIS-8 Phase C multi-family UI direction [WHAT] (`08ec236`)
- FIS-8 Phase C partial + hardening handoff (full-auto loop) (`118ca5b`)
- Phase C partial — safe slices done, interactive UI deferred for review (`90865f4`)
- FIS-8 Phase B done — session log + STATE handoff (full-auto loop) (`e333814`)
- Phase B done (family-aware tRPC) — plan/queue/pending updated (`1d57a4c`)
- full-auto run — FIS-9/11/8A done (branches, HARD HOLD); FIS-8 phased plan; deferrals (`602d74d`)
- defer 9 [WHAT]-gated FIS tasks (full-auto); un-gated FIS-8/9/11/31 in progress (`0a2f378`)
- v0.22.1 geolocation fix shipped to prod; decision ① closed, ② on hold (EC2 migration), ③ open (`739ee48`)
- save-session handoff — FIS-32 geolocation fix + FIS-33 a11y; 3 open owner decisions (`c254867`)

### [CHORE]
- refresh AIEF:MANAGED source-rev stamp (sync-context.sh) (`6c35be7`)


## v0.22.1 — 2026-09-02

### [FIXED]
- Permissions-Policy geolocation=() → geolocation=(self) so FIS-25 'Use my location' works (`6d50e53`)

### [DOCS]
- record a11y audit results — 3/4 components clean, Mark-Received remediation TODO (`2014a0b`)
- v0.22.0 shipped to production — FIS-17..31 + FIS-12 status model live; backfill 3181 ACTIVE→NEW verified (`b3a1728`)


## v0.22.0 — 2026-09-02

### [FEATURE]
- round-3 batch FIS-26..30 (colors, zoom, map fix, network, location) (`1ce2c18`)
- FIS-25 coordinate capture — flagship (Fisherfolk) + household maps (`0394a97`)
- FIS-17..24 detail-page polish + household maps (`faa591b`)
- FIS-12 registration status model NEW/RENEWED/EXPIRED + post-election bulk-expire (`6892e64`)

### [FIXED]
- FIS-17 — themed thin scrollbar on overflowing tab strips (`ccbe876`)
- dedupe RENEWED header badge (status badge already conveys it) (`d843dc4`)
- give standalone /map page an explicit-height container (`a98858b`)

### [DOCS]
- FIS-17 scrollbar fix code-done (visual verify in FIS-32) (`9c613b4`)
- close FIS-12 migration-drift reconcile; note backfill sign-off as residual pre-prod gate (`a4e58c6`)
- real-browser demo smoke before presentation (FIS-32 partial) + basemap-CDN finding (`eddb52b`)
- save-session — queue next-session plan (FIS-12 reconcile, real-browser verify, a11y, screenshots, prod release) (`f878a09`)
- full-audit-check fixes — record FIS-12 drift blocker, soften map-verified claim, sweep stray screenshots (`9887835`)
- FIS-31 landing copy shipped to demo; screenshots + prod release remain (`6482d75`)
- save-session — rounds 1-3 (FIS-17..30) shipped to demo; queue FIS-31 landing page + prod release (`9da73a5`)
- mark FIS-17..24 done, FIS-25 flagship partial; note prod target (`5a7fe4c`)
- capture 2026-09-01 presentation batch FIS-17..FIS-24 (`665053f`)
- capture FIS-17 — restyle fisherfolk detail tab-bar scrollbar (owner 2026-08-31) (`8863379`)
- FIS-12 status model built + verified — handoff, decisions, changelog (`9335178`)
- 2026-08-31 — FMO July-9 meeting captured (FIS-8..16) + pitch deck drafted (`5fff197`)
- FIS-8/12 refined + FIS-14/16 resolved (owner 2026-08-31) (`c712240`)
- capture FMO 2026-07-09 meeting items as FIS-8..16 (`4e67c29`)
- FIS-4+FIS-3 shipped, v0.21.0 live on prod+demo; FIS-6/FIS-7 queued (`3ff8f0f`)
- save-session — v0.21.0 promoted to prod+demo; queue FIS-6 audit-log + FIS-7 user-management (`fcffef3`)

### [CHORE]
- backfill renewal rows for RENEWED fisherfolk missing history (`54a9722`)

### [OTHER]
- overhaul public landing copy for LGU presentation (FIS-31) (`250f5b1`)


## v0.21.0 — 2026-08-30

### [FEATURE]
- FIS-3 Cargorix Wave-5 remainder — non-record modules + /tm consistency (`d51afe1`)

### [DOCS]
- task-queue + session log — FIS-3 done + verified (416 tests, axe 0/12); v0.20.0 released (`9d51fa1`)


## v0.20.0 — 2026-08-30

### [FEATURE]
- FIS-4 uniform list chrome + edit-form/detail-tabs shared wrappers (`2ae8d52`)

### [FIXED]
- mirror inert onto Radix aria-hidden background (FIS-5, WCAG 2.2 AA) (`265b215`)

### [DOCS]
- task-queue + session log — FIS-4 done + verified (416 tests, axe 0/7 routes) (`0ae391b`)
- 2026-08-29 post-full-auto verification — FIS-5+FIS-2 verified clean (416 tests), Squirlnote synced (`c2531a0`)
- FIS-2 memory compaction done + session log (FIS-5 a11y + FIS-2) (`26b4a56`)
- FIS-5 a11y aria-hidden-focus fix → Done recently (`a0acd9b`)
- Cargorix Waves 4-5 + v0.19.0 shipped to prod+demo (full-auto ship) (`92e52aa`)


## v0.19.0 — 2026-08-28

### [FEATURE]
- Cargorix Wave 5 — prioritized per-module screen polish (token/idiom, JSX-only) (`c8069d7`)
- Cargorix Wave 4 — additive capabilities (⌘K palette, density, theme customizer) (`d4d198d`)
- Cargorix Wave 3 — reskin shared wrapper layer (token-only) (`354131a`)
- Wave 2 — App-Shell Trio floating-card reskin + orange active-nav (`0a08369`)
- Wave 1 — adopt cool-tinted neutral/surface tokens (light+dark), AA-verified (`aae3379`)
- Wave 0 spike — token-remap PoC + oklch→HSL converter (`68a49cf`)

### [FIXED]
- command palette WCAG 2.2 target-size + log pre-existing aria-hidden-focus (`9a09f6a`)
- sidebar group labels meet WCAG 2.2 AA contrast (drop /70 alpha) (`3b2c9d8`)
- clear active-tab highlight (orange underline + semibold) on detail tab bar (`e397bb0`)

### [DOCS]
- log Cargorix Wave-5 deferred remainder + structural items (`8d3b5d1`)
- mark auto-loop stopped by owner directive; state unchanged since Wave 3 (`daa5c5c`)
- finalize save-session handoff — Wave 3 done; W4/W5/merge gated queue (`fbeb072`)
- Cargorix Wave 3 done + verified (owner-approved); roadmap -> Wave 4 (`b9d2550`)
- Cargorix Waves 0-2 integrated onto v0.18.0 + verified; Wave 3 gated (`9c4b1c8`)
- next-session queue — Cargorix Wave 0 + 2 owner-authorized cross-seat decisions (`650757d`)
- v0.18.0 shipped to prod + demo (full-auto run) (`94ed6b7`)
- Cargorix Wave 2 (App-Shell reskin) + remember-me cookie fix — both live-verified (LOCAL/HARD HOLD) (`d553499`)
- Cargorix Wave 1 (cool-tinted neutrals) done + active-tab highlight; Wave 2 approved next (LOCAL/HARD HOLD) (`4fc1e00`)
- Cargorix Wave 0 spike done — token remap + converter (LOCAL/HARD HOLD) (`a103b5d`)


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

