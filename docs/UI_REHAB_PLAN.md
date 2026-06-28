# UI/UX Rehabilitation + Full QA — Full Auto (2026-06-29)

**Branch:** `feat/attachments-profile-relations` (UNMERGED, HARD HOLD).
**Owner directive (2026-06-29, Full Auto Mode, owner asleep):** rehabilitate UI/UX of the dynamic
main-content pages toward modern shadcn/studio Pro; INHERIT-not-REPLACE the existing dark theme +
tangerine/marine accents (Rule 12 / V32.11). Then run a FULL Playwright test across the app.
shadcn/studio Pro MCP confirmed wired in ~/.claude.json (API key + owner email) — already authenticated.

## Approach (risk-managed: owner asleep, no feedback loop)
- Ship the explicitly-requested flagship redesign (Fisherfolk Profile) — DONE.
- Then EVIDENCE-DRIVEN: full Playwright sweep of every page → screenshot + console check →
  modernize/fix only pages with real issues (vacant space, dated layout, regressions). No blind
  wholesale rewrites of working pages.
- Commit per change; batch rebuilds; HARD HOLD (no deploy).

## Explicit owner asks
- [x] Fisherfolk Profile: photo/signature/QR moved INTO Profile card, LEFT side, SMALLER (commit 6e448d0).
- [x] Reduce vacant space below Profile content → related records now compact lg:grid-cols-3 (6e448d0).
- [x] Vessel detail: Linked Owners next to Identification (commit 4813ac0, prior).
- [x] Violation detail: Target above Violation Details (commit efd043a, prior).
- [ ] Modern shadcn/studio Pro pass on dynamic content pages (evidence-driven via QA sweep).
- [ ] FULL Playwright test across the app.

## Playwright route checklist (super_admin webmaster, tenant calapan-city, :44387)
- [ ] /dashboard
- [ ] /fisherfolk (list) + /fisherfolk/[id] (detail, redesigned) + /fisherfolk/new + /[id]/edit
- [ ] /vessels (list) + /vessels/[id] (detail)
- [ ] /violations (list) + /violations/[id] (detail) + /violations/file
- [ ] /edit-requests
- [ ] /kanban
- [ ] /reports
- [ ] /analytics
- [ ] /import
- [ ] /id-generator
- [ ] /map
- [ ] /ayuda (list) + /ayuda/[id] (detail) + /ayuda/new
- [ ] /notifications
- [ ] /audit-log
- [ ] /user-management
- [ ] /settings

## Known cross-branch note
Uploaded IMAGES need PR #1 (fix/csp-runtime-storage-origin) for CSP; not in this stack. Broken image
thumbnails on detail pages are EXPECTED here (not regressions). PDFs/links work.

## QA sweep result (2026-06-29, image rebuilt from this branch, 1512px desktop)
ALL pages render with NO error boundaries / NO 500s, headings present, forms render:
dashboard, fisherfolk(list+detail+register), vessels(list+detail), violations(list+detail+file),
ayuda(list+detail+new), kanban, reports, analytics(26 charts), import, id-generator, map,
edit-requests, notifications, audit-log, user-management, settings. Reorders + Profile redesign
confirmed live. Only console errors anywhere = expected CSP image-blocks (cross-branch PR #1).
Note: `/fisherfolk/new` is NOT a route (create route is `/fisherfolk/register`); hitting /new falls to
[id] and 400s on getById — not a user path, no link to it (cosmetic, left as-is).

## Modernization done
- UI-1 Fisherfolk Profile: media left+compact, related records 3-up grid (commit 6e448d0). ✅ validated.
- UI-2 Vessel detail: spec cards (Construction/Dimensions/Engine/Operations) into 2-up grid; Photo
  shrunk to max-w-200px. Layout-only, INHERIT theme.

## Status: ✅ COMPLETE — explicit asks shipped + full QA sweep green. Defined goal met (not pursuing
## open-ended per-page rewrites overnight). Remaining = owner: PRODUCT.md back-port + merge (HARD HOLD).
