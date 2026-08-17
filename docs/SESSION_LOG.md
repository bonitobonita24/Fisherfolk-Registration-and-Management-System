# FRMS — Session Log

Human-readable per-session accomplishment ledger (newest on top). The dense reload

## 2026-08-17 — Ship Site Access Standard to prod+demo (v0.15.0) + vault edit

**In your words:** Resume, surface the open decisions, and "yes I authorize the gated items" — scoped in the follow-up to: FRMS only push, promote prod + demo now, and edit the vault with fresh passwords.

✅ **Done**
- **Merged + pushed FRMS site-access standard → main, released v0.15.0.** `feat/site-access-tenancy-standard` merged `--no-ff` (`e3dad45`); consolidated release v0.15.0 (CHANGELOG + version-sync 7 pkgs + landing footer, tag pushed); `origin/main == 9594ced`. Pre-push verify: typecheck 7/7, 402 tests, build 5/5.
- **Vault edited (Phase 0b).** Added platform `tenant_billing`/`tenant_tech` (tenantbilling@ / tenanttech@) + demo `superadmin@demo.com` with fresh generated passwords; decrypts clean; committed LOCAL in Server-Setups (`b4178da`).
- **Promoted PROD + DEMO to v0.15.0.** CI built `sha-9594ced` → `push-to-prod` + `push-to-demo` (DB backup each, single migration `add_platform_scope_role_matrix` applied, reseed-never). Both healthy on `9594ced`; all routes 200 (`/`, `/login`, `/tm/login`, `/demo`, `/demo/login`). The long-standing "prod 101 commits behind" is cleared.

🔨 **Partial / verifying**
- Local dev rebuild off main (Rule 39 dev-freshness) — in progress at session save.

💬 **Decisions / notes**
- Scoped to **FRMS only** — AIEF `feat/v32.50-site-access-standard` merge deliberately held for its own seat.
- Prod/demo are **reseed-never**, so the new platform login accounts don't exist on those live DBs yet — a targeted platform-account seed (vault passwords as env) is a small owner-gated follow-up.
- Un-gated next work still open: UX fix so restricted platform roles (BILLING/TECH) don't land on `/tm/tenants` (403 + retries).
- Staging data-first gate bypassed on your explicit prod authorization (staging torn down / build-only).

## 2026-08-16/17 — Site Access & Tenancy Bootstrap Standard: authored fleet-wide + FRMS reference impl built

**In your words:** Review tenants/accounts across all envs; simplify the SaaS/tenancy architecture per my "NEW SITE CREDENTIALS.pdf" (/tm platform → client tenant → optional demo); make platform roles (ADMIN/BILLING/TECH) data-driven & frontend-creatable; orchestrate a brainstorm on adopting this into the Spec-Driven framework + fleet-wide memory; then build it (proceed to Phase 1); live-smoke it; save session + full-auto handoff.

