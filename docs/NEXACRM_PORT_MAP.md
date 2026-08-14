# NexaCRM → FRMS Design-Port Map

**Status:** Brief only — no app code changed yet.
**Contract:** INHERIT-not-REPLACE. FRMS keeps Next.js 15 + Tailwind **v3.4** + tRPC/Prisma/Auth.js, its own
app-shell architecture (`app-shell.tsx` / `sidebar.tsx` / `header.tsx`), its per-tenant runtime HSL accent
mechanism, and the SidebarFooter version + Powerbyte credit. We port only the **look** of the NexaCRM
template (shadcn/Next.js template, Tailwind v4 + oklch, extracted at
`/tmp/claude-1000/-home-me-UbuntuDevFiles-FMO-CalapanCity-Fisherfolk-Registration-and-Management-System/f5d482e4-5daa-4524-8c63-a77d996ed223/scratchpad/nexacrm/shadcn-nextjs-nexacrm-app-template-1.0.0`).
This document is self-sufficient: a fresh worker can execute Wave 0 + Wave 1 without reopening the template.

**Rule-31 note (Design-as-Contract):** this reskin is an *intentional design change*. Per Rule 31 R6 it
requires a re-approved mockup/baseline and `design:fidelity --update-baseline` + committed new Playwright
visual baselines at the end of each wave — plan that into every wave's done-criteria.

---

## 1. TOKEN MAP

### 1.1 Source → target value table

NexaCRM authors tokens in **oklch** inside a Tailwind-v4 `@theme inline` block. FRMS consumes
**bare HSL triplets** via `hsl(var(--x))` in `tailwind.config.ts`. All values below are already converted
oklch→sRGB→HSL (rounded to 1 decimal). Keep the **triplet format** — several consumers
(`--chart-N` in the barangay density map + Recharts, lesson `--chart-N are HSL triplets`) rely on it.

