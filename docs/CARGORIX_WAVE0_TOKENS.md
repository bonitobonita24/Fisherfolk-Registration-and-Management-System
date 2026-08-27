# Cargorix Adoption — Wave 0 Spike: Finalized Token Table & Conversion

> Branch `feat/cargorix-wave-0-spike`. Companion: `docs/CARGORIX_ADOPTION_PLAN.md` (§4 token remap, §2 Tailwind decision).
> **Path A1 confirmed** (stay Tailwind v3, translate the look into FRMS HSL tokens). HARD HOLD — LOCAL only.

## 1. What Wave 0 proves
Wave 0 is the decision-locking spike: make the risky token/build decisions cheap before the app-wide waves.

| Done-criterion (plan §5 Wave 0) | Result |
|---|---|
| oklch→HSL conversion script produced | ✅ `scripts/cargorix/oklch-to-hsl.mjs` (OKLCH→OKLab→linear sRGB→HSL; sanity-checked) |
| Finalized token table | ✅ this doc (§3), all pairs AA-verified |
| Orange/tangerine preserved | ✅ `--primary`/`--ring`/`--secondary` untouched; still `25 95% 53%` |
| Per-tenant override still wins over globals fallback | ✅ `#tenant-theme-root` inline override flips Register orange→purple post-remap (screenshot proof) |
| axe clean (no regression) on PoC page | ✅ 20→20 pre-existing color-contrast findings, **zero introduced**; 0 console errors |
| Tailwind v3-vs-v4 decision signed off | ✅ A1 (v3) locked in DECISIONS_LOG; no v4 migration coupled to reskin |

## 2. Conversion tool
`scripts/cargorix/oklch-to-hsl.mjs` converts the donor's Tailwind-v4 `oklch()` values to FRMS's
bare HSL triplets (consumed as `hsl(var(--x))`). Sanity checks: `oklch(1 0 0)` → `0 0% 100%`;
Cargorix cool-neutral surfaces resolve to blue-tinted grays (hue ~191–200), confirming the donor's
neutral character. Run: `node scripts/cargorix/oklch-to-hsl.mjs` (full set) or `… <L> <C> <H>` (one value).

**Key finding:** Cargorix's green *identity* tokens are discarded (overwritten with FRMS orange per §4);
the converter's real job is (a) proving the math and (b) translating any neutral/surface values we later
borrow in Wave 1. Cargorix's `--accent` is a near-neutral whisper-tint (oklch L0.972 / chroma 0.014) — so
a faithful orange accent is a *pale* warm wash by design, not a bold fill. The bold tangerine comes from
`--primary` (already orange in FRMS) and, in Wave 2, from the newly-added `--sidebar-primary`.

## 3. Finalized Wave-0 token set (applied to `apps/web/src/app/globals.css`)
Only `--accent`(+fg) changed value; three sidebar tokens were **added** (FRMS was missing them) and wired
in `tailwind.config.ts`. Everything else (surfaces, primary, secondary, charts, radius `0.45rem`) unchanged.

| Token | Light (`:root`) | Dark (`.dark`) | Note |
|---|---|---|---|
| `--accent` | `25 100% 95.5%` | `25 22% 15%` | was neutral gray → warm orange wash (mirrors Cargorix L) |
| `--accent-foreground` | `25 45% 16%` | `25 30% 91%` | warm pair |
| `--sidebar-primary` | `25 95% 53%` | `25 95% 53%` | NEW — orange active-nav identity (consumed in Wave 2) |
| `--sidebar-primary-foreground` | `29 79% 6%` | `29 79% 6%` | NEW |
| `--sidebar-ring` | `20 100% 47%` | `20 100% 47%` | NEW — matches app `--ring` |

### AA contrast (WCAG 2.2 AA gate — gov/LGU) — all PASS
| Pair | Ratio |
|---|---|
| Light accent vs accent-foreground | 12.95 |
| Light accent vs foreground | 11.48 |
| Dark accent vs accent-foreground | 12.26 |
| Dark accent vs foreground | 12.59 |
| primary vs primary-foreground | 6.76 |
| sidebar-primary vs sidebar-primary-foreground | 6.76 |

## 4. Files touched (spike)
- `apps/web/src/app/globals.css` — accent remap + 3 sidebar tokens (both `:root` and `.dark`)
- `apps/web/tailwind.config.ts` — map `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-ring`
- `scripts/cargorix/oklch-to-hsl.mjs` — conversion tool (new)
- Data layer (tRPC/Prisma/Auth/RBAC): **zero changes** (verified by git diff)

## 5. Verification evidence
- Dev rebuilt from source (Rule 39 — FRMS dev builds an image, **no bind-mount / no HMR**; host edits require a rebuild). App healthy on the Wave-0 build.
- Screenshots (scratchpad, light+dark): before/after list + detail; `proof-accent-dropdown` (warm highlight); `proof-tenant-orange`→`proof-tenant-purple` (override still wins).
- DefinitionGrid (Profile tab, design-defaults Entry 6) renders unchanged — structure frozen, only tokens shift.

## 6. Honest note for the owner
The Wave-0 change is **intentionally subtle in static views**: `--accent` only paints on hover/selected/open
states, and `--sidebar-primary` isn't consumed until the Wave-2 shell restyle. The visible tangerine you'll
see land is Waves 2 (active nav → orange) and 3 (shared wrappers). If a *more assertive* accent than
Cargorix's donor whisper-tint is wanted, that's a one-line token value tweak — a taste `[WHAT]` for you.