✅ Done
- **Tenant/account audit** — inventoried prod (calapan-city + platform), dev (+calapan-demo), demo (frms-demo); every account + URL + vault-verified password mapped. Confirmed prod is **101 commits behind** (missing v0.14.0+v0.14.1), demo **7 behind** — deploys never promoted (owner-gated).
- **Locked the "Site Access & Tenancy Bootstrap Standard"** (spec `docs/SITE_ACCESS_STANDARD.md` + `docs/SITE_ACCESS_ADOPTION_PLAN.md` + DECISIONS_LOG): 3-layer `/tm`→`/{slug}`→`/demo`; data-driven platform roles (reuse custom-role builder + `scope` discriminator, distinct platform vocab, tenant guardrail intact, ADMIN-only role mgmt); per-tenant `/{slug}/login` form (global `/admin` dropped); optional `/{slug}/` landing (FerryBook exemplar).
- **Phase 0 — authored globally (6-lens multi-agent brainstorm → synthesis):** `~/.claude/library/site-access-standard.md` (NEW) + `tenant-rbac-standard.md` carve-out + `CLAUDE.md` TARGET-labelled universal-login + ROUTER row; **AIEF framework V32.49→V32.50** (branch `feat/v32.50-site-access-standard`: Rule 41 + rbac.md Part E/F + Scenario 50 + Security Checklist §22 + phase hooks + 15 mirror files, alignment PASS); AIEF authoring memory + broadcast notes to MG/Orqafy/FerryBook/CueLane (Flairr/Yelli out-of-scope).
- **Phase 1 — FRMS reference implementation** (branch `feat/site-access-tenancy-standard`, 8 commits M1–M6 + build fix): scope discriminator + PlatformRolePermission + CHECK constraint · disjoint platform resolver + platformRole router · `/platform`→`/tm` + shim · per-tenant `/{slug}/login` + `/tm/login` + role-routed landing · forge-proofed guard headers + `/login` picker + optional landing + canManage dedup · seed ADMIN/BILLING/TECH.
- **secure-code-guardian review** found 1 HIGH (BILLING/TECH bypassed their matrix on existing tenant/tenantUser routers) — **fixed in M6** (re-gated on platform matrix; fail-closed resolver) + proven with 16/16 tests.
- **Live smoke (dev rebuilt off branch):** all routing/shim/guard flows correct (no redirect loops); per-tenant + platform logins work; **BILLING gets 403 on tenant.list proven in-browser** (escalation fix live). 0 console errors on tenant login.
- **Lesson logged** (`monorepo.turbo-next.worker-done-gate-must-run-lint-gated-build`): typecheck+tests ≠ lint-gated build; verify container actually recreated after a dev rebuild (start.sh exits 0 even on app-build failure).

🔨 Follow-up (un-gated, next session / full auto)
- **UX gap:** restricted platform roles (BILLING/TECH) land on `/tm/tenants` they can't use → 403 + retries. Needs role-aware platform landing or a graceful restricted-state.

💬 Decisions / HARD HOLD
- Everything is LOCAL, HARD HOLD, nothing pushed. Merge to main + push, the SOPS vault edit (now FRMS-validated), the per-app Phase-2 implementations, and any deploy are all owner-gated `[WHAT]`s in `PENDING_DECISIONS.md`.
- Dev stack currently serves the **branch** code (not main/v0.14.1) — the active work; rebuild to main on request.
- Pre-existing (not this branch): `customRole`/`tenant` routers trust a client `tenantId` without `=== ctx.tenantId` — flagged for a separate look.

## 2026-08-15 (later) — Released v0.14.1 (a11y + auth fixes) to origin + dev refresh

**In your words:** Resume the session; push the held a11y + auth-hardening fixes to origin; confirm I can test it locally; then hand off all pending tasks/decisions, save session, and stop.

✅ Done
- **Released v0.14.1** — owner authorized the held push. Generated consolidated changelog + version-sync (7 package.json + landing footer `_APP_VERSION`) in release commit `bf751bc`, annotated tag `v0.14.1`. Typecheck clean. `git push --follow-tags` → **`main` == `origin/main`**, tag pushed. Ships: `[FIXED]` auth session fail-open on transient DB error + `[FIXED]` WCAG 2.2 AA static fixes (keyboard/skip-link/heading semantics).
- **Local dev fully deployed** off shipped sha — rebuilt `frms_dev_app` off `bf751bc`, freshness GREEN, `/admin` → 200, footer reads v0.14.1. Testable at http://localhost:44387 (login `webmaster@localhost.com`, tenant `calapan-city`).

💬 Decisions/notes
- Staging stack is torn down (build-only CI) so the push builds an image but lands nowhere live; **production stays manual** — v0.14.1 NOT auto-promoted to prod.
- Session-save docs commit (STATE.md + SESSION_LOG.md) is LOCAL per HARD HOLD — not pushed without explicit word.

⏳ Not yet / Next — (optional) promote v0.14.1 → prod (manual); push the session-save docs commit; per-page heading-level polish; manual keyboard/SR pass + Rule-31 re-baseline (advisory). **No open [WHAT].**

## 2026-08-15 — Post-reboot health check + a11y remediation + auth robustness fix (swarm)

**In your words:** My PC rebooted/hung overnight — verify nothing is corrupted from the last milestone; bring the dev stack back cleanly; run the axe a11y sweep; then fix what it found and investigate the session drop-outs; merge and save.