**New FRMS `:root` (light) — replaces the current block in `apps/web/src/app/globals.css`:**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 20%;              /* was 0 0% 4% — NexaCRM uses soft near-black */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 20%;
  --primary: 25 95% 53%;               /* KEEP — tenant-overridden fallback (FRMS orange) */
  --primary-foreground: 29 79% 6%;     /* KEEP — tenant-overridden fallback */
  --secondary: 214 52% 25%;            /* KEEP — tenant-overridden fallback */
  --secondary-foreground: 0 0% 100%;   /* KEEP — tenant-overridden fallback */
  --muted: 0 0% 94.5%;
  --muted-foreground: 0 0% 40%;
  --accent: 0 0% 94.5%;                /* CHANGED ROLE: was teal identity; now neutral hover wash (NexaCRM) */
  --accent-foreground: 0 0% 20%;
  --destructive: 358 75% 59%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 92.2%;
  --input: 0 0% 92.2%;
  --ring: 20 100% 47%;                 /* KEEP — tenant-overridden fallback */
  --radius: 0.45rem;                   /* was 0.625rem */
  --chart-1: 226 70% 55.5%;            /* NexaCRM blue   (brand)   */
  --chart-2: 173 80% 35.8%;            /* NexaCRM teal             */
  --chart-3: 23 93% 52.5%;             /* NexaCRM orange           */
  --chart-4: 272 51% 54.1%;            /* NexaCRM purple           */
  --chart-5: 322 65% 54.5%;            /* NexaCRM pink             */
  /* NEW: sidebar token family (NexaCRM surface model) */
  --sidebar: 0 0% 97.6%;
  --sidebar-foreground: 0 0% 20%;
  --sidebar-accent: 0 0% 94.5%;
  --sidebar-accent-foreground: 0 0% 20%;
  --sidebar-border: 0 0% 92.2%;
  /* RETIRED: --nav-active-bg / --nav-active-fg (teal fill) — replaced by the
     NexaCRM foreground-wash recipe (§2.2). Delete both from :root and .dark
     after sidebar.tsx no longer references them (grep first). */
}
```

**New FRMS `.dark`:**

```css
.dark {
  --background: 0 0% 9%;               /* was 4% — NexaCRM dark is softer */
  --foreground: 0 0% 92.2%;
  --card: 0 0% 9%;                     /* NexaCRM: card == background in dark; borders separate */
  --card-foreground: 0 0% 92.2%;
  --popover: 0 0% 11.4%;
  --popover-foreground: 0 0% 92.2%;
  --primary: 25 95% 53%;               /* KEEP — tenant fallback */
  --primary-foreground: 29 79% 6%;     /* KEEP */
  --secondary: 0 0% 15%;               /* KEEP — tenant fallback */
  --secondary-foreground: 0 0% 98%;    /* KEEP */
  --muted: 0 0% 19.2%;
  --muted-foreground: 0 0% 70.2%;
  --accent: 0 0% 16.1%;
  --accent-foreground: 0 0% 92.2%;
  --destructive: 358 75% 59%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 13.3%;
  --input: 0 0% 19.8%;
  --ring: 20 100% 47%;                 /* KEEP — tenant fallback */
  --chart-1: 227 73% 61.2%;            /* dark chart-1 is lighter blue */
  --chart-2: 173 80% 35.8%;
  --chart-3: 23 93% 52.5%;
  --chart-4: 272 51% 54.1%;
  --chart-5: 322 65% 54.5%;
  --sidebar: 0 0% 9.8%;
  --sidebar-foreground: 0 0% 92.2%;
  --sidebar-accent: 0 0% 16.1%;
  --sidebar-accent-foreground: 0 0% 92.2%;
  --sidebar-border: 0 0% 13.3%;
}
```

### 1.2 What changes vs. what stays (tenant accent mechanism)

The tenant theming mechanism is **runtime inline styles** set in
`apps/web/src/app/[tenant]/layout.tsx` on `<div id="tenant-theme-root">`, overriding exactly:
`--primary`, `--primary-foreground`, `--ring`, `--secondary`, `--secondary-foreground`
(HSL triplets from `tenant.primaryColor/secondaryColor` via `hexToHslTriplet()` /
`readableForeground()` in `src/lib/theme/color.ts`; editor at
`src/app/[tenant]/settings/theme-settings.tsx`).

| Token | Action | Why |
|---|---|---|
| `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--ring` | **STAY (values + mechanism untouched)** | Tenant-owned at runtime. NexaCRM's neutral near-black primary is NOT ported — FRMS's brand color IS the tenant primary. |
| `--brand` (NexaCRM's fixed blue) | **NOT ported as a new var.** Everywhere the template uses `bg-brand/10 text-brand` (its `ACCENT_SURFACE`), write `bg-primary/10 text-primary`; `ACCENT_BUTTON` → `bg-primary text-primary-foreground hover:bg-primary/80`. | Keeps accent surfaces tenant-aware — FRMS already uses this exact idiom (sidebar logo chip, stat-card icon chip). |
| `--background/foreground/card/popover/muted/accent/border/input` | **CHANGE** to NexaCRM values above | The neutral surface system is the core of the template look. |
| `--accent` | **CHANGE + role change** — teal identity → neutral hover wash | NexaCRM uses `accent` strictly as hover surface; FRMS teal identity moves out of the token (see risks §5.2). |
| `--chart-1..5` | **CHANGE** to NexaCRM palette (triplets) | Template chart look. Consumers already use `hsl(var(--chart-N))` — no consumer edits needed. |
| `--radius` | **CHANGE** 0.625rem → **0.45rem** | NexaCRM signature tighter radius. |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border` | **NEW** | Sidebar gets its own surface (off-white 97.6% light / 9.8% dark) distinct from `card`. |
| `--nav-active-bg`, `--nav-active-fg` | **RETIRE** (after §2.2 lands) | Replaced by foreground-wash active state. |

### 1.3 `tailwind.config.ts` delta (`apps/web/tailwind.config.ts`)

