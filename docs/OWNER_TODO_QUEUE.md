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

- 🔴 **Profile tab — horizontal grouped layout (fix the empty right-half).** The Profile tab currently stacks every field vertically in one narrow column, leaving most of the panel width empty (see 2026-08-21 screenshot). Re-lay it out horizontally, grouped by related data:
  - **Row 1 (name group):** Last Name · First Name · Middle Name · **Suffix** (suffix at the end).
  - **Row 2 (core identity/contact):** Date of Birth · Sex · Address (Barangay) · Contact Number.
  - **Row 3 (other / less-important details):** the remaining fields (Civil Status, Date Joined, Registration Year, Renewal Status, Remarks, Household, ID Release Status).
  - **[HOW] hint:** the existing `DefinitionGrid columns={2|3}` primitive in `apps/web/src/components/shared/detail-field.tsx` already does responsive multi-column — use it instead of the vertical `FieldRail` stacking. File: `apps/web/src/app/[tenant]/fisherfolk/[id]/fisherfolk-detail-client.tsx` (Profile TabsContent). Responsive: collapse to fewer columns on narrow screens.
  - **General principle (owner-set 2026-08-21):** before stacking fields vertically, ASSESS the space — if vertical layout leaves too much empty space / gaps, arrange horizontally and group by related data. Applies to any detail/profile layout, not just this one.

### ↗️ Cross-seat (tracked here, executed from another folder — mirror of PENDING_DECISIONS.md)
- 🔴 **AIEF framework standard merge** — merge `feat/v32.50-site-access-standard` → main + push, from the **Powerbyte-AIEF** seat (not this folder). FRMS is the shipped reference implementation.
- 🔴 **Phase 2 — per-app adoption** of the Site Access & Tenancy Standard in **Marine-Guardian / Orqafy / FerryBook**, each from its own seat.

## 💡 Optional / low-priority (previously noted, not gating)
- Clean non-slug `href`s that cause a 308 on click (landing/nav) — cosmetic.
- Use real barangay names in the demo seed (currently generic).
- Prisma 6→7 major upgrade available (informational; flagged during v0.16.0 migrate — not acted on).

---

## ✅ Recently done (trace — 2026-08-20, shipped v0.16.0)
- **Fisherfolk detail relayout** — left rail = Photo/Signature/QR + ID/RSBSA/Status; all other fields → new default **Profile** tab; Photo/Signature/QR **click-to-zoom**. (`b7b4870`) — live prod+demo.
- **Patrol QR (1.b)** — kept v1 payload (owner); already scannable `{id,regNo,tenantId}`, decoder ready. No change.
- **Map menu (2)** — explained (barangay density map; all toggles live).
- **Demo category alignment** — demo's 8 invented categories → calapan-city's 6 official; 500 records random-reassigned to measured calapan-city proportions; applied live to frms-demo (reseed-never, backup taken). (`9b77d27`)
- **v0.16.0** released + promoted to prod + demo; dev rebuilt FRESH.