✅ Done (all LOCAL on `main`, 4 ahead of origin — HARD HOLD, nothing pushed/deployed)
- **Reboot health check** — `git fsck` clean (dangling commits normal, zero errors), HEAD `8e48ce2` == origin, tree clean, tag `v0.14.0` intact, demo live (HTTP 200). No corruption, no lost work — reboot landed on a clean v0.14.0 checkpoint.
- **Docker recovery** — whole fleet auto-restarted after reboot; FRMS dev stack all healthy. Found dev image 17 min behind main (docs-only commit `8e48ce2`) → **rebuilt dev off main, freshness green**, serves 200.
- **A11y sweep (3-worker swarm)** — 1 static (jsx-a11y) + 2 runtime (axe-core 4.10.2, headless, WCAG 2.0/2.1/2.2 A+AA) across 15 routes. **Result: 0 runtime axe violations** everywhere; static found 0 critical / 2 serious / 4 moderate / 3 minor. Reports in `test-artifacts/a11y-*`.
- **A11y remediation** (`fix/a11y-wcag-static` → merged `1535d3f`) — keyboard ops for ID-template drag editor (SC 2.1.1, composes with dnd-kit), skip-to-content link (SC 2.4.1), `CardTitle`→`<h3>` for heading outline (SC 1.3.1, safe across 86 usages), register result headings h3→h2. Gates: tsc ✓ · lint ✓ · 402 tests ✓ · build ✓.
- **Session-expiry investigation + fix** (`fix/auth-session-failopen` → merged `0963346`/`5e49e73`) — root cause: the V28 `securityVersion` session check (`server/auth/index.ts`) ran a Prisma read on every request with NO try/catch, so a transient DB/pool error was misread as invalidation → logout to `/admin`. Fix: fail-CLOSED on definitive invalidation, fail-OPEN on transient DB error. Gates green.