```ts
// ADD inside theme.extend.colors:
sidebar: {
  DEFAULT: "hsl(var(--sidebar))",
  foreground: "hsl(var(--sidebar-foreground))",
  accent: "hsl(var(--sidebar-accent))",
  "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
  border: "hsl(var(--sidebar-border))",
},
// CHANGE fontFamily:
fontFamily: {
  sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
},
```

Font: NexaCRM uses **Manrope** (`next/font/google`, variable `--font-manrope`) as both sans and heading,
Geist Mono for mono. FRMS root layout (`src/app/layout.tsx`) currently loads Inter as `--font-inter`.
Swap: `import { Manrope } from "next/font/google"; const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })`
and put `manrope.variable` on `<html>`. (Do NOT port the template's `[data-theme-scale]` font-scale system
or its `--radius-sm..4xl` calc ladder — v4-only ergonomics, out of scope.)

Radius shorthands: FRMS's existing shadcn config presumably maps `rounded-lg → var(--radius)` etc.; the
single `--radius: 0.45rem` change propagates. NexaCRM's derived scale for reference only:
`sm = radius*0.6`, `md = radius*0.8`, `lg = radius`, `xl = radius*1.4`.

---

## 2. SHELL DELTA

FRMS shell = 3 files, all custom (NOT shadcn `ui/sidebar`): `src/components/app-shell.tsx` (69 lines),
`src/components/sidebar.tsx` (202), `src/components/header.tsx` (166). NexaCRM uses shadcn `ui/sidebar`
(16rem / 3rem icon rail) — **do not adopt that architecture**; restyle FRMS's own files to match the look.

### 2.1 `src/components/app-shell.tsx`

Current: `flex h-full w-full overflow-hidden`; desktop sidebar wrapper
`hidden shrink-0 border-r border-border md:flex` + `w-14`/`w-56`; main
`flex-1 overflow-y-auto bg-background p-3 md:p-4`; header above main.

NexaCRM look (its AppShell): sidebar sits directly on the page; the **content column is a framed box** —
`md:border xl:rounded-tl-3xl` — holding header + scroll area; content padding `px-4 pb-4`
(no top padding — list pages start with a sticky bar flush at top).

