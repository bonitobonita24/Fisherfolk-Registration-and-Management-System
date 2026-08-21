# FRMS — Owner Todo Queue (interim, until Squirlnote launches)

> **What this is:** the running capture point for the owner's todo items — the temporary
> todo listing used **until the Squirlnote app is launched** (mirrors the Marine-Guardian
> `docs/UI_TWEAKS_QUEUE.md` pattern). Append every new owner ask here immediately so nothing
> gets lost. Separate from `PENDING_DECISIONS.md` (formal `[WHAT]` gates) — this is the
> friendlier running list.
>
> **⚠ KNOWN-INCOMPLETE** — the owner has more verbal asks still to dictate; capture them as given.
>
> **On resume:** read this file for the owner's running todo. Once Squirlnote launches, migrate
> these into it and retire this file.

Legend: 🔴 not started · 🟡 partial · ✅ done (kept briefly for trace) · ⛔ blocked · ↗️ cross-seat

---

## 🔴 Open

- 🟡 **🏗️ BIG — Full UX/UI redesign adopting the Cargorix template (like Marine-Guardian).** PLANNING DONE; paused before Wave 0.
  - ✅ **Step 1 DONE (2026-08-21): analysis + adoption plan.** Architect orchestration (PM → 2 scout architects → Plan synthesis) → **`docs/CARGORIX_ADOPTION_PLAN.md`**. Verdict: Cargorix = design-language donor, NOT component donor (`@base-ui` vs Radix + Tailwind v4/oklch vs v3/HSL) → **Path A** reskin on FRMS's existing Radix primitives, 6 waves.
  - ✅ **Decisions locked** (`docs/DECISIONS_LOG.md`): Tailwind **v3** · keep **Manrope** · **prioritized modules first** · Wave-4 extras = **all 3** (⌘K, theme customizer tenant-admin-scoped, density toggle) · **defer** draft-first create flow. RETAIN orange/tangerine + per-tenant override + RBAC nav + DefinitionGrid (non-negotiable each wave).
  - 🔴 **NEXT (awaiting owner "go"): Wave 0 spike** — token remap to tangerine + oklch→HSL on ONE list + ONE detail page + prove per-tenant override → before/after screenshots for review. Then Waves 1–5.
  - Branch `docs/cargorix-adoption-plan` (LOCAL / HARD HOLD, no app code touched). Owner-set 2026-08-21.

### ↗️ Cross-seat (tracked here, executed from another folder — mirror of PENDING_DECISIONS.md)
- 🔴 **AIEF framework standard merge** — merge `feat/v32.50-site-access-standard` → main + push, from the **Powerbyte-AIEF** seat (not this folder). FRMS is the shipped reference implementation.
- 🔴 **Phase 2 — per-app adoption** of the Site Access & Tenancy Standard in **Marine-Guardian / Orqafy / FerryBook**, each from its own seat.

## 💡 Optional / low-priority (previously noted, not gating)
- Clean non-slug `href`s that cause a 308 on click (landing/nav) — cosmetic.
- Use real barangay names in the demo seed (currently generic).
- Prisma 6→7 major upgrade available (informational; flagged during v0.16.0 migrate — not acted on).

---

## ✅ Recently done (trace)
- **2026-08-21 — Profile tab horizontal grouped layout SHIPPED to prod + demo as v0.17.0** (`feat/profile-tab-horizontal-layout` → merged main). Name / identity+contact / other-details bands via responsive `DefinitionGrid`. Owner: "absolutely perfect." **Promoted this into a FLEET design principle** → `~/.claude/library/design-defaults.md` **Entry 6** (horizontal grouped grid on PC/tablet, vertical only on mobile). **Released v0.17.0** (`4e99d62`, tag pushed, `main==origin`); CI built `sha-4e99d62`; **promoted prod + demo** (backups taken, no pending migrations, reseed-never) — both healthy (`/api/health` 200 after boot; `/`, `/login`, `/demo` all up). Real users now see the new layout.

## ✅ Recently done (trace — 2026-08-20, shipped v0.16.0)
- **Fisherfolk detail relayout** — left rail = Photo/Signature/QR + ID/RSBSA/Status; all other fields → new default **Profile** tab; Photo/Signature/QR **click-to-zoom**. (`b7b4870`) — live prod+demo.
- **Patrol QR (1.b)** — kept v1 payload (owner); already scannable `{id,regNo,tenantId}`, decoder ready. No change.
- **Map menu (2)** — explained (barangay density map; all toggles live).
- **Demo category alignment** — demo's 8 invented categories → calapan-city's 6 official; 500 records random-reassigned to measured calapan-city proportions; applied live to frms-demo (reseed-never, backup taken). (`9b77d27`)
- **v0.16.0** released + promoted to prod + demo; dev rebuilt FRESH.
