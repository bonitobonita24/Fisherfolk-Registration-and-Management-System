# AdminCN Full-Site Adoption Plan — FRMS

> **Status: PLAN AWAITING OWNER APPROVAL. No UI build has started.**
> Produced 2026-08-07 (full-auto) per the owner directive to plan AdminCN adoption across all of FRMS.
> Scope: **UI / design layer ONLY** — keep tRPC + Prisma + Auth.js v5 + RBAC + 5-state loading intact.
> Discipline: dev-first, LOCAL commits only, **HARD HOLD** (no push/staging/prod without explicit owner word).
> Governs against **Scenario 49** (now synced in at framework V32.45) + deliverable **#39 `admincn-starter.md`**.

---

## 0. TL;DR — this is a formalization, not a re-skin

FRMS already did most of AdminCN's visual direction by hand:

- **Token reskin is already in `main`** — `apps/web/src/app/globals.css` carries the header
  `"AdminCN Reskin — Teal/Orange accent, neutral dark surfaces (2026-07-04)"`: full shadcn HSL CSS-var
  tokens, **dark-default** (`next-themes`, `defaultTheme="dark"`), orange `--primary` + Deep-Sea-Teal
  `--accent` + navy `--secondary`, `new-york` style, per-tenant runtime `--primary` override.
- **Shell is already AdminCN-shaped** (conceptually) — a collapsible left sidebar (`w-56 ↔ w-14` rail) +
  `h-14` top header + scroll main + mobile `Sheet`, with **RBAC-driven nav filtering** baked in
  (`canSeeNavItem`). It is a *custom* implementation, not shadcn's `Sidebar` primitive.

So the delta to the official `starter/admincn/` slice is **small and mostly additive**. The plan adopts only
that delta. Effort estimate: **S–M** (matches the AIEF rollout tracker: FRMS = effort S–M, priority Medium).

---

## 1. Current state vs AdminCN starter — the gap-diff

| Dimension | FRMS now (`apps/web`) | AdminCN `starter/admincn/` | Delta |
|---|---|---|---|
| Theme mode | dark-default `next-themes` | dark/light `next-themes` | ✅ match |
| Tokens | hand-authored shadcn HSL CSS-vars in `globals.css` (orange/teal/navy) | 11 presets in `utils/theme-presets.ts` seeding CSS-vars | **Reconcile** — keep FRMS values (Rule 12), optionally adopt preset/customizer *infrastructure* |
| Tailwind palette | default palette **not** disabled | (starter zeroes/extends) | Minor — optional hardening |
| Style Dictionary | none | tokens are CSS-var contract only | Optional (framework Rule 31 prefers compiled tokens) |
| App-shell | **custom** `app-shell.tsx`+`sidebar.tsx`+`header.tsx`+`nav-items.ts` | shadcn `Sidebar` primitive + `default-layout` (`components/layout/*`, `configs/navConfig.tsx`) | **Decision point** (§3) — keep custom vs migrate |
| shadcn primitives | 26 in `components/ui/` | 50 (standard + extras) | **Add** missing: `sidebar`, `breadcrumb`, `skeleton`, `collapsible`, `border-beam`, `number-ticker`, `timeline`, `kanban`, `circular-progress`, … (only as views need them) |
| RBAC nav filter | `canSeeNavItem` in `nav-items.ts` | generic `navConfig` | **Preserve** FRMS's — must survive any shell change |
| Per-tenant theming | runtime `--primary` override on `#tenant-theme-root` | none | **Preserve** FRMS's |
| Pages/views | ~41 real `page.tsx`, wired to live tRPC/Prisma + RBAC | ~149 mock (`fake-db`) scaffolds | **Selective graft** (§4) — never wholesale replace |

**Already matches (KEEP, do not touch):** dark-default setup, the whole token system, `tailwind.config.ts`
token mapping, `new-york`/`slate`, the 26 primitives, the RBAC nav filter, per-tenant override, and all 41
real tRPC-wired pages.

---

## 2. INHERIT-not-REPLACE contract (non-negotiable, from Scenario 49 + #39)

- KEEP real **tRPC + Prisma + Auth.js v5**. **Never** import AdminCN's `fake-db` / `zustand`(for data) / `nuqs`.
- **Rule 12:** FRMS's `docs/tokens.json` / `globals.css` values win **every** token-VALUE conflict. AdminCN
  supplies *structure*, not values.
- **RBAC preserved** — `hasPermission` + tenant-scoping on every query/mutation (Rule 34). The AdminCN
  `permissions/roles/users` scaffolds are a UI *reference*, not a data-layer.
- **5-state loading preserved** — loading / empty / error / partial / success on every grafted view
  (AdminCN scaffolds render success-state only).
- **shadcn/ui stays the only component system.**
- **Zustand** only for client-ephemeral UI state (theme, sidebar open/closed); **drop `nuqs`**.
- Divergent deps (`three`, `xlsx`, `papaparse`) only if a `docs/PRODUCT.md` need calls for it.
- **License:** AdminCN is a paid, no-redistribution template — the vendored slice stays private; do not
  publish it. (Provenance in `starter/admincn/PROVENANCE.md`.)

### The `fake-db` → tRPC/Prisma graft (per adopted view)
1. Identify the view's mock import + data shape → 2. Map to a Prisma model + Zod-validated tRPC router
(reuse `packages/shared`) → 3. Replace mock fetch with tRPC (`createCaller` server / `useQuery`·`useMutation`
client) → 4. Wire the 5 states → 5. Enforce tenant-scope + RBAC → 6. Zustand only for ephemeral UI; no `nuqs`.

---

## 3. ⚖️ Open decisions for the owner (these shape scope — I recommend, you decide)