Edits:
1. Root div: keep `flex h-full w-full overflow-hidden`.
2. Desktop sidebar wrapper: `hidden shrink-0 md:flex` + widths `w-64` (expanded, = template 16rem) /
   `w-14` (keep FRMS rail — template icon rail is 3rem ≈ w-12; w-14 fine). **Remove `border-r border-border`**
   (border moves to the content box; sidebar's own bg makes the seam).
3. Main column div: `flex flex-1 flex-col overflow-hidden` → add the frame:
   `bg-background md:border md:border-border xl:rounded-tl-3xl`. (Template also offers a "flush" variant
   `md:border-y md:border-r` — skip; ship the rounded framed variant, it's the signature.)
4. `<main>`: `flex-1 overflow-y-auto bg-background px-4 pb-4` — drop `p-3 md:p-4`, **no top padding**
   (pair with §3.6 PageHeader carrying `pt-4`).
5. Mobile Sheet: `w-64 p-0` to match new width; unchanged otherwise.

### 2.2 `src/components/sidebar.tsx`

Current: `<aside class="flex h-full w-full flex-col bg-card">`; logo chip `bg-primary/10 text-primary`;
group labels `px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground`;
nav item `relative flex items-center rounded-md text-sm transition-colors gap-2.5 px-2 py-1.5`, active =
`bg-[hsl(var(--nav-active-bg))] text-[hsl(var(--nav-active-fg))] font-medium` + a `before:` left bar in
`bg-primary`; idle = `text-muted-foreground hover:bg-accent hover:text-accent-foreground`.

NexaCRM recipe (`src/lib/sidebar-nav.ts` NAV_ITEM + `ui/sidebar` group label): sidebar on `--sidebar`
surface; **one wash for hover AND active; the text color carries the state**; idle text is demoted to
muted; no left indicator bar; group labels are small sentence-case (NOT uppercase).

Edits:
1. `<aside>`: `bg-card` → `bg-sidebar text-sidebar-foreground` (new tokens, §1.3).
2. Group label `<p>`: → `px-2 pb-1 pt-3 text-[0.6875rem] font-medium text-muted-foreground/70`
   (drop `uppercase tracking-wider`, 10px→11px).
3. `linkCn` (both branches keep `relative flex items-center rounded-md text-sm transition-colors` + the
   collapsed/expanded padding ternary), state classes become — Tailwind-v3 translation of the template's
   color-mix wash (FRMS vars are HSL triplets, so wrap in `hsl()`):
   ```
   idle:   "text-muted-foreground
            hover:bg-[color-mix(in_oklab,hsl(var(--foreground))_12%,transparent)]
            hover:text-sidebar-accent-foreground
            dark:hover:bg-[color-mix(in_oklab,hsl(var(--foreground))_5%,transparent)]"
   active: "bg-[color-mix(in_oklab,hsl(var(--foreground))_12%,transparent)]
            text-sidebar-accent-foreground font-medium
            dark:bg-[color-mix(in_oklab,hsl(var(--foreground))_5%,transparent)]"
   ```
   **Delete** the `before:*` left-bar classes and the `--nav-active-bg/fg` references. (`color-mix` in
   arbitrary values is plain CSS — works fine under Tailwind v3; underscores encode spaces.)
4. Nav badge idiom (if/when counts are added): `bg-primary/10 rounded-full px-1.5 font-normal text-[11px] tabular-nums`.
5. Logo chip: keep `bg-primary/10 text-primary` (already the ported ACCENT_SURFACE idiom); bump chip
   rounding `rounded-md` → `rounded-lg` for the NexaCRM chip look.
6. Section divider `mx-1 my-2 border-t border-border/50` → `border-sidebar-border/60`.
7. **FOOTER BLOCK — DO NOT RESTRUCTURE** (V32.26 gate): the
   `FRMS · {tenantSlug} · v{NEXT_PUBLIC_APP_VERSION}` line and the
   "Developed by Powerbyte IT Solutions" new-tab link (with its focus-visible ring classes) stay verbatim;
   only allowed tweak: `border-t border-border` → `border-t border-sidebar-border`.
8. Collapse-toggle buttons: `hover:bg-accent` → `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`.

### 2.3 `src/components/header.tsx`

Current: `flex h-14 items-center gap-2 border-b border-border bg-card px-3`; mobile menu btn; desktop
`PanelLeft` toggle; dashboard-only filter selects; right cluster NotificationBell / ThemeToggle / avatar menu.

NexaCRM (`layout/Header.tsx`): `bg-muted/40 flex h-12 shrink-0 items-center px-4` — **no bottom border**,
lighter and shorter; a thin vertical `Separator` after the sidebar trigger; left side shows the active nav
icon + label (breadcrumb `parent / record` on detail pages); right cluster separated by another vertical
Separator.

Edits (keep all FRMS behavior — filters, bell, theme toggle, avatar menu):
1. `<header>`: → `flex h-12 shrink-0 items-center gap-2 bg-muted/40 px-4` (drop `border-b border-border bg-card`).
2. After the desktop `PanelLeft` button insert
   `<Separator orientation="vertical" className="mr-1 h-5" />` (shadcn `ui/separator`, already in the app).
3. Optional (nice-to-have, not Wave-1-blocking): a left slot showing the active module icon + label in
   `text-sm font-medium` with `text-muted-foreground` parent link + `/` divider
   (`text-muted-foreground/40`) on detail routes — template's breadcrumb idiom.
4. Right cluster: keep `ml-auto flex items-center gap-1`; insert
   `<Separator orientation="vertical" className="mx-1 h-5" />` between the filters/bell group and the
   theme toggle if visual grouping is wanted.
5. Avatar: keep `h-8 w-8`; fallback gets `bg-primary/10 text-primary text-xs font-semibold`
   (template ACCENT_SURFACE → tenant-aware translation).

---

## 3. COMPONENT IDIOM (Tailwind-v3 recipes)

### 3.1 Card

Template cards are **py-5/px-6 with `gap-0`** and use header/content borders instead of uniform p-6.
FRMS keeps its shadcn `ui/card.tsx`; apply per-usage classNames (don't fork the primitive):
plain card → `<Card className="gap-0 py-5"><CardContent className="px-6"> …`.

### 3.2 Stat / KPI widget

Template `stat-card.tsx` recipe — restyle `src/components/shared/stat-card.tsx` (used app-wide) and
`src/app/[tenant]/dashboard/kpi-card.tsx` to this structure (icon chip + label on one row, big number
below — FRMS currently puts icon left of a value/label stack; restructure):

```tsx
<Card className="gap-0 py-5">
  <CardContent className="space-y-3 px-6">
    <div className="flex items-center gap-2.5">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg",
                          tone ?? "bg-primary/10 text-primary")}>
        <Icon className="size-[1.125rem]" />   {/* template size-4.5; v3.4 arbitrary */}
      </span>
      <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{label}</p>
    </div>
    {/* value — keep FRMS NumberTicker */}
    <p className="truncate text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
    {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
  </CardContent>
</Card>
```

`tone` = tinted Tailwind pair per metric, e.g. `bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400`
(template pattern; pick amber/teal/violet/rose pairs per KPI; default falls back to tenant
`bg-primary/10 text-primary`). Stat grid: `grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6`.

### 3.3 Chart container

Template `chart-card.tsx` — apply to dashboard tiles (`fisherfolk-group-tile.tsx`, `vessel-group-tile.tsx`,
`violations-group-tile.tsx`, analytics cards):

```tsx
<Card className="flex flex-col gap-0 overflow-hidden py-0">
  <CardHeader className="flex flex-row items-start justify-between gap-4 border-b px-6 py-5">
    <div className="min-w-0 space-y-1">
      <CardDescription className="text-sm font-medium">{title}</CardDescription>
      <CardTitle className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{metric}</CardTitle>
      <p className="truncate text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="shrink-0">{action /* e.g. a range Select, h-8 */}</div>
  </CardHeader>
  <CardContent className="flex min-h-64 flex-1 flex-col px-6 py-5">{chart}</CardContent>
</Card>
```

Recharts primitives (template `chart-primitives.tsx`, translated to FRMS's HSL vars):
- Grid: `<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />`
- Ticks: `tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}`, `tickLine={false}`,
  `axisLine={false}`, `tickMargin={8}`.
- Series colors: `hsl(var(--chart-1..5))` (unchanged mechanism, new palette from §1.1).
- Dashboard grid rows: `grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6`.

### 3.4 Data table

Restyle `src/components/shared/data-table.tsx` (single shared component — one edit reskins every list).
Template recipes (`data-table.tsx`, `data-table-header-cell.tsx`, `record-view-bar.tsx`):

- Header: `<TableHeader className="sticky top-0 z-20 bg-card">`; header row `hover:bg-transparent`.
- Header cell: `group/head relative border-r px-3 last:border-r-0` — **vertical column separators** are a
  signature of the template's grid look; label `text-xs font-medium text-muted-foreground`.
- Body cell: `border-r px-3 py-2 last:border-r-0 text-sm`.
- Clickable row: `hover:bg-accent cursor-pointer transition-colors`.
- Selected row (v3 translation of the template's color-mix pair):
  ```
  data-[state=selected]:bg-[color-mix(in_oklab,hsl(var(--foreground))_20%,transparent)]
  data-[state=selected]:hover:bg-[color-mix(in_oklab,hsl(var(--foreground))_30%,transparent)]
  dark:data-[state=selected]:bg-[color-mix(in_oklab,hsl(var(--foreground))_8%,transparent)]
  dark:data-[state=selected]:hover:bg-[color-mix(in_oklab,hsl(var(--foreground))_14%,transparent)]
  ```
- Empty state: single cell `h-56 text-center text-muted-foreground`.
- Loading: skeleton rows (`<Skeleton className="h-5 w-full" />` per cell), not a spinner.
- **View bar** (list-page toolbar; adapt FRMS's list toolbars — search + filters + action button):
  sticky wrapper `sticky top-0 z-30 -mx-4 bg-background`, inner
  `flex h-11 shrink-0 items-center gap-2 border-b px-4`; left = module icon
  (`size-4 text-muted-foreground`) + view name `text-sm font-medium` + count
  `text-sm tabular-nums text-muted-foreground`; right = `ghost` `size="sm"` dropdown triggers
  (Filter/Sort) + primary action. Filter search inputs inside dropdowns: `h-8 pl-8` with an absolute
  `size-4` SearchIcon.

### 3.5 Badge / status

- Record status: shadcn `<Badge variant="secondary">` (neutral) for lifecycle labels; `variant="outline"`
  + `text-[11px] tabular-nums` for counts (tab badges).
- Keep FRMS `status-badge.tsx` semantic colors for domain states (ACTIVE/EXPIRED/…) but flatten to the
  template's tinted-pair pattern: `bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400`
  (same shape as §3.2 tones) instead of solid fills, `rounded-full px-2 py-0.5 text-[11px] font-medium`.

### 3.6 Page header (non-list pages)

Template `page-header.tsx` — restyle `src/components/shared/page-header.tsx`:
wrapper `flex shrink-0 items-center gap-3 pt-4 pb-4` (the `pt-4` compensates for the shell's zero top
padding, §2.1); `<h1 className="truncate text-base font-semibold tracking-tight">`; sub-line
`text-xs text-muted-foreground` (record count as `tabular-nums`, render `-` while loading, never a wrong 0);
actions right: `ml-auto flex shrink-0 items-center gap-2`.

### 3.7 Record detail layout

Template person-detail idiom — apply to fisherfolk/vessel/violation/etc. `[id]` pages:
- Header strip: `flex shrink-0 items-center gap-3 border-b py-2` — ghost back-arrow button
  (`-ml-1 text-muted-foreground hover:text-foreground`), name `text-base font-semibold tracking-tight`,
  status `<Badge variant="secondary" className="shrink-0 max-sm:hidden">`, actions cluster right
  (`variant="outline" size="sm"` primary + icon buttons).
- Body: `grid xl:min-h-0 xl:flex-1 xl:grid-cols-[20rem_minmax(0,1fr)]` — **20rem left fields rail**
  (`xl:border-r`, ScrollArea, `xl:py-4 xl:pr-4`, field stack `space-y-4`, label `text-xs text-muted-foreground`
  / value `text-sm`) + main content right.
- Tabs across the main pane: `<TabsList className="h-10 w-full shrink-0 justify-start overflow-x-auto rounded-none border-b px-2 pb-1">`;
  triggers `shrink-0` with `size-3.5` icon + count `<Badge variant="outline" className="text-[11px] tabular-nums">`;
  `<TabsContent className="min-w-0 pt-4 pb-4 xl:px-4">`.

### 3.8 Forms

- Input heights: default `h-9`, compact `h-8`, large `h-10` (template's `.input-default/sm/lg`); apply via
  className, don't add global CSS classes.
- Keep FRMS `form-section.tsx`/`form-actions.tsx` structure; restyle section cards per §3.1 and titles to
  `text-sm font-medium` with `text-xs text-muted-foreground` descriptions.
- Selects/dropdown content widths: `w-52`–`w-60` as in template menus.

---

## 4. SCREEN WAVE PLAN

All paths under `apps/web/`. Each wave = its own `feat/nexacrm-wave-N-*` branch; done-criteria per wave:
`pnpm tsc` + `next build` + lint green, `bash scripts/lint-design.sh --report-only apps/web/src`, axe/WCAG
spot-check of the touched routes (gov app — Rule 33), Playwright visual re-baseline (Rule 31 R6),
light AND dark verified, and one tenant-accent sanity check (change tenant primary in settings → shell,
buttons, stat chips follow).

**Wave 0 — Foundation (tokens only, no component edits).**
- `src/app/globals.css` (§1.1 blocks; keep `--nav-active-*` until Wave 1 lands, then delete)
- `tailwind.config.ts` (§1.3 sidebar colors + font)
- `src/app/layout.tsx` (Inter → Manrope)
- Verify: app renders with new neutrals/radius/font; tenant colors still override; charts pick up new palette.

**Wave 1 — Shell + Dashboard.**
- Shell: `src/components/app-shell.tsx`, `src/components/sidebar.tsx`, `src/components/header.tsx` (§2)
- Shared: `src/components/shared/stat-card.tsx` (§3.2), `src/components/shared/page-header.tsx` (§3.6)
- Dashboard: `src/app/[tenant]/dashboard/page.tsx`, `dashboard-client.tsx`, `kpi-card.tsx`,
  `fisherfolk-group-tile.tsx`, `vessel-group-tile.tsx`, `violations-group-tile.tsx`,
  `barangay-density-map.tsx` (chart-card frame only; map internals untouched),
  `year-select.tsx` / `registration-type-select.tsx` (h-8 ghost/outline sizing)
- Gate: SidebarFooter version + Powerbyte credit visually intact desktop + mobile sheet.

**Wave 2 — Lists.**
- Shared first: `src/components/shared/data-table.tsx` (§3.4), `search-input.tsx`, `status-badge.tsx`
  (§3.5), `empty-state.tsx`
- Then per-module list clients + columns: `src/app/[tenant]/fisherfolk/{page.tsx,fisherfolk-list-client.tsx,columns.tsx}`,
  `vessels/`, `violations/`, `ayuda/`, `fish-catches/`, `households/`, `edit-requests/`,
  `user-management/`, `audit-log/`, `notifications/` (list-toolbar → view-bar idiom §3.4).

**Wave 3 — Record details.**
- `fisherfolk/[id]` (+ `[id]/edit`), `vessels/[id]`, `violations/[id]`, `ayuda/[id]`,
  `fish-catches/[id]`, `households/[id]`, `edit-requests/[id]` → §3.7 layout
  (20rem rail + tabs; keep existing tab/data logic, restyle containers).

**Wave 4 — Operations, forms & the rest.**
- Registration/creation flows: `fisherfolk/register`, `vessels/register`, `violations/file`, `ayuda/new`,
  `households/new`, `fish-catches/register` (+ `stepper.tsx`, `form-section.tsx`, `form-actions.tsx`,
  `barangay-picker.tsx`, `category-picker.tsx`, upload components) — §3.8
- Tools: `import/`, `id-generator/`, `kanban/`, `map/`, `reports/`, `analytics/`, `todo/`
- Admin: `settings/` (+ `settings/roles`, `settings/id-template`), `platform/tenants` (+ `[id]/users`)
- Auth: `/admin` login card (blank-layout look: centered card on `bg-background`)
- Explicitly OUT of scope: `/` public landing (`src/components/landing/*`) — it has its own marketing
  design; only verify it did not regress from the Wave-0 token changes (see risk §5.5).

---

## 5. RISKS & CONSTRAINTS

**5.1 WCAG 2.2 AA (gov/LGU hard gate — Rule 33 / DICT MC 004).**
- Template leans on small type: `text-[10px]`/`text-[11px]` badges, 12px chart ticks,
  `text-muted-foreground/70` group labels. Small text is not itself a failure, but contrast must hold:
  light `--muted-foreground` 40% on white ≈ 5.6:1 (AA ok); at `/70` opacity on the sidebar surface it
  drops below 4.5:1 — if axe flags the group label, use full-opacity `text-muted-foreground` instead.
- Template's own warning: sidebar hover vs active share ONE wash — the *text color + font-weight* carries
  the state. Keep `font-medium` on active (already in §2.2 recipe) so state isn't color-only (WCAG 1.4.1).
- Keep every FRMS `focus-visible:ring-*` class through the reskin — the template drops some. Never remove
  focus styles when swapping classNames; a11y sweep (axe, 0-violation budget as per the 2026-07 audit) at
  each wave.

**5.2 Tenant accent mechanism (must not break).**
- NEVER hardcode NexaCRM's blue (`226 70% 55.5%`) into `--primary` — `#tenant-theme-root` inline styles
  override `--primary/--secondary/--ring` at runtime and the fallbacks must stay FRMS's (§1.2). All
  template `brand` usages become `primary` (§1.2 row 2).
- Role change of `--accent` (teal identity → neutral wash) removes teal from hover states app-wide. Teal
  survives only in `--chart-2` (by coincidence NexaCRM chart-2 IS a teal). If the owner wants the teal
  identity kept, that's a `[WHAT]` — default per this brief is full NexaCRM neutral.
- The nav active state changes from tenant-teal fill to neutral wash — sidebar stops reflecting tenant
  color. Mitigation kept in the recipe: logo chip + badges stay `bg-primary/10 text-primary`.
- `settings/theme-settings.tsx` (accent editor) and `id-template/template-canvas.tsx` read `--primary` —
  unaffected by mechanism, but re-verify both after Wave 0.

**5.3 SidebarFooter version + Powerbyte credit (V32.26 gate-closure item).**
Must remain: `FRMS · {tenant} · v{NEXT_PUBLIC_APP_VERSION}` + "Developed by Powerbyte IT Solutions" as a
new-tab link (`target="_blank" rel="noopener noreferrer"`) with its focus-visible classes. §2.2 edit 7
restricts changes to the border token only. Any wave touching `sidebar.tsx` re-verifies this block.

**5.4 Tailwind v4 → v3.4 translation traps.**
- Template classnames use v4/Base-UI-isms that do NOT exist in FRMS: `data-active:` variant (use FRMS's
  `isActive` ternary), `size-4.5` (use `size-[1.125rem]`), `h-5!` important suffix (use plain `h-5`),
  `w-(--sidebar-width)` var shorthand (use fixed `w-64`), `max-w-360`, `h-svh` (v3.4 has `h-svh` — ok).
- `color-mix(...)` arbitrary values work in v3 (plain CSS) but FRMS vars are HSL **triplets** — always
  wrap: `hsl(var(--foreground))` inside the color-mix (§2.2/§3.4 recipes already do).
- Do NOT port: `tw-animate-css`, the ThemeCustomizer/preset system, `[data-theme-scale]` font scaling,
  shadcn `ui/sidebar` component, CommandMenu (unless separately requested).

**5.5 Global token blast radius.**
Wave 0 changes `--background/--foreground/--radius/--chart-N` for EVERY consumer, including the public
landing page (`src/components/landing/*`), the login card, the ID-card renderer
(`id-card-renderer.tsx` — printed artifact! verify print colors unchanged or acceptable), toasts/sonner,
and the kanban board. Dark background lightens 4% → 9% and dark card 9% stays ≈ background (card/bg now
merge in dark — template separates them by border, so surfaces relying on card-vs-bg contrast in dark mode
need a `border` check). Run the full-route Playwright sweep after Wave 0, not just the dashboard.

**5.6 Rule-31 / design-fidelity.**
The reskin intentionally diverges from the current approved baseline: update `docs/DESIGN.md` notes +
re-baseline `design:fidelity` / Playwright visual snapshots per wave, and log the design change in
`docs/DECISIONS_LOG.md` (this brief is the reference).

**5.7 Charts as HSL triplets.**
Lesson on file: `--chart-N` values are consumed as `hsl(var(--chart-N))` (dashboard charts, density map).
The new palette keeps triplet format — do not switch to hex/oklch strings.
