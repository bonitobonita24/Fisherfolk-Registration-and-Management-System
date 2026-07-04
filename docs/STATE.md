# FRMS — Project State

## Current State (2026-07-04)

Branch `swarm/admincn-reskin` is the active feature branch for the AdminCN Reskin wave.
S1 ✅ complete (theme tokens). S2 ✅ complete (sidebar + app-shell reskin). S3 ✅ complete (header/topbar reskin). S4 ✅ complete (dense dashboard layout). S5 (QA) pending.

### Completed this session (S4 — Dense dashboard analytics layout)

- **`apps/web/src/app/[tenant]/dashboard/kpi-card.tsx`** (NEW) — local compact KPI card:
  - `text-[10px]` uppercase label, `text-2xl font-bold` value, `size-4` lucide icon.
  - Optional `sparkline` slot rendered below value; suppressed when `loading === true`.
  - Inline shimmer (`animate-pulse rounded bg-muted`) — no Skeleton component needed.
- **`apps/web/src/app/[tenant]/dashboard/dashboard-client.tsx`** (updated) — AdminCN dense layout:
  - 6-across KPI strip: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3` using local `KpiCard`.
  - `totalSpark`: mini CSS bar chart of top-5 barangay counts (h-8, aria-hidden); guarded against empty/zero data.
  - `activeSpark`: progress bar at `activeRatio`% clamped to 100%; shown only when data loaded.
  - Density map + Registration Status in 3-col grid (`lg:col-span-2` + 1/3 col).
  - Chart heights reduced: `h-[320px]` → `h-[220px]`, `h-[300px]` → `h-[200px]`.
  - Card padding: `CardHeader p-3 pb-2`, `CardContent p-3 pt-0`; gaps `gap-6` → `gap-3`; root `space-y-8` → `space-y-4`.
  - All real tRPC queries preserved; `hsl(var(--chart-n))` colors maintained throughout.
  - `StatCard` kept for "Data Completeness" clickable links (Missing Photo/Signature).
- **`apps/web/src/app/[tenant]/dashboard/page.tsx`** (updated): `text-2xl` → `text-lg font-semibold`; `space-y-6` → `space-y-4`.
- **Code-review gate**: ran (medium effort, 2 angles × 6 candidates); 3 in-scope bugs fixed:
  (1) `activeSpark` rendered during loading state → suppressed sparklines in `KpiCard` when `loading === true`;
  (2) `activeRatio` unclamped → `Math.min(100, ...)` applied;
  (3) zero-count totalSpark guard → added `.some(d => d.count > 0)` check.
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `5cb0db9` on `swarm/admincn-reskin`.

### Completed this session (S3 — Header/topbar reskin)

- **`apps/web/src/components/header.tsx`** (updated) — AdminCN topbar:
  - Added `onToggleSidebar?: () => void` to HeaderProps (S2 app-shell's `toggleSidebar`; optional — no break to existing callers).
  - Mobile `md:hidden` Menu button (calls `onMenuClick` → Sheet drawer) always rendered at all times.
  - Desktop `hidden md:flex` PanelLeft button (calls `onToggleSidebar`) conditionally shown when prop provided.
  - Search: `<button>` styled as ⌘K search bar — replaced `<Input type="search" readOnly>` to avoid WCAG 4.1.2 screen-reader forms-mode bug.
  - Right section: NotificationBell → ThemeToggle → avatar dropdown; `gap-1` tight spacing; `ml-auto` pushes to edge.
  - All preserved: signOut, Settings link, name/role display, initials logic, ThemeToggle functional.
  - h-14 height, `px-3` tight padding, `bg-card` surface — AdminCN style maintained.
  - ⚠ **Pending wire-up**: `app-shell.tsx` still omits `onToggleSidebar={toggleSidebar}` (the function exists in S2 app-shell but is not yet passed to Header — out of S3 scope per hard rules). Next session touching app-shell should add `onToggleSidebar={toggleSidebar}` to the `<Header>` call.
- **Code-review gate**: ran medium effort (2 angles × 6 candidates); 2 in-scope bugs fixed: (1) mobile drawer trigger lost when `onToggleSidebar` truthy → fixed by always rendering mobile Menu button separately; (2) `readOnly` Input WCAG 4.1.2 violation → replaced with `<button>`. 1 deferred (app-shell wiring, out of scope).
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `33a40a1` on `swarm/admincn-reskin`.

### Completed this session (S2 — Sidebar + app-shell reskin)

- **`apps/web/src/components/sidebar.tsx`** (updated) — AdminCN grouped nav:
  - Brand block (h-14): icon-only when collapsed (no overflow), icon+text+collapse button when expanded.
  - Grouped sections: UPPERCASE 10px muted labels (Overview/Records/Operations/Administration) preserved verbatim with all items + RBAC filter (`item.roles.includes(role)`) unchanged.
  - Active-item style: `bg-accent text-accent-foreground` + 4px left primary indicator bar.
  - Density: `py-1.5` nav items (from `py-2`), `space-y-0.5` gaps, group padding reduced.
  - Desktop collapse: `isCollapsed` prop — icon-rail mode (icon-only nav items + Tooltip for labels), dividers between groups, expand button in footer slot.
  - WCAG: `aria-expanded` on toggle/expand buttons, `aria-label` on icon-only links and collapsed logo link, tooltips via shadcn TooltipProvider.
  - New props: `isCollapsed?: boolean` (default false), `onToggle?: () => void`.
  - Bug fix from code-review: toggle button moved out of collapsed header (overflow fix); aria-expanded added.
- **`apps/web/src/components/app-shell.tsx`** (updated) — app shell:
  - Desktop sidebar: `w-56` expanded (from `w-60`), `w-14` collapsed; `sidebarCollapsed` state + `toggleSidebar` function.
  - Passes `isCollapsed` + `onToggle` to desktop Sidebar.
  - Mobile Sheet: `w-56` (matched to expanded desktop width; was `w-60`); no collapse props (correct).
  - Main padding: `p-3 md:p-4` (from `p-4 md:p-6`).
  - Note: `onToggleSidebar` prop for Header deferred to S3 (S3 adds the prop to HeaderProps + adds header toggle button).
- **Code-review gate**: ran (medium effort, 8 angles); 3 in-scope bugs fixed: collapsed header overflow (restructured), aria-expanded on toggle/expand buttons, mobile Sheet width inconsistency (w-60→w-56). Deferred: pathname.startsWith prefix-collision (pre-existing, not this session's bug); re-render on collapse (out of scope, children optimization); no CSS width transition (not required by spec).
- **Validation**: typecheck ✅, lint ✅, build ✅.

### Completed this session (S1 — AdminCN theme tokens)

- **`apps/web/src/app/globals.css`** (updated) — AdminCN palette applied:
  - `.dark`: pure-neutral surfaces (bg 0 0% 4%, card/popover 0 0% 9%), teal accent (175 100% 29%), orange ring/chart-1 (20 100% 47%), teal chart-2 (175 100% 29%), neutral secondary/muted (0 0% 15%), --primary orange preserved.
  - `:root` (light): white background, near-black foreground, same teal accent + chart set, neutral borders.
  - Tailwind HSL-triplet contract maintained; --radius (0.625rem) preserved; no hex values.
- **Code-review gate**: ran (low effort); verdict = clean, 0 findings.
- **Validation**: typecheck ✅, lint ✅, build ✅.
- Commit `7652d61` on `swarm/admincn-reskin`.

### Completed this session (SD — AdminCN Reskin governance docs)

- **`docs/DECISIONS_LOG.md`** (updated) — appended `2026-07-04 AdminCN Reskin wave` section with
  sub-decisions (a) app shell + theme reskin to AdminCN pattern (dark default kept, neutral-dark
  surfaces, teal/orange accent via --accent + --chart-1..5, orange --primary preserved), (b) density
  pass (6-across KPI strip, tighter padding/gaps, reduced chart heights), (c) implementation split
  (S1–S5 + SD). PRODUCT.md untouched (Rule 1).
- **`docs/CHANGELOG_AI.md`** (updated) — appended SD wave summary entry.
- **`docs/STATE.md`** (this file) — current-state block updated.
- Commit on `swarm/admincn-reskin`.

### Completed previous session (S7 — Page assembly, RBAC tab gating)

- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (updated) — RBAC tab gating:
  - Admins/super_admins (`canManage=true`): `defaultValue="editor"`, Template Editor tab visible.
  - Encoders (`canManage=false`): `defaultValue="select"`, Template Editor tab + TabsContent hidden entirely.
  - `TabsList` gains `aria-label="ID Generator sections"` for WCAG keyboard nav.
  - `page.tsx` unchanged (already computes `canManage` from `session?.user?.role`); nav-items.ts unchanged (roles already correct).
  - ID-released state confirmed wired in `SelectAndPrint` (S5 work, unchanged).
- **Code-review gate**: ran (2 finder angles); both returned `[]` — clean.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `47d391b` on `swarm/id-generator`.

### Completed this session (S6 — PVC Sheet Layout + print rendering)

- **`apps/web/src/app/[tenant]/id-generator/_components/pvc-sheet.tsx`** (new) — `<PvcSheet>` component: 200×300mm PVC sheet, 4 FRONT+BACK pairs; back face mirrored via `scaleX(-1)` for film back-printing; dashed-border placeholders for empty slots; `@page { size: 200mm 300mm; margin: 0 }` print CSS with visibility isolation (`body * hidden` + `#pvc-sheet-root * visible`) + `position: fixed` sheet; Print button calls `window.confirm` → `idPrint.recordPrint` → `toast.success` → `window.print()`; `PRINT_SCALE = 96/25.4` px/mm; sheet geometry: SHEET_PAD_V_MM=26mm, SHEET_PAD_H_MM=12mm, ROW_GAP_MM=8mm; uses `trpc.idTemplate.getById` + `trpc.idPrint.getSubjectPrintData` for template + resolved data; `[data-print-hide]` hides screen controls on print; WCAG: `role="region"`, aria-labelled pairs, `aria-hidden` on decorative elements.
- **`apps/web/src/server/trpc/routers/idPrint.ts`** (updated) — new `getSubjectPrintData` procedure (encoderProcedure): resolves all template variable keys for FISHERFOLK (photo/signature/qrCode/categories with single-round-trip batch category fetch) and VESSEL (vesselPhoto/qrCode/dimensions). Fix: deleted category IDs silently omitted from `{{categories}}` field instead of printing raw CUID strings.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-card-renderer.tsx`** (updated) — fixed `photo`/`signature`/`qr` element types to render actual `<Image>` from `data` prop in print mode (previously showed gray placeholders); image-kind `variable` elements now also render as `<Image>` in print mode via `data[variableKey]`.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (updated) — replaced S5 placeholder with `<PvcSheet selection={printSelection} onBack={() => setPrintSelection(null)} />`.
- **Code-review gate**: ran (2 finder agents × 8 angles); 1 in-scope finding fixed: deleted category CUID fallback (`.map(id => categoryNameById.get(id) ?? id)` → filter-and-omit). Verified refuted: Prisma select syntax (actual code uses `field: true`); negative padding (26mm positive); window.confirm WCAG (spec-required). Plausible/deferred: Ctrl+P blank-print bypass; window.print() catch message; hardcoded photo/sig/qr vs variable branch.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `49140a3` on `swarm/id-generator`.

### Completed this session (S5 — Select & Print subject list + validation gate + ID-released state)

- **`apps/web/src/app/[tenant]/id-generator/_components/select-and-print.tsx`** (new) — `<SelectAndPrint>` component: Tabs (FISHERFOLK | VESSEL-coming-soon); FISHERFOLK tab has template picker (ACTIVE templates from `idTemplate.list`); multi-select table driven by `idPrint.listEligible` showing name, photo thumbnail (or "Missing" text), signature present/missing, ID-Released badge (text: Released / Not Released), NEW/RENEWED registration badge, and READY/INCOMPLETE print-status with explicit "Missing photo/signature" text; disabled checkboxes with aria-label for blocked rows; "Select all ready" bulk action; running subject + sheet count (uses `ID_CARD_GEOMETRY.maxPairsPerSheet`); "Proceed to Layout" calls `onProceedToLayout(PrintSelection)`. VESSEL tab shows "coming soon" Card. `useEffect` resets `selectedIds` on `templateId` change to prevent stale ghost selections. WCAG: `<table>` with `<caption>` + `scope="col"`, aria-labeled checkboxes, all status badges carry text.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-generator-client.tsx`** (new) — `<IdGeneratorClient>` client wrapper: Tabs (Template Editor | Select & Print); `forceMount` + `data-[state=inactive]:hidden` on both `TabsContent` to preserve selection state across tab switches; `printSelection` state holds `PrintSelection | null` for S6 PvcSheetLayout to consume; S6 placeholder card with shadcn Button (variant=link) for "← Back to selection".
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** (updated) — renders `<IdGeneratorClient canManage={canManage} />` instead of `<TemplateEditor>` directly; description updated.
- **Exported types for S6**: `PrintSubject` and `PrintSelection` from `select-and-print.tsx`.
- **Code-review gate**: ran (3 agents × 8 angles); 4 in-scope findings fixed: stale `selectedIds` on template change (useEffect); `sheetsNeeded` hardcoded `4` → `ID_CARD_GEOMETRY.maxPairsPerSheet`; raw `<button>` → shadcn `Button variant=link`; JSX block comment removed. Deferred: `registrationType` UPDATE case (no data signal in `listEligible`; bucket-A follow-up); StatusBadge reuse (cosmetic divergence).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `030429f` on `swarm/id-generator`.