> These are `[WHAT]` scope calls. My recommendations favor the "low-delta, don't-rebuild-what-works" reading
> of the directive. **No build starts until you pick.**

**D1 — App-shell: keep FRMS's custom shell, or migrate to the shadcn `Sidebar` default-layout?**
- **Recommend: KEEP the custom shell**, reconcile cosmetics only. It's already AdminCN-shaped, has RBAC nav
  filtering + per-tenant theming baked in, and works. Migrating to the shadcn `Sidebar` primitive is a
  big-bang structural swap (touches every authenticated route) for little user-visible gain, and risks the
  RBAC/tenant wiring. *Trade-off:* the fleet-default is technically the shadcn `default-layout` shell, so
  "keep custom" is a deliberate, logged divergence (`spec-divergent` note in DECISIONS_LOG).
- Alternative: full migration to shadcn `Sidebar` (adds `ui/sidebar.tsx` + `SidebarProvider`, ports
  `nav-items.ts`→`navConfig`, re-implements RBAC filter + collapse + tenant theming). Effort **L**, higher risk.

**D2 — Theme: keep the single fixed FRMS brand theme, or adopt the 11-preset `ThemeCustomizer`?**
- **Recommend: KEEP the fixed orange/teal/navy brand + per-tenant override** (this is a gov/LGU single-brand
  app — a public theme-switcher adds little). Optionally add the `ThemeCustomizer` as an **admin-only** nicety.
  Either way, FRMS token *values* win (Rule 12); AdminCN presets only seed structure.

**D3 — View-adoption scope: which screens get reskinned to AdminCN scaffolds?**
- **Recommend a prioritized subset**, not all 41. Highest value first (each = a graft per §2):
  1. **RBAC admin** — `user-management`, `settings/roles` (AdminCN `views/apps/{users,roles,permissions}` is
     the strongest scaffold set; maps cleanly to FRMS's existing role-builder).
  2. **Dashboard widgets/stat-cards** — adopt AdminCN `number-ticker`/`circular-progress`/widget patterns over
     the existing real dashboard data.
  3. **`settings` / user profile** — AdminCN `user-settings` tabs.
  4. **`kanban` / `todo`** — AdminCN `kanban` + `timeline` components.
  - Everything else keeps its current (already-reskinned) look unless you flag it.

**D4 — Ordering vs in-flight work.** The `swarm/admincn-reskin` + `swarm/dashboard-redesign` branches and the
annual-reset UI fast-follow still stand. **Recommend:** fold this plan into them (don't duplicate); land the
component-reconciliation (§Phase A) first as it's a dependency for the rest. Confirm ordering before dispatch.

---

## 4. Proposed execution phases (after approval — PLAN-FIRST, PM+Architect, LOCAL/HARD HOLD)

Each phase is dev-verified before the next; each is its own `feat/*` branch; all commits LOCAL.

- **Phase A — Component reconciliation (additive, low-risk).** Diff `components/ui/` (26) vs AdminCN (50); add
  ONLY the primitives the approved roadmap needs (`skeleton`, `breadcrumb`, `collapsible`, + any AdminCN
  extras for adopted views; `sidebar` primitive only if D1=migrate). Never duplicate an existing component.
- **Phase B — Theme reconciliation.** Fold the chosen preset's *structure* into FRMS's token pipeline (values
  unchanged, Rule 12). Optionally: disable Tailwind default palette; add `ThemeCustomizer` (if D2). Optionally:
  introduce Style Dictionary compile if we want Rule-31 compiled-token gating (bigger, can defer).
- **Phase C — Shell (only if D1=migrate).** Incremental strangler migration to shadcn `Sidebar`, one region at
  a time, RBAC + tenant theming preserved at every step. *(Skipped if D1=keep.)*
- **Phase D — Per-screen view adoption.** For each screen in the D3 subset: run the §2 graft (fake-db→tRPC,
  5-state, RBAC). One screen = one branch = one verify.
- **Phase E — Baseline + gates + close.** Update `docs/DESIGN.md` + `docs/MOCKUP.jsx` + refresh the
  `design:fidelity` baseline (Rule 31, this is an intentional design change); run **verify-all-pages** (no
  regression), **`lint-design.sh`** on FRMS-authored screens (vendored-slice findings D5/P1c/P1d/P1e are
  expected, do NOT fix), **axe WCAG 2.2 AA** (gov hard-gate, Rule 33). Back-port to `docs/DECISIONS_LOG.md` +
  `docs/CHANGELOG_AI.md` (Rule 15). Commit LOCAL. **HARD HOLD** — no push/deploy.

---

## 5. Prerequisite status

- ✅ **Framework sync V32.28 → V32.45 done** (this session, full-auto) — `chore/framework-sync-v32-45`
  @ `8cdd5da`, governance-only, LOCAL. Scenario 49 + `admincn-starter.md` (#39) + `starter/admincn/`
  (222-file slice) are present. Stale contaminated `chore/framework-sync-v32-31` branch force-deleted.
- ⏳ **This plan** — awaiting owner approval of D1–D4 before any Phase A–E build.

---

## 6. Verification bar (Scenario 49, applied at Phase E)

- No AdminCN `fake-db`/`zustand`(data)/`nuqs` import remains in any adopted render path.
- `docs/tokens.json` stays the single token source; preset values compiled through the pipeline, not pasted.
- Every existing user flow passes **verify-all-pages** (blast-radius: the reskin regresses nothing).
- `design:fidelity` baseline + `docs/DESIGN.md`/`MOCKUP.jsx` updated (Rule 31); decision logged.
- `lint-design.sh` clean on FRMS-authored screens; **axe WCAG 2.2 AA** green (gov, Rule 33).
- DECISIONS_LOG + CHANGELOG_AI updated; commit LOCAL only.
