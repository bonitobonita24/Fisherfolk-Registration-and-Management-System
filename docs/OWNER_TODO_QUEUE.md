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

- 🔴 **🏗️ BIG — Full UX/UI redesign adopting the Cargorix template (like Marine-Guardian).** Redesign the ENTIRE app's UX/UI using `_tempfiles/shadcn-nextjs-cargorix-app-template-1.0.0.zip` (shadcn + Next.js Cargorix template), the same adoption MG did (ref MG memory `project_cargorix_theme_3pane_0819`).
  - **Step 1 (MANDATORY FIRST): analyze the whole template** — unzip + study its structure, app-shell, theme tokens, component set, layout archetypes — and produce an **adoption plan** for how to FULLY adopt it onto our CURRENT design layout (INHERIT-not-REPLACE: keep our tRPC/Prisma/Auth.js/data layer; adopt the UI shell/theme/components).
  - **Retain our current ACCENT color** — orange / tangerine — through the reskin (map it into the template's theme tokens; don't inherit the template's accent).
  - **This is a MAJOR multi-phase task** → **summon Architect-agent orchestration to plan + brainstorm FIRST** (PM → Architect(s) → scoped worker waves), per plan-first-dispatch. Do NOT dive into edits inline. Produce a written adoption plan for owner review before any build.
  - Owner-set 2026-08-21. HARD HOLD — plan first, build in waves, nothing ships without owner word.

### ↗️ Cross-seat (tracked here, executed from another folder — mirror of PENDING_DECISIONS.md)
- 🔴 **AIEF framework standard merge** — merge `feat/v32.50-site-access-standard` → main + push, from the **Powerbyte-AIEF** seat (not this folder). FRMS is the shipped reference implementation.
- 🔴 **Phase 2 — per-app adoption** of the Site Access & Tenancy Standard in **Marine-Guardian / Orqafy / FerryBook**, each from its own seat.

## 💡 Optional / low-priority (previously noted, not gating)
- Clean non-slug `href`s that cause a 308 on click (landing/nav) — cosmetic.
- Use real barangay names in the demo seed (currently generic).
- Prisma 6→7 major upgrade available (informational; flagged during v0.16.0 migrate — not acted on).

---

## ✅ Recently done (trace)
- **2026-08-21 — Profile tab horizontal grouped layout** (`feat/profile-tab-horizontal-layout` → merged main). Name / identity+contact / other-details bands via responsive `DefinitionGrid`. Owner: "absolutely perfect." **Promoted this into a FLEET design principle** → `~/.claude/library/design-defaults.md` **Entry 6** (horizontal grouped grid on PC/tablet, vertical only on mobile). NOT yet deployed to prod/demo (awaiting owner word).

## ✅ Recently done (trace — 2026-08-20, shipped v0.16.0)
- **Fisherfolk detail relayout** — left rail = Photo/Signature/QR + ID/RSBSA/Status; all other fields → new default **Profile** tab; Photo/Signature/QR **click-to-zoom**. (`b7b4870`) — live prod+demo.
- **Patrol QR (1.b)** — kept v1 payload (owner); already scannable `{id,regNo,tenantId}`, decoder ready. No change.
- **Map menu (2)** — explained (barangay density map; all toggles live).
- **Demo category alignment** — demo's 8 invented categories → calapan-city's 6 official; 500 records random-reassigned to measured calapan-city proportions; applied live to frms-demo (reseed-never, backup taken). (`9b77d27`)
- **v0.16.0** released + promoted to prod + demo; dev rebuilt FRESH.