### Completed this session (S4b — ElementInspector + TemplateForm save/load + TemplateManager)

- **`apps/web/src/app/[tenant]/id-generator/_components/element-inspector.tsx`** (new) — `<ElementInspector>` side panel; edits selected element props live: xMm/yMm/widthMm/heightMm (mm number inputs, step 0.1), zIndex, delete-element; text elements get content input; text/variable elements get fontFamily, fontSizePt, fontWeight (Select 400/500/600/700), color (native color picker + hex text with `#RRGGBB` validation), align (3-button group with `aria-pressed`); icon elements get emoji input. All inputs WCAG-labelled (Label+htmlFor). NaN inputs silently retained (no silent clamp-to-default).
- **`apps/web/src/app/[tenant]/id-generator/_components/template-form.tsx`** (new) — `<TemplateForm>` header row: name Input + templateType Select (FISHERFOLK|VESSEL) + status Select (ACTIVE|ARCHIVED) + Save/Update Button (disabled on empty name or while saving); all fields WCAG-labelled.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-manager.tsx`** (new) — `<TemplateManager>` Table of all tenant templates (name/type/status/updated); Edit (calls `onEditTemplate` → loads into editor), Duplicate (`idTemplate.duplicate`), Archive (`idTemplate.update` status→ARCHIVED, ACTIVE-only), Delete (confirmation Dialog + `idTemplate.delete`); admin-gated via `canManage` prop (server-auth value from page.tsx, following violations/ayuda pattern); all action buttons aria-labelled.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-editor.tsx`** (updated) — integrated all three new components; added `formValues` state + `templateId`; wired `trpc.idTemplate.create/update/duplicate` mutations with toast + list invalidation; `loadTemplate(id)` uses `utils.idTemplate.getById.fetch()` to imperatively load+hydrate canvas state; `duplicate` button in canvas header (admin-gated); **code-review bug fixes**: `updateSelectedElement` and `deleteSelectedElement` now read `activeSide`/`selectedElementId` from inside the setState updater (prevents stale-closure wrong-side/wrong-element write).
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** (updated) — now `async`; calls `auth()`, computes `canManage = role === "super_admin" || role === "admin"` with safe optional chain (`session?.user?.role`); passes `canManage` to `<TemplateEditor>`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** (fixed) — geometry test corrected to match current schema (86×54mm cut, 88×56mm bleed) after prior commits 12dbdd1/51d0b88 reverted the S4a geometry override without updating the test.
- **Code-review gate**: ran (3 angles × parallel agents); 3 in-scope findings fixed: stale-closure in `updateSelectedElement`/`deleteSelectedElement` (both `activeSide` and `selectedElementId` now read from setState updater `s`, not render closure); `session?.user.role` → `session?.user?.role`; `fontSizePt` NaN guard changed from silent-clamp-to-8 to no-op (preserves existing value). Deferred out-of-scope: `loadTemplate` unchecked IdElement[] cast from DB JSON (application-layer Zod parse would surface schema drift; mitigated by server-side schema validation on save); `duplicate.isPending` shared across all rows (UX-only, acceptable).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.

