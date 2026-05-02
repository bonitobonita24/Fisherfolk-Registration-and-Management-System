# FRMS — Design Tokens (DESIGN.md)

> Extracted from Phase 2.8 JSX mockup after user confirmation.
> Design system: Linear-inspired dark mode.
> Source: `FRMS_Phase2.8_Mockup.jsx` (2,485 lines, 22 screens)

---

## Design Aesthetic

**Inspiration:** Linear (https://getdesign.md/linear.app/design-md)
**Mode:** Dark mode only — no light mode toggle
**Accent:** Blue (`#4F8EF7`) — configurable per tenant via color picker
**Constraint:** No purple or violet anywhere in the design

---

## Color Tokens

### Core Palette (CSS custom properties for globals.css)

```css
:root {
  /* Backgrounds */
  --background:           #101010;   /* App background */
  --surface:              #171717;   /* Cards, panels */
  --elevated:             #1e1e1e;   /* Hover states, nested surfaces */
  --border:               #262626;   /* Dividers, input borders */

  /* Text */
  --foreground:           #ededed;   /* Primary text */
  --muted-foreground:     #8b8b8b;   /* Secondary text, labels */
  --dimmed-foreground:    #555555;   /* Tertiary text, timestamps */

  /* Primary (tenant-configurable accent) */
  --primary:              #4F8EF7;   /* Buttons, links, active states */
  --primary-foreground:   #FFFFFF;   /* Text on primary */
  --primary-muted:        rgba(79, 142, 247, 0.12);  /* Primary backgrounds */

  /* Semantic */
  --success:              #22c55e;   /* Active, approved, received */
  --success-muted:        rgba(34, 197, 94, 0.12);
  --warning:              #f59e0b;   /* Pending, inactive, diminishing */
  --warning-muted:        rgba(245, 158, 11, 0.12);
  --danger:               #ef4444;   /* Violations, errors, destructive */
  --danger-muted:         rgba(239, 68, 68, 0.12);
  --blue:                 #3b82f6;   /* Renewed, secondary blue */
  --blue-muted:           rgba(59, 130, 246, 0.12);

  /* Extended palette (charts, categories) */
  --cyan:                 #06b6d4;   /* Aquaculture category */
  --pink:                 #ec4899;   /* Accent preset option */
  --orange:               #f97316;   /* Age 60-69 bracket */
  --deep-red:             #dc2626;   /* Age 80+ bracket, critical */
}
```

### KPI Value Colors (brighter variants for dark card readability)

```css
/* These are NOT the base semantic colors — they are boosted-brightness
   variants used ONLY for large numeric values on dark card surfaces.
   Font: 30px, weight 800, letter-spacing -0.03em */

--kpi-blue:      #70A8FF;   /* Total registered, eligible voters */
--kpi-green:     #4ADE80;   /* Active members */
--kpi-gold:      #FBC02D;   /* Renewed, warnings, not renewed */
--kpi-red:       #FF6B6B;   /* Violations, seniors, danger */
--kpi-light-blue:#60A5FA;   /* Renewed count, male % */
--kpi-pink:      #F472B6;   /* Female % */
--kpi-white:     #FFFFFF;   /* Neutral values (total, vessels) */
```

### Barangay Map Colors (distinct per-barangay, low opacity for transparency)

Each barangay has a unique HSL hue for geographic density maps. Opacity ranges from 0.18 (low density) to 0.60 (high density) to allow see-through overlapping on real OpenStreetMap tiles.

```
Lazareto:          hsl(0, 100%, 65%)     — red
Baruyan:           hsl(25, 95%, 55%)     — orange
Silonay:           hsl(200, 85%, 55%)    — sky blue
Ibaba West:        hsl(145, 70%, 45%)    — green
Navotas:           hsl(218, 90%, 64%)    — blue (matches primary)
Maidlang:          hsl(330, 75%, 55%)    — pink
Parang:            hsl(50, 90%, 50%)     — gold
Nag-iba II:        hsl(175, 65%, 45%)    — teal
Canubing I:        hsl(195, 75%, 55%)    — cyan
Wawa:              hsl(15, 85%, 50%)     — vermillion
Mahal na Pangalan: hsl(80, 65%, 45%)     — olive
Balite:            hsl(220, 70%, 55%)    — steel blue
Nag-iba I:         hsl(160, 60%, 50%)    — sea green
Tawagan:           hsl(350, 65%, 50%)    — rose
Pachoca:           hsl(110, 55%, 45%)    — leaf green
Canubing II:       hsl(240, 60%, 55%)    — indigo
Ibaba East:        hsl(60, 70%, 48%)     — chartreuse
San Rafael:        hsl(210, 70%, 55%)    — cobalt
Suqui:             hsl(130, 55%, 50%)    — emerald
Lumang Bayan:      hsl(190, 50%, 48%)    — ocean
```

Map tile filter (darkens real OSM tiles for dark theme):
```css
filter: brightness(0.35) saturate(0.4) hue-rotate(200deg);
```

---

## Typography

**Font family:** Inter (from rsms.me/inter CDN)
**Antialiasing:** `font-smoothing: antialiased`

| Role | Size | Weight | Color | Tracking |
|---|---|---|---|---|
| Page title (h1) | 22px | 600 (semibold) | --foreground | -0.02em |
| KPI value | 30px | 800 (extrabold) | --kpi-* variant | -0.03em |
| KPI sub-value | 18px | 800 | --kpi-* variant | default |
| Card title | 14px | 600 | --foreground | default |
| Body text | 13px | 400 | --foreground | default |
| Table header | 11px | 500 | --muted-foreground | 0.05em uppercase |
| Table cell | 13px | 400 | --foreground | default |
| Label | 12px | 500 | --muted-foreground | default |
| Caption / timestamp | 11px | 400 | --dimmed-foreground | default |
| Badge text | 11px | 600 | semantic color | default |
| Monospace (IDs) | 11px | 400 | --foreground | default (font-family: monospace) |
| Nav link | 13px | 400 (600 active) | --muted (--primary active) | default |
| Nav section label | 10px | 600 | --dimmed-foreground | 0.08em uppercase |

---

## Component Patterns

### Cards
```css
background: var(--surface);           /* #171717 */
border: 1px solid var(--border);      /* #262626 */
border-radius: 12px;
padding: 20px;
```

### KPI Cards (restructured — parent + children)
```
Top: value (30px/800) + label (12px/500)
Bottom (separated by 1px border): two sub-values (18px/800) side by side
Example: "2,937 Total registered" → below: "532 New | 487 Renewed"
```

### Buttons
```css
/* Primary */
background: var(--primary);  color: #fff;  border-radius: 8px;
padding: 8px 16px;  font-size: 13px;  font-weight: 500;

/* Secondary */
background: var(--elevated);  color: var(--foreground);
border: 1px solid var(--border);

/* Destructive */
background: var(--danger);  color: #fff;

/* Small variant */
padding: 4px 10px;  font-size: 11px;
```

### Badges
```css
display: inline-flex;  border-radius: 9999px;
padding: 2px 10px;  font-size: 11px;  font-weight: 600;

/* Status variants: */
New:       bg: --primary-muted     color: --primary
Active:    bg: --success-muted     color: --success
Renewed:   bg: --blue-muted        color: --blue
Inactive:  bg: rgba(100,100,100,0.15)  color: --muted-foreground
Violation: bg: --danger-muted      color: --danger
Pending:   bg: --warning-muted     color: --warning
Approved:  bg: --success-muted     color: --success
Rejected:  bg: --danger-muted      color: --danger
Lifted:    bg: rgba(100,100,100,0.2)   color: --dimmed-foreground
```

### Mobile Strategy Badges
```css
Mobile First:  bg: --primary-muted  color: --primary  "📱 Mobile First"
Mobile Ready:  bg: rgba(100,100,100,0.1)  color: --dimmed  "🖥️ Mobile Ready"
```

### Inputs
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: 8px;
padding: 8px 12px;
font-size: 13px;
color: var(--foreground);
/* Focus: */
border-color: var(--primary);
box-shadow: 0 0 0 2px var(--primary-muted);
```

### Tables
```css
/* Header */
th: text-transform: uppercase; letter-spacing: 0.05em;
    font-size: 11px; font-weight: 500; color: --muted-foreground;
    border-bottom: 1px solid var(--border);

/* Row */
tr:hover td: background: var(--elevated);  /* #1e1e1e */
td: border-bottom: 1px solid var(--elevated);

/* Pagination */
font-size: 12px; color: --muted-foreground;
Active page button: bg: --primary-muted; color: --primary;
```

### Bar Charts
```css
Track:  background: var(--elevated); border-radius: 3px; height: 16-20px;
Fill:   border-radius: 3px; transition: width 0.5s ease;
Label:  font-size: 11-12px; color: --muted-foreground; min-width: 80-100px;
Value:  font-size: 11-12px; text-align: right;
```

### Heatmap Grid Cells
```css
border-radius: 6px; aspect-ratio: 1;
font-size: 10-14px; font-weight: 600-700;
/* Color uses per-barangay hue at varying opacity */
```

### Sidebar Navigation
```css
width: 210px; border-right: 1px solid var(--border);
background: var(--background);

/* Section label */
font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
color: var(--dimmed-foreground); padding: 12px 10px 4px;

/* Nav link */
padding: 7px 10px; border-radius: 6px; font-size: 13px;
Active: background: var(--primary-muted); color: var(--primary); font-weight: 600;
Hover:  background: var(--elevated); color: #ccc;

/* Badge count (e.g. Edit Requests: 5) */
background: var(--danger); color: #fff; font-size: 10px;
padding: 1px 6px; border-radius: 99px;
```

### Header Bar
```css
height: 52px; background: #111111; border-bottom: 1px solid var(--border);
position: sticky; top: 0; z-index: 50;

/* Logo: */
width: 26px; height: 26px; background: var(--primary); border-radius: 6px;
font-size: 11px; font-weight: 700; color: #fff;

/* Tenant badge: */
font-size: 10px; color: --dimmed-foreground;
border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px;

/* Search bar: */
max-width: 380px; background: var(--elevated);
border: 1px solid var(--border); font-size: 12px;

/* Notification bell: red dot indicator */
width: 7px; height: 7px; background: var(--danger); border-radius: 50%;
border: 2px solid #111;

/* User avatar: */
width: 26px; height: 26px; background: var(--primary-muted);
border-radius: 50%; font-size: 10px; color: var(--primary);
```

---

## Layout Patterns

### App Shell
```
Header (52px, sticky) → Sidebar (210px, fixed) + Main content (flex: 1, padding: 24px 32px)
```

### Dashboard
```
KPI cards: 5-column grid, gap 10px, restructured parent+children layout
Map section: 3fr + 1fr grid (map | activity feed)
Chart rows: 2-column grid, gap 16px
Triple row: 3-column grid (category | trends | birthdays)
Bottom: 2-column grid (seniors | violations)
Global toggle: Charts ↔ Maps button in header
```

### List Views
```
Header (title + count + action buttons)
Sub-tabs (if applicable: Master List | Today's Operations)
Filter bar (search + dropdowns)
Table with pagination
```

### Detail Views
```
Breadcrumb → Mobile badge
2/3 + 1/3 grid split
Left: main info card, linked entities, comments
Right: QR code, violations, ayuda history, change history
```

### Form Views
```
max-width: 640px; single column
Card container with stacked label + input pairs
2-column grid for short fields (DOB + Sex, etc.)
Action buttons right-aligned at bottom
```

### Settings
```
Tabbed: General | Categories | Violations | Email
Categories tab is full-width with table + add form
Other tabs max-width: 640px
```

---

## ID Card Specifications

```
Content area:    86 × 54 mm
Bleed area:      90 × 58 mm (2mm bleed on all sides)
PVC sheet:       200 × 300 mm
Max per sheet:   4 ID pairs (front + back)
Print method:    Mirrored (scaleX: -1) for PVC film back-printing
Template system: Drag-and-drop editor with variable fields
```

### Template Variables (Fisherfolk)
```
{{photo}}, {{signature}}, {{qr_code}}, {{registration_number}},
{{full_name}}, {{last_name}}, {{first_name}}, {{middle_name}},
{{date_of_birth}}, {{sex}}, {{address}}, {{barangay}},
{{rsbsa_number}}, {{categories}}, {{date_joined}}
```

### Template Variables (Vessel)
```
{{vessel_photo}}, {{vessel_qr_code}}, {{mfvr_number}}, {{vessel_name}},
{{vessel_type}}, {{hull_material}}, {{dimensions}}, {{engine_hp}},
{{homeport}}, {{fishing_gear}}, {{owner_name}}, {{year_built}},
{{gross_tonnage}}, {{net_tonnage}}, {{valid_until}}
```

### Shared Variables
```
{{mayor_name}}, {{mayor_signature}}, {{registration_year}}
```

### Category Icons
Each category has an emoji or uploaded image icon (64×64px PNG/SVG, max 50KB).
Icons appear on printed ID cards next to category names.

---

## Report Headers

Official government header format for all generated PDF/Excel reports:

```
Republic of the Philippines
City Government of Calapan
Fisheries Management Office
[REPORT TITLE]
```

---

## Interaction Patterns

| Pattern | Behavior |
|---|---|
| Global Charts/Maps toggle | Single button in Dashboard header switches ALL bar charts to geographic mini-maps using real OSM tiles |
| Density map colors | Each barangay has a distinct HSL hue at low opacity (0.18–0.60) on real OpenStreetMap tiles |
| QR code scanning | Camera viewfinder with corner brackets + scan line; searches both fisherfolk and vessel profiles |
| Edit approval flow | Diff view with red strikethrough (old) → green highlight (new) |
| Ayuda verification | Check-all per page + uncheck individuals; green row tint for verified |
| Daily operations | Sub-tab under Fisherfolk showing today's registrations, print queue (auto-fill PVC sheet), printed summary |
| ID sheet auto-fill | Selected members automatically fill 200×300mm PVC sheet; empty slots show dashed placeholders |
| Category icons | Emoji picker or uploaded image; preview shows how icon appears on printed ID card |
| Image compression | All uploaded images auto-compressed to <200KB server-side |
| Data import wizard | 5-step stepper with validation: Excel parsing → photo matching by filename → signature matching → preview table with status icons → bulk import with report |

---

## Screen Inventory (confirmed)

| # | Screen | Mobile Strategy | Sub-tabs |
|---|---|---|---|
| 1 | Login | Mobile First | — |
| 2 | Dashboard | Mobile Ready | Charts / Maps toggle |
| 3 | Fisherfolk | Mobile Ready | Master List / Today's Operations |
| 4 | Fisherfolk Profile | Mobile First | — |
| 5 | Fisherfolk Registration | Mobile Ready | — |
| 6 | Vessels | Mobile Ready | — |
| 7 | Vessel Profile | Mobile First | — |
| 8 | QR Scanner | Mobile First | — |
| 9 | Violations List | Mobile Ready | — |
| 10 | Violation Form | Mobile First | — |
| 11 | Edit Requests | Mobile Ready | — |
| 12 | ID Generation | Mobile Ready | Select & Print / Template Editor / PVC Sheet Layout |
| 13 | Renewal | Mobile Ready | — |
| 14 | Ayuda Programs | Mobile Ready | List / Detail (verification + uploads) / Create |
| 15 | Reports | Mobile Ready | 9 report types (list generator) |
| 16 | Kanban Tasks | Mobile Ready | — |
| 17 | Audit Logs | Mobile Ready | — |
| 18 | Users | Mobile Ready | — |
| 19 | Settings | Mobile Ready | General / Categories / Violations / Email |
| 20 | Notifications | Mobile First | — |
| 21 | My Profile | Mobile First | — |
| 22 | Data Import | Mobile Ready | 5-step wizard: Excel → Photos → Signatures → Validate → Import |