💬 Decisions/notes
- Ruled out the v0.12.5 custom-domain cookie-deletion as the logout cause (dead code on localhost — `TENANT_CUSTOM_DOMAINS` unset in dev).
- `CardTitle`→`<h3>` can create h1→h3 skips on pages without an h2 — a *best-practice* imperfection (axe heading-order isn't AA-tagged), NOT an AA violation; still a net SC 1.3.1 gain. Optional per-page heading follow-up remains.
- Auth fail-open flagged by background commit security-review → acknowledged as intentional (availability-vs-security tradeoff; definitive invalidation still fail-closed).
- Incidental: dev `calapan-city` tenant has 0 vessel records (vessels/detail unaudited — data state, not a bug).

⏳ Not yet / Next — push `main` to origin (would trip Model-A CI + staging auto-deploy) is a separate owner-gated decision; optional per-page heading-level polish; formal keyboard/screen-reader manual pass + Rule-31 design-fidelity re-baseline (advisory).

## 2026-08-14 — NexaCRM whole-app redesign + demo polish batch (6 queued tasks, swarm)

**In your words:** Redesign everything with the NexaCRM shadcn/studio Pro template first, then fill the blank dashboard charts, fix the oversized/non-clickable notifications page, make the bell list scrollable, add real sample images + scannable QR codes, and compress the sparse vessel detail layout.

✅ Done (all on LOCAL branches — HARD HOLD, nothing pushed/deployed)
- **NexaCRM redesign (T6)** — "inherit the look" path (owner-picked): 4 waves on `feat/nexacrm-reskin` (12 commits ahead of main @ `c4eff7d`): tokens (oklch→HSL, tenant accents preserved) → shell+dashboard → list screens → detail pages → forms/ops (60 files final wave). Port map authority committed: `docs/NEXACRM_PORT_MAP.md`. Powerbyte SidebarFooter credit + version tag preserved; WCAG contrast enforced over template values where they conflicted.
- **Blank charts healed (T1)** — root cause: demo seed created all 500 fisherfolk with empty `categoryIds` + generic "Barangay N" names. Seed repaired (`feat/demo-seed-repair`): weighted categories, 33 REAL Calapan barangay centroid names, households 6→45. YoY "coming soon" placeholder replaced with real `dashboard.getYoYComparison` + area chart + delta badge (7/7 tests). Verified live: zero blank series left; density map plots all barangays.
- **Notifications (T2+T3)** — compact ~40px clickable rows (16 visible vs 5), whole-row deep-links via new shared `notificationHref()`; bell ScrollArea Radix max-h bug fixed (viewport-level), View-all footer, closes-on-navigate. Seed backfilled 30/30 notifications with verified entity refs. Click-through verified live (notification → exact vessel record).
- **Real photos + QR (T4)** — QR system already existed (`buildQRPayload`, PII-free envelope for the future scanner app) but was never seeded: backfilled 300 vessels + 500 fisherfolk; 30 distinct real boat photos via Telegram-pointer pipeline replacing the single shared placeholder PNG. 10/10 sample QR parse match.
- **Vessel detail compression (T5)** — photo+QR side-by-side 16rem media column + 3-col field grid (Hull/Place/Year/Homeport pulled up); blank space eliminated; mobile 393px stacks cleanly, no overflow.
- **QA sweep on rebuilt dev** — dashboard/vessels/notifications/map/mobile all verified live (screenshots in `screenshots/qa-*.png`); map "blank after login-redirect" observation retested → transient, loads on SPA-nav (8 basemap requests) — non-issue.

💬 Decisions/notes
- Owner picked Option A (inherit NexaCRM look on Next15/TW3 stack) over full template swap (Next16/TW4 migration rejected as high-risk).
- Dev DB has no `demo`-slug tenant → all seed runs hit `calapan-demo` (dev). **The remote demo stack needs the same seed scripts run at deploy time** (`seed-demo-calapan --tenant demo` heal + `seed-demo-vessel-media --tenant demo` + extras).
- Owed before merge (advisory): full axe a11y sweep + Rule-31 design-fidelity re-baseline (workers preserved aria/focus/contrast by construction; formal audit pending).
- Branches awaiting owner: `feat/nexacrm-reskin` (contains everything, incl. merged `feat/dashboard-yoy` + `feat/notifications-ux`), `feat/demo-seed-repair` (worktree). Merge to main + demo deploy = owner's word.

⏳ Not yet — deploy to frms-demo (owner-gated); remote demo seed heal at that moment.

## 2026-08-14 (late night) — v0.14.0 SHIPPED to frms-demo (merge + version + deploy, owner-authorized)

**In your words:** "merge + version + deploy then save session stop loop."

✅ Done
- Merged `feat/nexacrm-reskin` + `feat/demo-seed-repair` → main; full gate green (tsc/lint/402 tests/build).
- **Released v0.14.0** (minor; 8 feat + 3 fix; CHANGELOG + tag + version-sync incl. landing footer) and pushed `--follow-tags`.
- CI built `sha-2132762` → **promoted to demo** (`push-to-demo.sh`: DB backed up pre-push, no pending migrations, redeployed).
- **Remote demo data heal** (4-script chain via verified SSH tunnel :15436, `DEMO_SEED_PASSWORD` from vault so logins unchanged): 500/500 fisherfolk categories+barangays healed, 30/30 notifications entity-ref'd, 300 vessels re-pointed to 30 real photos + QR, 500 fisherfolk QR backfilled.
- **Live smoke on frms-demo.powerbyte.app: 9/9 PASS** (login, YoY chart live, categories non-zero, vessel photo 640px via /api/media + QR, 16 compact notification rows, click-through → fisherfolk record, 0 console errors). Footer shows v0.14.0.
- Dev rebuilt off released main — `dev-freshness-check` FRESH.

💬 Notes
- 🔴 New global lesson: `bash.pipeline.tail-masks-exit-code-in-chained-seeds` (first heal run silently failed — tail ate exit codes + pgrep self-matched the tunnel check; fixed with set -e + real TCP probe).
- Advisory still open (non-blocking): formal axe sweep + Rule-31 fidelity re-baseline.
- `playwright-core` added as root devDep (live-smoke harness).


handoff lives in `docs/STATE.md`; open owner decisions in `PENDING_DECISIONS.md`.

## 2026-08-14 (latest) — Pushed held docs commits to origin/main

**In your words:** push the held docs commits.

✅ **Done & verified**
- Pushed the 4 held docs/session-save commits to `origin/main` (`752c6a5..c101981`); `git status` confirms `main` up to date with `origin/main`, no ahead/behind.
- Documentation only (STATE, session log, journey-smoke) — no code, no deploy. Live demo unaffected (still v0.13.1).

💬 **Notes**
- Plain push to `main` may trigger CI `docker-publish` image build (Model-A); no environment auto-deploys — staging/prod/demo promotion stays owner-gated.
- Untracked `.qa-learnings/` left in place (QA-skills scratch, not app code).

## 2026-08-14 — Final LIVE journey smoke on the demo (v0.13.1) — 7/7 PASS

**In your words:** run the final visitor-journey smoke on the live `frms-demo.powerbyte.app` — especially the just-added "Sign in" nav button — read-only, then save the session.

✅ **Done & verified**
- Full anonymous→signed-in journey on the LIVE demo, all 7 checks PASS: landing renders at `/` (URL stays clean) · **Sign in button visible in the nav** (desktop 1440px) · reachable on mobile 393px via the hamburger sheet and navigates to `/admin` · login → rendered `/dashboard` in 7.5s · logged-in `/` forwards to `/dashboard` · zero console errors.
- Evidence: `screenshots/demo-landing-signin-desktop.png` + `demo-landing-signin-mobile.png` (sheet open). Password fetched via sops inside the script — never printed.

💬 **Notes**
- An initial mobile FAIL was a test-selector artifact (locator hit the theme toggle / a hidden desktop link), not an app defect — re-verified with `button[aria-label="Open menu"]`.
- Open low-prio polish carried: clean non-slug hrefs on custom-domain hosts (avoid per-click 308) · real barangay names in demo seed for the density map.

## 2026-08-14 — Demo now at the subdomain ROOT (custom-domain masking) — no more `/demo` path (v0.12.1–v0.12.4)

**In your words:** the `/demo` slug on the `frms-demo` subdomain is redundant — serve the demo at the subdomain root like its own site; I'm fine with the subdomain.

✅ **Done & verified**
- Mapped `frms-demo.powerbyte.app` as the `demo` tenant's **custom domain** (the mechanism built for real client domains) — tenant now serves at the subdomain root; slug exists internally but never shows in the URL.
- Live onboarding exposed **4 real defects** in the never-before-activated masking path; all fixed, released, deployed (each verified on the live stack):
  - **v0.12.1** — `/admin`,`/login`,`/platform` exempt from tenant rewriting (login 404'd) + inverse-mask 308 (slug-prefixed URL → clean form).
  - **v0.12.2** — Next re-runs middleware on rewritten URLs → the inverse-mask looped every clean URL; internal rewrites now carry a marker header.
  - **v0.12.3** — bare `/<slug>` had no page (post-login 404) → tenant-root redirect page; `/data` added to rewrite-reserved prefixes.
  - **v0.12.4** — middleware tenant cross-check swallowed `public/data/*.geojson` (silent 307 → map lost its data, ALL hosts) → `/data` added to PUBLIC_PATHS.
  - **v0.12.5** — owner hit `ERR_TOO_MANY_REDIRECTS` on a stale old-demo URL: a session for a DIFFERENT tenant (old `calapan-city` JWT survived the DB wipe) looped forever on the custom domain → such sessions are now cleared + sent to login.
  - **v0.12.6** — login hung at "Signing in…": the post-login `router.push(callbackUrl=/demo)` stalled on the inverse-mask 308 → custom-domain hosts now issue CLEAN callbackUrls (bare root → `/dashboard`); login verified landing on `/dashboard` in 5.2s.
- **Owner follow-up: "root always goes to /admin — is that OK?"** → chose **landing-first**:
  - **v0.13.0** — the custom-domain root is now app-level: anonymous visitors see the animated marketing landing (URL stays `/`); signed-in users are forwarded to `/dashboard` (host-aware clean redirect).
  - **v0.13.1** — the landing had NO path to login (E2E caught it) → "Sign in" button added to the nav, desktop + mobile sheet.
  - **Final journey verification (v0.13.1): 7/7 PASS** — landing renders at `/`, Sign in visible (both breakpoints), login → `/dashboard` in 7.5s, logged-in root forwards to dashboard, 0 console errors. Screenshots `screenshots/demo-landing-signin-*.png`.
- **Final live verification:** login lands on rendered `/dashboard` (clean URL), all sidebar navs clean, fisherfolk photos render, `/demo/dashboard` → `/dashboard`, geojson **200 `application/geo+json`**, 0 console errors. Dev rebuilt FRESH per release.
- 🔴 2 global lessons recorded: `nextjs.middleware.rerun-on-rewrite-loop`, `nextjs.middleware.swallows-public-static-files`.

💬 **Notes**
- Sidebar hrefs are still slug-prefixed (each click 308s to the clean form — works, one extra hop). Optional polish: emit clean hrefs on custom-domain hosts.
- The geojson fix benefits dev/staging/prod too (defect existed everywhere, silently).

## 2026-08-14 (later) — Demo deployed: `frms-demo.powerbyte.app/demo` is the official Calapan City demo (v0.12.0)

**In your words:** deploy the demo, prune the old demo we already had, and make the Calapan City tenant the real official demo — accessible as `/demo` just like any registered tenant.

✅ **Done & verified**
- **Released v0.12.0** — merged `feat/calapan-demo-seed` + made the seed admin password vault-overridable (`DEMO_SEED_PASSWORD`); tsc clean + 393/393 tests; tagged + pushed `08ee976`; CI image green.
- **Old demo pruned** — DB backed up first (`/root/frms-demo-backup-pre-calapan-demo-*.sql.gz` on the VPS; it held the old calapan-city demo + 6 IDT test tenants), then all demo volumes wiped.
- **Fresh demo stood up** — `demo-latest` = `sha-08ee976`, fresh migrations, full seed chain re-run remotely with slug **`demo`** → tenant "Calapan City" lives at **`frms-demo.powerbyte.app/demo`**. Login `admin@demo.com` with the **vault demo password** (not the local-dev one).
- **Data:** 500 fisherfolk (validated 100-face photo pool, magic-byte checked) · 300 vessels w/ photos · 60 violations w/ evidence · 4 ayuda programs / ~530 beneficiaries · 120 fish catches · 25 kanban · 30 notifications + full long-tail. Media on Telegram (bot token added to demo env); new UI uploads on demo still go to MinIO.
- **Playwright smoke on the live stack: 8/8 PASS, 0 console errors** (landing, login, dashboard, fisherfolk photo+signature render, vessels, notifications, violations, ayuda). Screenshots in `screenshots/demo-smoke-*.png`.
- **Dev freshness** — local dev rebuilt off v0.12.0 main, freshness check FRESH.

💬 **Decisions / notes**
- Owner approved: v0.12.0 version; Telegram-creds approach for demo media (fast path) over a MinIO re-home script.
- Seed hit the WSL2 IPv6 black-hole on Telegram uploads — **proven no-sudo fix recorded** in the global ledger: `NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"`.
- Cosmetic (non-blocking): notifications list displays 16 items (same cap as dev); density map can't plot the generic "Barangay 1–12" seed names (no centroids); households = 6 (hardcoded target — tracked enhancement).
- Demo signatures use the bundled QA fixtures (fresh DB had no calapan-city pool to copy) — photos remain a 100-face unique pool.

## 2026-08-14 — "Calapan City" demo tenant seed (500+ fisherfolk, every menu populated) + v0.11.0 shipped

**In your words:** (overnight, full auto) push the authorized work, then build a fresh **demo tenant named "Calapan City"** with 500+ dummy fisherfolk (fabricated names, NOT the real registrants) each with a photo + signature, plus dummy vessels/violations/ayuda/etc all with images — make sure **no menu is blank**. Reuse random signatures from the official tenant; source person photos anywhere (no real photos/names).

✅ **Done & verified**
- **Released & pushed `v0.11.0`** — merged the held landing-page branch into `main`, consolidated changelog + version-sync + annotated tag, `git push --follow-tags origin main` (you confirmed the version). Both prior open push decisions closed.
- **Built an isolated demo tenant "Calapan City"** (`calapan-demo`) in **local dev only** — the real `calapan-city` data was never touched:
  - **500 fisherfolk** — fabricated Filipino names (disjoint from real registrants), every one with a **photo** (validated fake faces) + **signature** (reused from the official tenant's signatures, decoupled from any name).
  - **300 vessels** (all with photos), **60 violations** (evidence images + report attachments), **4 ayuda programs / 456 beneficiaries** (+ event photos & signed sheets), **120 fish catches**, **40 households**, **25 kanban tasks** (attachments), **30 notifications**, **15 edit requests**, **8 categories**, **2 ID templates**, **40 audit logs**, **20 renewals**, **3 import batches**, **2 ID-print batches**.
  - **Every sidebar menu confirmed populated** via a Playwright sweep of all 19 routes.
- **Fixed 2 issues found in verification:**
  - Portrait photos were saving a webpage instead of a real image → re-seeded from a reliable source **with image validation**; all 500 now render as real JPEGs.
  - The **Notifications page was an empty stub** → built it into a real notifications list (mark-as-read / mark-all). Now shows content.
- **Re-verified live** on the rebuilt dev container: fisherfolk photo+signature render, notifications list shows 16 items, vessel photo renders, 0 console errors.

🔑 **Demo logins** (local dev, tenant "Calapan City"): `admin@demo.com` (tenant_admin) · `demo-super@calapan-demo.local` (superadmin — needed to view Audit Log & User Management, which are correctly role-gated) · password `DemoCalapan_LocalDev_2026`.

💬 **Notes / decisions**
- All demo work is **LOCAL only** on branch `feat/calapan-demo-seed`. Pushing this demo to the live demo site (`frms-demo.powerbyte.app`) is a deliberate deploy that **needs your explicit word** (recorded in `PENDING_DECISIONS.md`).
- Audit Log & User Management look blank under the `admin@demo.com` login — that's **correct RBAC** (superadmin-only); use the superadmin login to showcase them.
- Minor cosmetic: reused signatures are served with an `image/png` label but are JPEG bytes — they render fine; left as-is.

## 2026-08-14 — Public landing page + login moved to /admin

**In your words:** resume/merge the held branches, then build an awesome, stunning public landing page
promoting the app's features (using the shadcnstudio "Craft" template as the basis), move the staff login
off the front page to a manually-typed `/admin`, and credit Blue Alliance + Powerbyte in the footer.

✅ **Done**
- Merged the 3 held branches into `main` (2 CGC refactors + Traefik fix), **local only** — verified green (tsc + 59 tests).
- Built the public landing page at `/`: animated coastal-wave hero, live-counting stats, 8-module feature grid, tabbed screenshot gallery (your existing app screenshots), how-it-works, and a footer crediting **Blue Alliance** (logo from Marine-Guardian) + **Powerbyte IT Solutions**. Light + dark, full SEO.
- Moved staff sign-in to **`/admin`** (not shown on the public page); `/login` still works (redirects to `/admin`); the app stays behind auth exactly as before.
- Verified it live in your real dev container — **open `localhost:44387`** to click through it. Passed the full production build gate.

🔨 **Partial / parked**
- All of it sits on branch `feat/public-landing-page` (commit `6268bc5`), **local only** — you said leave it on the branch.

⏳ **Next / your call**
- Merge + push the landing branch, and/or push `main` (12 commits ahead, held). Both are owner-gated.
- Optional: make the public landing default to **light** (it currently opens dark, matching the app). Copy/section tweaks (testimonials, contact block, different screenshots).

💬 **Notes**
- The landing's sections fade in as you scroll — that's intentional; the first screen (hero) shows instantly.
- Login is used by *all* staff roles, not just the tenant manager — so `/admin` is the entry for everyone; `/login` bookmarks keep working via redirect.