### Completed this session (S4a — Editor canvas + IdCardRenderer + palette + background upload)

- **`packages/shared/src/schemas/id-template.ts`** — `ID_CARD_GEOMETRY` corrected to 87×56mm content / 91×60mm bleed (owner override from S1 86×54mm; comment + DECISIONS_LOG entry added).
- **`apps/web/package.json`** — added `@dnd-kit/core@6.3.1`, `@dnd-kit/modifiers@9.0.0`, `@dnd-kit/utilities@3.2.2`, `@radix-ui/react-tabs`.
- **`apps/web/src/components/ui/tabs.tsx`** — shadcn Tabs component installed.
- **`apps/web/src/server/trpc/routers/upload.ts`** — added `"id-template-bg"` entity type (5 MB cap) to `ENTITY_TYPES` and `MAX_BYTES_BY_ENTITY`.
- **`apps/web/src/app/[tenant]/id-generator/_components/id-card-renderer.tsx`** (new) — reusable presentational `<IdCardRenderer>` component; dnd-kit-free; `renderElement` render-prop pattern for editor injection; `mode='edit'` variables as labelled placeholders; `mode='print'` variables resolved from `data`; exports `elementPositionStyle` + `pxFromMm` + `ElementVisual` for reuse.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-canvas.tsx`** (new) — `<TemplateCanvas>` wraps IdCardRenderer(mode=edit) in a dnd-kit `DndContext`; each element is a `useDraggable` with `restrictToParentElement` + 0.5mm `createSnapModifier` (both memoised); epsilon drag-delta guard (sub-pixel residual protection); `KeyboardSensor` with arrow-key nudge (WCAG 2.2 keyboard drag); `useReducedMotion()` WCAG 2.2 SC 2.3.3.
- **`apps/web/src/app/[tenant]/id-generator/_components/element-palette.tsx`** (new) — `<ElementPalette>` showing static elements (Text, Photo, Signature, QR) + all `TEMPLATE_VARIABLES` grouped by FISHERFOLK/VESSEL/SHARED; click adds to active side; `uid()` with secure-context fallback for non-HTTPS dev envs.
- **`apps/web/src/app/[tenant]/id-generator/_components/background-upload.tsx`** (new) — `<BackgroundUpload>` per side; reuses `trpc.upload.uploadFile` with `entityType="id-template-bg"`; thumbnail preview + remove.
- **`apps/web/src/app/[tenant]/id-generator/_components/template-editor.tsx`** (new) — `<TemplateEditor>` orchestrator; side-keyed EditorState (front/back `SideState`); side-specific `useCallback` handlers eliminating stale-closure wrong-side-write bug; shadcn Tabs front/back toggle; selected element info panel; state only (no persistence — S4b saves).
- **`apps/web/src/app/[tenant]/id-generator/page.tsx`** — updated to mount `<TemplateEditor />`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** — geometry assertions updated to 87/56.
- **`docs/DECISIONS_LOG.md`** — appended decision (g): geometry correction 87×56mm owner override.
- **Code-review gate**: ran (3 angles × parallel agents); in-scope findings fixed: epsilon delta guard (sub-pixel float residual), snapModifier useMemo (mid-drag re-registration), wrong-side-write closure bug (side-specific useCallback), uid() secure-context fallback; deferred: style render-prop argument discarded (cosmetic, out-of-scope).
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 50 skip-DB), build ✅.
- Commit `9995e5d` on `swarm/id-generator`.

### Completed this session (S3 — IDPrintBatch model + idPrint router)

- **`packages/db/prisma/schema.prisma`** — added `IDPrintBatch` model (id, tenantId, templateId, templateType, printedById, printedAt, idCount, summaryJson, createdAt); added `PRINT` to `AuditAction` enum; added inverse relations on Tenant, User, IDTemplate.
- **`packages/db/prisma/migrations/20260701120000_add_id_print_batch/migration.sql`** — CREATE-ONLY additive migration: `ALTER TYPE "AuditAction" ADD VALUE 'PRINT'` + `CREATE TABLE "id_print_batches"` + 3 FK constraints + 2 indexes.
- **`packages/shared/src/types/enums.ts`** — added `PRINT` to `AuditAction` const object.
- **`packages/shared/src/schemas/id-print.ts`** (new) — `idPrintValidateSchema`, `idPrintRecordSchema`, `idPrintSubjectSchema` Zod schemas + TypeScript types.
- **`apps/web/src/server/trpc/routers/idPrint.ts`** (new) — 4 procedures:
  - `listEligible` (encoderProcedure): tenant-scoped fisherfolk/vessel list with `ready` boolean.
  - `validateSelection` (encoderProcedure): per-ID photo/signature check; not-found IDs treated as blocked.
  - `recordPrint` (encoderProcedure): subject-type/template-type mismatch guard → template tenant+type check → server-side re-validation (including not-found detection) → `$transaction(IDPrintBatch.create + AuditLog(PRINT))`; returns `{id, idCount}` minimal surface.
  - `todaysPrinted` (encoderProcedure): PHT midnight boundary (not server UTC); viewer FORBIDDEN.
- **`apps/web/src/server/trpc/root.ts`** — registered `idPrint: idPrintRouter`.
- **`apps/web/src/server/trpc/routers/__tests__/idPrint.test.ts`** (new) — 13 DB-integration tests (skip in CI): validateSelection flags missing photo/sig/not-found/cross-tenant; recordPrint writes batch+audit, blocks on missing media + not-found + mismatch, viewer FORBIDDEN; todaysPrinted tenant-scoped + PHT start-of-day + rolled-up counts.
- **Code-review gate**: ran (4 angles × parallel agents); 7 in-scope findings fixed: RBAC (todaysPrinted→encoderProcedure), re-validation not-found detection, subjectType/templateType mismatch bypass, raw IDs in error message, narrowed return surface, templateType cross-check on template lookup, PHT timezone.
- **Validation**: typecheck ✅ (0 errors), lint ✅, test ✅ (178 pass / 50 skip-DB, 13 new tests).

### Completed this session (S2 — ID Generator router hardening)

- **`apps/web/src/server/trpc/routers/idTemplate.ts`** — hardened with L5 AuditLog writes and `duplicate` mutation:
  - `create`: writes `auditLog(CREATE, after=created)` after the DB insert.
  - `update`: reads `existing` for before-snapshot; writes `auditLog(UPDATE, before, after)`.
  - `archive`: reads `existing`; writes `auditLog(UPDATE, before, after)` (AuditAction has no ARCHIVE; UPDATE is the correct action per fisherfolk.ts convention).
  - `delete`: deletes first, then writes `auditLog(DELETE, before=existing)` — order fixed to avoid phantom audit entries on delete failure.
  - `duplicate` (new): tenant-scoped load → create copy with `name "<source> (copy)"`, `status: ARCHIVED` (IDTemplateStatus only has ACTIVE|ARCHIVED; ARCHIVED avoids getActive collisions); writes `auditLog(CREATE, after=copy)`.
  - All mutations retain the `if (!ctx.tenantId) FORBIDDEN` guard.
- **`packages/shared/src/schemas/id-template.ts`** — added `idTemplateDuplicateSchema = z.object({ id: z.string().cuid() })`.
- **`apps/web/src/server/trpc/routers/__tests__/idTemplate.test.ts`** (new) — 16 DB-integration tests (skip when no DATABASE_URL): create/update/archive/delete each write the correct AuditLog; duplicate produces ARCHIVED copy that does not collide with `getActive`; cross-tenant `getById`/`update`/`duplicate` all return NOT_FOUND; non-admin (encoder/viewer) FORBIDDEN on all mutations.
- **Validation**: typecheck ✅ (0 errors), lint ✅ (0 warnings), test ✅ (178 pass / 37 skip-DB), 16 new tests correctly skipped in CI.
- **Code-review gate**: ran (3 angles × parallel agents); 1 in-scope finding fixed (delete mutation order: audit-before-delete → delete-first-then-audit to avoid phantom audit entries); 2 out-of-scope deferred findings (non-atomic audit tradeoff + TOCTOU before-snapshot — both are fleet-wide patterns matching fisherfolk.ts).

### Completed this session (S1 — ID Generator shared schemas)

- **`packages/shared/src/schemas/id-template.ts`** — fully rewritten (26→145 lines):
  - `idElementSchema`: Zod discriminated union on `type` field with 7 members (`text`, `variable`, `image`, `icon`, `photo`, `signature`, `qr`). Common base: `id`, `xMm`, `yMm`, `widthMm`, `heightMm`, `rotation` (default 0), `zIndex`. Text/variable members add typography mixin (`fontFamily`, `fontSizePt`, `fontWeight` 400|500|600|700, `color` hex-6 regex, `align` left|center|right). Variable adds `variableKey` from catalog enum. Image adds `url`. Icon adds optional `emoji`/`url`.
  - `ID_CARD_GEOMETRY` typed const: content 86×54mm, bleed 90×58mm, bleed margin 2mm, sheet 200×300mm, 4 pairs/sheet.
  - `TEMPLATE_VARIABLES` catalog: 15 FISHERFOLK vars + 11 VESSEL vars + 3 SHARED vars; each entry `{key, label, group, kind}`.
  - `templateVariableKeySchema` Zod enum derived from catalog.
  - `idTemplateCreateSchema` / `idTemplateUpdateSchema` — `frontElements`/`backElements` upgraded from `z.array(z.record(z.string(), z.unknown()))` to `z.array(idElementSchema)`.
- **`apps/web/src/lib/__tests__/id-element-schema.test.ts`** — 19 Vitest unit tests covering: all 7 element types pass; default rotation; rejection of unknown type / missing mm fields / bad hex / unknown variableKey / non-URL; geometry constant correctness; bleed = content + 2×margin; variable catalog completeness and all keys pass templateVariableKeySchema.
- **Validation**: typecheck ✅ (0 errors), test ✅ (178 pass / 21 DB-skip, 19 new), lint ✅, db:generate ✅ unaffected.
- **Code-review gate**: ran; 1 in-scope finding (icon validation gap — `.refine()` inside discriminatedUnion returns ZodEffects, Zod v3 requires ZodObject members) documented in code comment; deferred to application layer in S2+. 3 out-of-scope deferred items logged.

### Completed this session (SD — ID Generator docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 ID Generator entry with 6 locked sub-decisions (a–f): (a) typed discriminated-union element schema (text/variable/image/icon/qr/photo/signature, mm-based, 86×54mm/90×58mm); (b) Template Editor adminProcedure + dnd-kit DOM/CSS-mm NOT canvas; Select & Print = encoder+admin; (c) DOM+@media print, 200×300mm PVC sheet, back mirrored scaleX(-1), empty dashed placeholders; (d) Select & Print checkout blocks missing photo OR signature; (e) IDPrintBatch entity per print run; (f) printing decoupled from 'ID Released' (markIdReleased stays separate Wave 1 action). Two open [WHAT] questions flagged for owner (vessel IDs scope, Daily-Ops widget timing).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added Batch 4 — ID Generator / ID Card Printing section (schema/entities, template editor, select & print, open [WHAT] questions); updated DECISIONS_LOG.md count 16→17.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S0)

- **Prisma schema** — `RegistrationRenewal` model added; `Fisherfolk` extended with `idReleasedAt`/`idReleasedById`/`idReleasedBy`/`renewals`; inverse relations wired on `User` and `Tenant`.
- **Migration** — `20260701000000_registration_renewal_and_id_released` (additive: CREATE TABLE + 2 ADD COLUMN).
- **Prisma client** regenerated (v6.19.3).
- **Typecheck** passes (0 errors).

### Completed this session (SD — docs wave)

- **DECISIONS_LOG.md** — appended 2026-07-01 entry with 5 locked sub-decisions (a–e): ID-release manual staff action, NEW/RENEWED badge derivation from `_count.renewals`, renew mutation rules (encoder role + active-violation block + AuditAction.RENEW), new entities (RegistrationRenewal + Fisherfolk.idReleasedAt/idReleasedById), activity timeline sanitization policy (action/actor/timestamp only, no diffs, protectedProcedure).
- **CHANGELOG_AI.md** — appended SD wave entry.
- **IMPLEMENTATION_MAP.md** — added NEW/RENEWED badge row to Batch 1b list table; added 4 pending (⏳ S1+) rows to Batch 3 profile table for renew mutation, markIdReleased mutation, renewal timeline panel, and right-side activity timeline.
- **docs/PRODUCT.md** — NOT touched (`git diff` confirms zero changes; Rule 1 preserved).

### Completed this session (S1 — tRPC backend wave)

- **Shared Zod schemas** — `fisherfolkRenewSchema`, `fisherfolkMarkReleasedSchema`, `fisherfolkActivityQuerySchema` added to `@frms/shared`.
- **`fisherfolk.renew`** (encoderProcedure) — active-violation PRECONDITION_FAILED guard; duplicate-year CONFLICT guard (inside `$transaction`); creates `RegistrationRenewal` + flips `status→RENEWED` + `auditLog(RENEW)` all atomic in one transaction.
- **`fisherfolk.markIdReleased`** (encoderProcedure) — idempotent (early-return if already set); `$transaction` wraps `fisherfolk.update` + `auditLog(UPDATE)`.
- **`fisherfolk.getActivity`** (protectedProcedure) — tenant+entity scoped; sanitized output `{id, action, actorName, createdAt}` — no before/after diffs.
- **`list` select** extended: `+idReleasedAt`, `+_count.renewals` for badge derivation.
- **`getById` include** extended: `+renewals` (take:20, desc) with `renewedBy{name,email}`.
- **Tests** — 5 DB-integration tests in `src/server/trpc/routers/__tests__/fisherfolk.test.ts` (skip in CI; run locally with DATABASE_URL).
- Commit `a9f48c5` on `swarm/registration-status-timeline`.

### Completed this session (S2 — list badge columns)

- **`FisherfolkListItem` interface** extended with `idReleasedAt: string | null` and `renewalCount: number`.
- **Registration-Type column** added to fisherfolk list: derives NEW (renewalCount===0) or RENEWED (renewalCount>0); renders `<StatusBadge>` with explicit color override (green/orange) — does NOT fall through to `statusColorMap`.
- **ID-Release column** added: idReleasedAt null → gray "Not Released" badge; non-null → green "Released" badge with tooltip showing the formatted release date.
- **`fisherfolk-list-client.tsx`** updated to explicitly map tRPC items to `FisherfolkListItem`, converting `idReleasedAt` (Date|null via superjson → ISO string|null) and `_count.renewals` → `renewalCount`.
- lint/build/typecheck all green; code-review gate ran (1 in-scope finding fixed: `String()` → direct pass-through for non-Date idReleasedAt values).
- Commit on `swarm/registration-status-timeline`.

### Completed this session (S3 — profile UI wave)

- **Two-column shell** — `grid gap-6 lg:grid-cols-[1fr_320px]` wrapping LEFT main column (Profile + Renewal History + related records) and RIGHT `<aside aria-label="Activity timeline">` placeholder Card (S4 will render the feed).
- **Registration status line** in header: 0 renewals → NEW (green badge) + "New registration"; ≥1 → RENEWED (orange badge) + "Last renewed [date]"; always shows original `dateJoined`.
- **Renewal History Card** (left column): lists `record.renewals` (year · renewedAt · who · notes); empty state "No renewals yet."
- **ID-Release line** inside Profile Card fields: Released (date + who) or "ID not yet released" from `record.idReleasedAt` / `record.idReleasedBy`.
- **Action buttons** (encoder/admin/super_admin only via `trpc.user.me`): Renew Registration (disabled+tooltip when active violation; uses shared `ConfirmDialog`; on success invalidates `getById`; toast on success/error; dialog stays open on error via re-throw); Mark ID Released (hidden once `idReleasedAt` set; uses `ConfirmDialog`).
- **`getById` router** extended: added `idReleasedBy: { select: { name, email } }` to support "Released by [name]" display.
- **Code review fixes**: used shared `ConfirmDialog` instead of inline Dialog (removes redundant open/loading state); added visible placeholder Card to `<aside>` to prevent empty landmark WCAG issue; dialog stays open on mutation error (re-throw pattern).
- lint/typecheck/build all green.

### Completed this session (S4 — activity timeline aside)

- **`fisherfolk-activity-timeline.tsx`** (new client subcomponent under `[id]/`) — queries `fisherfolk.getActivity`; renders semantic `<ol>/<li>` feed (newest-first); each entry: WHO (actorName), WHAT (label + aria-hidden icon), WHEN (`<time dateTime>`); `lg:sticky lg:top-4`; loading skeleton (WCAG: `role="status"` + sr-only text + `aria-hidden` ol); empty state; `motion-reduce:animate-none` on pulse animations.
- **`fisherfolk-detail-client.tsx`** — aside placeholder replaced with `<FisherfolkActivityTimeline id={id} />`.
- lint/build both green.

### Completed this session (S5 — QA / validation gate)

- **typecheck** ✅ (0 errors), **lint** ✅ (0 warnings), **test** ✅ (159 pass / 21 skip-DB), **build** ✅
- **db:generate** ✅ (Prisma v6.19.3); **S0 migration** confirmed additive-only (ADD COLUMN + CREATE TABLE, no DROP/ALTER)
- **WCAG 2.2 AA** — code-level audit green: list badge columns (text-not-color-only, StatusBadge renders label text); profile registration-status badge + accompanying text + `<ul aria-label="Renewal history"><li>` + RBAC-gated action buttons with aria-labels + disabled tooltip `tabIndex+aria-label`; activity timeline `<ol aria-label="…"><li>` + `<time dateTime>` + `aria-hidden` icons + `role="status"` skeleton + `motion-reduce:animate-none`; `<aside aria-label="Activity timeline">`.
- **RBAC** — `renew` and `markIdReleased` are `encoderProcedure` (FORBIDDEN for viewer/bantay_dagat); `renew` writes RegistrationRenewal + flips status→RENEWED + AuditAction.RENEW atomically; `markIdReleased` idempotent; `getActivity` tenant-scoped, sanitized output (no before/after).
- **Code-review fixes applied** (2 in-scope findings):
  1. `fisherfolk-detail-client.tsx` — added `utils.fisherfolk.getActivity.invalidate({ id })` to `handleRenew` and `handleMarkReleased` (stale timeline fix)
  2. `fisherfolk.ts:574` — `log.user?.name ?? log.user?.email ?? null` defensive null-guard
- **Playwright smoke** — 17/17 checks pass (port 44387): list New/Renewed + Released/Not-Released badges ✅; profile status badge + Renewal History card + Activity Timeline aside ✅; Renew flips badge→RENEWED + renewal-history row inline ✅; timeline RENEW entry visible after reload ✅ (inline reactivity gap confirmed — addressed by S5 code-review fix). ⚠ Migration drift: dev DB frozen at June 29 migration; smoke agent applied S0 migration manually — `prisma migrate deploy` MUST run on any QA env before testing.

### Open / pending

- `formatAbsolute`/`formatDate` shared utility extraction (multi-file duplication) — deferred refactor (bucket A follow-up)
- `hasActiveViolation` is derived from `violations take:5` in getById — if a fisherfolk has >5 violations and the 6th is active, the Renew button won't show disabled (server still blocks; UX degrade only). Fix: add `activeViolationCount` field to getById (deferred).
- Performance indexes (deferred from S0 code review): `@@index([tenantId, renewalYear])` on RegistrationRenewal; index on `fisherfolk(id_released_by_id)`
- TOCTOU on violation check in `renew` (violation.count is pre-transaction; low-probability race) — architectural fix deferred
- `_count.renewals` on `list` runs a COUNT subquery on all list callers including autocomplete dropdowns — consider splitting to a lean `listSummary` for dropdowns (deferred, needs API split)

### Main branch state

`main` is clean at `08f9054` (back-port candidates A–I). All prior PRs (#1–#9) merged.

### Deployment gate

HARD HOLD — no staging/production deploy until owner explicitly authorizes.
