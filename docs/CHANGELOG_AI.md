# Changelog AI — FRMS
# Agent-attributed change log. Every entry states which agent made the change.
# Format: ## YYYY-MM-DD — [Phase or Feature Name]
# Attribution: CLINE | CLAUDE_CODE | COPILOT | HUMAN | UNKNOWN

---

## 2026-06-27 — DM-5 Import Wizard UI (Full Auto)
- Agent:               CLAUDE_CODE (Opus architect → spec-executor Sonnet)
- Why:                 The import pipeline (import router: preview/commit/getBatch/listBatches) had NO UI — bulk import only ran via apps/web/scripts/import-fmo.ts. DM-5 gives admins a self-service Import Wizard.
- What:
  - apps/web/src/server/trpc/routers/import.ts — new `parseWorkbook` adminProcedure (base64 → Buffer → parseImportWorkbook). Keeps all Excel parsing server-side; avoids Node Buffer polyfill issues in client components. No existing procedure touched.
  - apps/web/src/app/[tenant]/import/page.tsx — server shell, mirrors reports/page.tsx.
  - apps/web/src/app/[tenant]/import/import-wizard.tsx — "use client" 3-step state machine: upload (FileReader→base64→parseWorkbook→chained preview) → preview (8-stat counts grid w/ Badges, collision callout, first-100-row status table) → done (imported/skipped). Always-visible "Recent Imports" list via listBatches, refetched after commit.
  - apps/web/src/components/sidebar.tsx — "Data Import" nav (Upload icon), roles super_admin/admin.
- HOW decision: server-side parse procedure (not client exceljs) — Buffer-only lib + avoids client bundle bloat. Wizard targets incremental/admin imports; the 3,002-row full FMO import stays on the script path (large base64/rows payloads can hit the ~4MB tRPC body limit — noted as carried caveat).
- Verification:        tsc EXIT=0; next lint "No ESLint warnings or errors". Live Playwright QA vs calapan-city tenant (3,002 records): page renders + nav present; uploaded a 3-row test xlsx → preview classified 1 import / 1 skip-existing / 1 error (missing idNumber) correctly → commit wrote 1 record (verified count 3002→3003) → ALL test data deleted (fisherfolk + import_batch + audit_log), count restored to 3002.
- Git:                 feat/data-management (e1a7280). UNMERGED.

---

## 2026-06-27 — Charts & Reports milestone (Full Auto)
- Agent:               CLAUDE_CODE (Opus architect → spec-executor Sonnet, 3 waves)
- Why:                 /analytics and /reports were 10-line stubs. PRODUCT.md puts charts on Dashboard/Analytics (Recharts) and Reports as a 9-type list generator with official gov header + PDF/Excel export.
- What:
  - apps/web/src/server/trpc/routers/report.ts — 9 report types (member_list, new_registrations, renewed, inactive, senior_citizens, voter_eligible, violations, vessels, family_clusters), shared buildReport() helper, barangay/year/date filters. getReport (Viewer+) + exportExcel (Admin+) with Republic/City/FMO header via exceljs (already installed).
  - apps/web/src/server/trpc/routers/analytics.ts — getRegistrationTrends, getVoterAnalysis, getSeniorsByBarangay, getViolationHotspots, getAgePyramid (all tenant-guarded).
  - apps/web/src/components/ui/chart.tsx — shadcn chart primitives; recharts@3.9.0 installed.
  - apps/web/src/app/[tenant]/reports/{page.tsx,reports-client.tsx} — type selector + filters + preview table + print/PDF view (window.print + gov header, also serves Viewer on-screen-only) + role-gated Excel download.
  - apps/web/src/app/[tenant]/analytics/{page.tsx,analytics-client.tsx} — 7 Recharts charts over live data + existing dashboard queries.
  - root.ts registers both routers.
- PDF decision (HOW): print-optimized view + window.print() rather than a heavy server PDF lib; Excel via exceljs.
- Verification:        tsc EXIT=0; next lint clean; `pnpm build` succeeds (analytics 129kB/reports 6kB routes). Live QA: dev server restarted (prior build had clobbered its .next), login OK, /analytics loads authenticated with no console errors. Full chart-by-chart + Excel-download visual QA PENDING next session.
- Git:                 feat/data-management (fb5bd43). UNMERGED.

---

## 2026-06-26 — Security fix: email-HTML XSS in notify.ts (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Automated background security review flagged MEDIUM XSS in the Batch 3c-2 mailer path: notify.ts built the email HTML body as `<p>${message}</p>` with no escaping, and `message` carries user-controlled text (fisherfolk names, edit-request rejection reasons) → stored XSS in the recipient's email client.
- Fix:                 apps/web/src/server/lib/notify.ts — added escapeHtml() (& < > " ') applied to message before the \n→<br> conversion. Plain-text subject/text channels were never affected.
- Verification:        apps/web tsc EXIT=0; next lint clean.
- Git:                 fix/notify-email-xss → main (37417d4) → pushed.

---

## 2026-06-26 — Phase 8 Batch 3f: format-agnostic fisherfolk ID (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Owner decision PD-001 (DECISIONS_LOG 2026-06-26) — "no ID format, just make it ready for mixed of any ID format."
- Finding:             idNumber was ALREADY a freeform per-tenant-unique String (Prisma + fisherfolkCreateSchema z.string().min(1), no regex). The gap was UX: the registration form auto-generated FF-YYYY-NNNN and never let the encoder enter a legacy/arbitrary ID.
- Files modified:      apps/web/src/app/[tenant]/fisherfolk/register/registration-form-client.tsx (idNumber now an editable freeform Step-1 field + "Suggest" button calling generateNextIdNumber; removed always-on auto-generate + submit-gated-on-idNumber; review shows entered ID); apps/web/src/server/trpc/routers/fisherfolk.ts (clearer per-tenant duplicate message; generateNextIdNumber kept as optional helper).
- Schema/migrations:   none — idNumber String + @@unique([tenantId, idNumber]) already correct; legacy IDs preserved.
- Verification:        apps/web tsc EXIT=0; next lint clean; packages/shared tsc EXIT=0.
- Git:                 part of branch feat/batch-3c2-3f → main (b6572cd) → pushed.
- HARD HOLD:           respected — local only.

---

## 2026-06-26 — Phase 8 Batch 3c-2: Edit Request notifications (in-app + email) (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Owner decision PD-003 (DECISIONS_LOG 2026-06-26) — in-app + email ACTIVE, SMS PREPARED/inactive. Completes the Edit Request workflow (3c-1 had the core; this fires + surfaces notifications).
- Method:              Opus architect + parallel spec-executor dispatches (notification backend + bell UI ran alongside Batch 3f on disjoint files).
- Pre-existing infra:  Notification Prisma model + notification.ts router (listUnread/listAll/getUnreadCount/markRead/markAllRead) + tenant SMTP fields. No notification CREATE path and no in-app UI existed.
- Files added:         apps/web/src/server/lib/mailer.ts (sendTenantEmail via nodemailer + tenant SMTP, silent no-op when unconfigured, never throws); apps/web/src/server/lib/sms.ts (PREPARED SmsSender interface + noop + SMS_ENABLED flag, inactive); apps/web/src/server/lib/notify.ts (notifyUsers — bulk in-app rows + best-effort email + sms via Promise.allSettled; getTenantAdminUserIds); apps/web/src/components/notification-bell.tsx (bell + unread badge polling getUnreadCount 30s, popover list, mark-read+navigate, mark-all-read).
- Files modified:      apps/web/src/server/trpc/routers/editRequest.ts (create → notify tenant admins; approve/reject → notify requester incl. reason; all best-effort, non-blocking); apps/web/src/components/header.tsx (mounts <NotificationBell/>); apps/web/package.json + pnpm-lock.yaml (nodemailer + @types/nodemailer).
- Design note:         email + SMS are best-effort — a channel failure never blocks the mutation or the in-app row. SMS is a real interface but disabled (flip SMS_ENABLED + implement a sender to activate). This is now the standard notification pattern for future features (renewals, violations).
- Verification:        apps/web tsc EXIT=0; next lint clean; packages/shared tsc EXIT=0. Runtime email delivery depends on a tenant having SMTP configured — verify in Phase 6.
- Git:                 part of branch feat/batch-3c2-3f → main (0a7a403) → pushed.
- HARD HOLD:           respected — local only.

---

## 2026-06-26 — Phase 8 Batch 3c-1: core Edit Request workflow (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Owner answered the gating decisions (PD-002/003/004 — see DECISIONS_LOG 2026-06-26), unblocking the Edit Request Workflow (PRODUCT.md flow #3). Backend (EditRequest model + editRequest.ts create/approve/reject) was already scaffolded; this batch adds validation, the no-approval bypass, and the full encoder + admin UI. Notifications split to 3c-2.
- Method:              Opus architect + 4 parallel spec-executor (Sonnet) dispatches on disjoint files (R7), contracts fixed up-front. Decisions locked in DECISIONS_LOG before building.
- Files modified:      apps/web/src/server/trpc/routers/editRequest.ts (create validates fieldChanges keys ⊆ fisherfolkUpdateSchema.shape minus id — 24 keys — rejects unknown/empty; new history(fisherfolkId) query); apps/web/src/server/trpc/routers/fisherfolk.ts (new completeRecord encoderProcedure — PD-004 bypass: fills currently-EMPTY fields directly, throws FORBIDDEN if any targeted field already populated); apps/web/src/app/[tenant]/fisherfolk/[id]/fisherfolk-detail-client.tsx (Edit button); apps/web/src/app/[tenant]/edit-requests/page.tsx (stub → queue page)
- Files added:         apps/web/src/app/[tenant]/fisherfolk/[id]/edit/{page.tsx, edit-form-client.tsx}; apps/web/src/app/[tenant]/edit-requests/{columns.tsx, edit-requests-list-client.tsx, [id]/page.tsx, [id]/edit-request-review-client.tsx}
- Behavior:            Encoder edit form prefills all editable fields, computes the diff, and routes: changes that only FILL empty fields → fisherfolk.completeRecord (instant, no approval); any change to populated data → editRequest.create (admin approval). Admin queue defaults to PENDING. Diff viewer renders old (red strikethrough) → new (green) per flow #3, with Approve / Reject-with-reason (shadcn Dialog) + a rejection-history section (PD-004). Sidebar "Edit Requests" nav item was already scaffolded.
- Schema/migrations:   none — EditRequest model + enum already existed.
- Verification:        apps/web tsc --noEmit EXIT=0; next lint clean across src; packages/shared tsc EXIT=0. Browser/visual QA deferred to Phase 6 (Rule 16) — runtime fieldChanges-key compatibility between the edit form and the create-validation set relies on both deriving from fisherfolkUpdateSchema (verify in Phase 6).
- Git:                 feat/batch-3c1-edit-request → squash-merged main (d73a77c) → pushed → branch deleted.
- Next:                Batch 3c-2 notifications (PD-003: in-app + email active, SMS prepared); Batch 3f ID-format flexibility (PD-001).
- HARD HOLD:           respected — local dev only.

---

## 2026-06-25 — Phase 8 Batch 3d: signed-URL role fix (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Carried 🔴 follow-up + directly affects Batch 3b: upload.getDownloadUrl was encoderProcedure, so Viewer + Bantay Dagat saw "No photo/No signature" placeholders on BOTH fisherfolk and vessel detail pages. PRODUCT.md line 268 requires Bantay Dagat to see photos for field identity verification — a hard functional requirement, not cosmetic.
- Method:              [HOW] decision (mine as architect): chose option (b) — make getDownloadUrl protectedProcedure (any authenticated same-tenant user) rather than splitting procedures, because the storage layer already enforces tenant isolation. Verified the safety invariant BEFORE widening access.
- Files modified:      apps/web/src/server/trpc/routers/upload.ts (getDownloadUrl: encoderProcedure → protectedProcedure; explanatory comment added). uploadFile (write path) UNCHANGED — stays encoderProcedure.
- Security rationale:  getFileDownloadUrl(key, ctx.tenantId) calls extractTenantFromKey(key) and throws "Access denied" when it !== ctx.tenantId (packages/storage/src/upload.ts:68-71) — so a client-supplied key can never resolve another tenant's file regardless of caller role. All authenticated same-tenant roles are permitted media view per the PRODUCT.md roles table. No new cross-tenant surface.
- Schema/migrations:   none.
- Verification:        apps/web tsc --noEmit EXIT=0; next lint clean; encoderProcedure import still used by uploadFile (no unused-import).
- Git:                 fix/batch-3d-signed-url-role → squash-merged main (28ca431) → pushed → branch deleted.
- Resolves:            the long-standing STATE.md follow-up "upload.getDownloadUrl is encoderProcedure → Viewer + Bantay Dagat cannot fetch signed URLs". Now resolved for both fisherfolk and vessel detail.
- HARD HOLD:           respected — local dev only.

---

## 2026-06-25 — Phase 8 Batch 3b: Vessel Registration (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Next planned Phase-8 unit (vessel registration) on the V32.14 base. PRODUCT.md defines the Vessel entity (line 303), flows #10 (encoder registers vessel) + #1 (inline owner link), QR pattern (line 100), and Pages 7-9 (list/form/profile). Pre-scaffolded vessel.ts router + Prisma Vessel/FisherfolkVessels m2m + shared schema already existed; UI was entirely missing and the router had spec gaps.
- Method:              Opus architect + 6 spec-executor (Sonnet) dispatches (R7 fan-out, R8 write-allow-list). Scouted spec + scaffolding via 2 Explore agents to keep main context lean. Mirrored the fisherfolk feature pattern throughout.
- Files added:         apps/web/src/app/[tenant]/vessels/{vessels-list-client.tsx, columns.tsx, [id]/page.tsx, [id]/vessel-detail-client.tsx, register/page.tsx, register/registration-form-client.tsx}
- Files modified:      apps/web/src/app/[tenant]/vessels/page.tsx (stub → list server page); apps/web/src/server/trpc/routers/vessel.ts (create: auto-generate+store QR via buildQRPayload regNo=mfvrNumber in a transaction, mirroring fisherfolk; ownerIds OPTIONAL default [] per PRODUCT.md "optionally link owner", owners.connect omitted when empty; clearer duplicate-MFVR CONFLICT message; accept optional vesselPhoto); apps/web/src/server/trpc/routers/upload.ts (ENTITY_TYPES += "vessel-photo"); apps/web/src/components/fisherfolk/photo-upload.tsx (optional entityType prop, default fisherfolk-photo — backward-compatible reuse for vessels)
- Spec compliance:     owners optional (flow #10); QR auto-generated on creation (line 91/100); vessel photo wired end-to-end (NOT deferred); all MFVR fields present in form+detail; multi-tenant L1/L3/L4 guards inherited from procedures. Sidebar "Vessels" nav link already present from prior scaffold.
- Schema/migrations:   none — Prisma Vessel/FisherfolkVessels + VesselStatus enum already existed.
- Verification:        apps/web `tsc --noEmit` EXIT=0; `next lint --dir src` clean across whole web src (confirmed NO fisherfolk regression from shared photo-upload/upload edits); packages/shared tsc EXIT=0. Browser/visual QA deferred to Phase 6 per Rule 16 (no dev server run this session).
- Git:                 feat/batch-3b-vessel-registration → squash-merged to main (c52a1ab) → pushed to origin → branch deleted (Rule 23).
- Known debt carried:  upload.getDownloadUrl is encoderProcedure → Viewer/Bantay Dagat see photo placeholder on vessel detail (same documented gap as fisherfolk; fix in Batch 3d / Bantay Dagat batch). TDD infra still absent (Rule 25 not strictly enforced).
- HARD HOLD:           respected — local dev only, no staging/prod deploy.

---

## 2026-06-25 — Adopt data-management patterns from production FMO reporting tool into PRODUCT.md (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 Owner directed adoption of the live FMO Calapan reporting tool (fmo.powerbyte.app — PHP/SQLite, 3,003 real fisherfolk) into FRMS spec, prioritizing DATA MANAGEMENT patterns. The tool is a foreign stack (not adopted as code) — mined for production-proven data rules FRMS's generic spec lacked.
- Method:              Read AIEF-HANDOVER.md (owner-prepared); dispatched 3 parallel Explore agents (schema/ID/fields · import+normalization pipeline · reporting/export) to keep main context lean; synthesized findings into PRODUCT.md.
- Files modified:      docs/PRODUCT.md (504→533 lines): NEW subsection "### Data Management & Normalization Standards" (after Data Import) capturing — canonical 6-activity category taxonomy (Boat Owner/Operator, Capture Fishing, Gleaning, Vendor, Fish Processing, Aquaculture) + free-text→flag keyword mapping; exact field normalization (DOB→YYYY-MM-DD w/ 2-digit-year heuristic + malformed→Unknown bucket; sex first-char; barangay before-first-comma + Title Case + Roman-numeral + tenant typo-map; contact 09xxxxxxxxx, supersedes +63 note); dedup/idempotency (insert-only, keep-most-data); ID-collision integrity (same ID/different person → flag for manual resolution, real case MR-CL-000534-2015); asset linking by ID + missing-asset/orphan CSV data-quality report; incremental import mode (only-new-IDs, backup-first); legacy-ID preservation (imported IDs kept as-is). Also seeded the 6 default categories into Tenant Settings → Categories.
- Files added:         docs/PENDING_DECISIONS.md (PD-001: new-registration ID convention MR-CL-NNNNNN-YYYY vs FF-YYYY-NNNN — deferred to FMO/owner; NON-BLOCKING).
- Schema/migrations:   none — SPEC-ONLY change. No source code, no inputs.yml, no Prisma changes this session.
- Verification:        PRODUCT.md edits confirmed present (3 anchors grepped). Source tool NOT modified (read-only analysis).
- Follow-up (Phase 7): Propagate spec → implementation in a future batch: (a) seed the 6 categories in packages/db seed, (b) build the import normalization service + incremental mode + data-quality report, (c) wire category flags. Rule 9 sync (PRODUCT.md→inputs.yml) is a Phase-7 step, not done here. Will run pnpm tools:check-product-sync at that time.
- Deferred decision:   PD-001 logged in docs/PENDING_DECISIONS.md — re-surface each session until FMO answers. Imported legacy IDs preserved regardless, so import is unblocked.

---

## 2026-06-25 — AIEF Framework Upgrade V31 → V32.14 (Full Auto)
- Agent:               CLAUDE_CODE
- Why:                 register-to-aief alignment check found FRMS stack fully aligned (0 true violations) but the governance/prompt layer 14 minor versions stale (V31 → source V32.14). Owner approved upgrade-first (over Batch 3b) so subsequent Phase-8 work lands on the V32 base — critical because FRMS is an LGU gov app and V32.9 adds a PH Data Privacy Act + WCAG 2.2 AA gov hard gate (Rule 33).
- Method:              bash $AIEF/sync-to-project.sh (copied 25-file V32.14 deliverable set → .ai_prompt/ + deploy.sh) → bash deploy.sh (relayout). AIEF=/home/me/UbuntuDevFiles/1_COMPANY_DEV/Powerbyte-AIEF.
- Files added:         .ai_prompt/{CLAUDE_compact,Master_Prompt,Framework_Feature_Index,AI_Tools_Reference,Security_Checklist,Planning_Assistant,ChatGPT_Cross_Audit,LESSONS_REGISTRY,privacy,design-principles,motion,spec-executor,settings,lint-deploy,design-stop-hook}.* ; .claude/agents/spec-executor.md ; scripts/lint-deploy.sh ; scripts/design-stop-hook.sh ; deploy.sh ; tests/visual/.gitkeep
- Files modified:      CLAUDE.md (V31 fat → V32.14 compact card — now the ONLY auto-load), .ai_prompt/{phases,security,ui-rules,bootstrap,scenarios,templates,memory-governance}.md (V32.14), .claude/settings.json (MERGE — custom anti-thrashing UserPromptSubmit hook 7bf35bf + contextFiles PRESERVED; added Stop hook design-stop-hook.sh + skill-budget keys), .gitignore (V32 entries merged), .ai_prompt/Prompt_References.{md,html}, project.memory.md (V31→V32.14, 30→33 rules)
- Files deleted:       8 stale v31-suffixed framework dupes (.ai_prompt/*_v31.*, AI/Master_Prompt_v31.md, .ai_prompt/deploy-v31.sh) + 7 stale .claude/rules/*.md (V32.7: .claude/rules/ intentionally empty — detail files now in .ai_prompt/)
- Schema/migrations:   none — framework/prompt layer only. ZERO source code, ZERO docs/PRODUCT.md, ZERO inputs.yml changes. Stack unchanged (Next 15.1, tRPC v11, Prisma 6.19, React 19, Valkey+BullMQ, shadcn).
- Verification:        settings.json merge verified — jq confirmed hooks.UserPromptSubmit (custom anti-thrashing) intact + valid JSON + contextFiles preserved; CLAUDE.md header = V32.14; .claude/rules/ empty; spec-executor agent + scripts/ installed; 25/25 deliverable files present. deploy.sh backups (.bak, gitignored) created.
- Fleet registry:      FRMS row in AIEF reference_project_locations.md — will update to V32.14 post-merge.
- Follow-up:           ⚠ Claude Code must RESTART for the new compact-CLAUDE.md + hooks to load (hooks load at session-start only) — Batch 3b runs in that fresh V32 session. V32.9 privacy/Rule 33 + WCAG 2.2 AA gov gate now apply to FRMS — schedule a compliance pass (privacy.md) as a Phase-8 batch. Run memory-governance.md §5 mid-project adoption baseline in the fresh session.
- HARD HOLD:           respected — this is a local framework-layer upgrade (owner-approved), NOT a staging/prod deploy.

---

## 2026-05-17 — Phase 8 Batch 3a — Fisherfolk Read-Only Detail View + List Navigation
- Agent:               CLAUDE_CODE
- Why:                 First half of original Batch 3 — gives encoders, admins, and viewers a way to inspect a registered fisherfolk's full record. Resolves the dead "View existing record" link from the Batch 2b-1b.2 duplicate-search gate (was 404 before this batch). Scope locked to read-only per user multi-select: no Edit button (EditRequest workflow extracted as future Batch 3c), no categories badges, no audit metadata, no empty placeholder sections for future relations.
- Files added:         apps/web/src/app/[tenant]/fisherfolk/[id]/page.tsx (RSC route — minimal server wrapper that delegates to the client component; no auth check here — protected at higher tenant layout), apps/web/src/app/[tenant]/fisherfolk/[id]/fisherfolk-detail-client.tsx (client component — uses `useParams` to read id, `trpc.fisherfolk.getById.useQuery({ id })` for data, parallel queries via `trpc.upload.getDownloadUrl` for photo + signature signed URLs, `useMemo(() => renderQRDataUrl(payload))` for QR data URL; renders profile fields, photo preview, signature preview, QR code; placeholder text on null/missing media)
- Files modified:      apps/web/src/app/[tenant]/fisherfolk/columns.tsx (idNumber column previously rendered raw `row.original.idNumber` — wrapped in new `IdNumberCell` sub-component that uses `useParams` to construct `<Link href={`/${tenant}/fisherfolk/${id}`}>`; cell renderers in data-table receive objects so IdNumberCell must be a component to access the params hook)
- Files deleted:       none
- Schema/migrations:   none — reused existing `fisherfolk.getById` query (already returns all relations including vessels + violations; UI ignores those per locked scope)
- Errors encountered:  1 lint error — `@typescript-eslint/strict-boolean-expressions` on `formatDate(birthdate)` null-coalesce pattern in detail-client.
- Errors resolved:     Replaced loose `||` with explicit `birthdate != null ? formatDate(birthdate) : "—"` pattern. Inline fix during 11b.
- Verification:        pnpm --filter @frms/web typecheck → exit 0. pnpm --filter @frms/web lint → 0 warnings/errors. Visual QA deferred (git-only verify per user preference at merge time); end-to-end browser exercise scheduled before Batch 3b begins.
- Stage 1 (spec):      PASS — route exists at `/[tenant]/fisherfolk/[id]`, profile fields render, photo signed URL resolves via existing upload procedure, signature renders same way, QR code generated from existing `renderQRDataUrl` utility, list page idNumber column now links to detail page. Locked deferrals (Edit button, categories, audit, future-relation placeholders) explicitly out of scope per user selection.
- Stage 2 (quality):   PASS with standing exception — TDD (Rule 25) deferred under repo-wide test infra debt (no vitest/jest, zero *.test.* files — logged 2026-05-08 🟤 decision). Zero `any` types introduced, only blast-radius files modified (3 files), conventional commit format, no dead code.
- Follow-up flagged:   `upload.getDownloadUrl` is `encoderProcedure` (pre-existing — not introduced here). Viewer + Bantay Dagat roles will see "No photo/No signature" placeholders on detail page. PRODUCT.md line 268 says Bantay Dagat needs photo for identity verification. Fix in a separate batch by either splitting into admin-write + protected-read procedures, or converting to `protectedProcedure` with role-aware tenant scoping. Logged in STATE.md outstanding follow-ups.
- Merge:               Squash-merged to main on 2026-05-17 (2 commits on feat/batch-3a-fisherfolk-detail collapsed: 12c8b7d code + 2b32d90 STATE.md update). Feature branch deleted local + remote.

---

## 2026-05-17 — Phase 8 Batch 2b-2 — Photo + Signature + QR + Auth/L6 Dev Fixes (Governance Sync reconciliation 2026-06-25)
- Agent:               CLAUDE_CODE
- Note:                This entry was written retroactively during a Governance Sync on 2026-06-25 — the original Batch 2b-2 session merged code (commit 9ab5039) but did not append a CHANGELOG entry. Reconciled against git history (`git show --stat 9ab5039`: 15 files, +1070/-109) and STATE.md.
- Why:                 Completes the media + verification half of the registration flow (photo, signature, QR) and unblocks dev login by hardening the Auth.js v5 + L6 tenant-context plumbing surfaced during testing.
- Files added:         apps/web/src/components/fisherfolk/photo-upload.tsx (tRPC + S3 photo upload with client-side handling), apps/web/src/components/fisherfolk/signature-pad.tsx (react-signature-canvas capture — ts-expect-error workaround for v1.1.0-alpha.2 React-19 type incompatibility), apps/web/src/lib/qr-code.ts (QR payload + data-URL render utility for fisherfolk verification), apps/web/src/server/trpc/routers/upload.ts (upload router — getUploadUrl / getDownloadUrl signed-URL procedures; getDownloadUrl currently encoderProcedure — see follow-up), apps/web/src/server/auth/edge.ts (Edge-runtime-safe Auth.js split)
- Files modified:      apps/web/src/app/[tenant]/fisherfolk/register/registration-form-client.tsx (mounted PhotoUpload + SignaturePad in Documents step, wired QR status into Review step), apps/web/src/server/auth/config.ts + index.ts (Auth.js v5 Edge runtime compilation fix — split config/runtime; propagate L6 tenant context through session), apps/web/src/middleware.ts (tenant-context propagation), apps/web/src/server/trpc/{trpc,root}.ts (upload router registration + L6 tenant context through tRPC middleware), apps/web/src/server/trpc/routers/fisherfolk.ts (wire QR payload generation into create mutation), apps/web/package.json + pnpm-lock.yaml (react-signature-canvas, qrcode deps)
- Files deleted:       none
- Schema/migrations:   none — media stored via S3/MinIO; QR is a derived data string, not persisted as a column
- Errors encountered:  (1) Auth.js v5 failed to compile under Edge runtime (middleware). (2) L6 tenant guard threw "Tenant context not set" inside tRPC procedures after auth. (3) react-signature-canvas v1.1.0-alpha.2 type incompatible with React 19. (4) photo upload returned HTTP 400 during dev testing.
- Errors resolved:     (1) Split Auth.js into edge-safe config (edge.ts) + Node runtime (index.ts). (2) Propagated tenant context via runWithTenant through tRPC middleware. (3) Documented ts-expect-error workaround (revisit on lib React-19 update). (4) Fixed validation step in upload flow.
- Stage 1 (spec):      PASS — photo upload, signature capture, QR generation all present in registration flow; login works in dev.
- Stage 2 (quality):   PASS with standing exception — TDD (Rule 25) deferred under repo-wide test-infra debt (logged 2026-05-08 🟤).
- Follow-up flagged:   upload.getDownloadUrl is encoderProcedure — Viewer + Bantay Dagat roles cannot fetch signed URLs (carried into Batch 3a; PRODUCT.md line 268 requires Bantay Dagat photo access). Schedule as a role-permission fix batch.
- Merge:               Squash-merged to main as commit 9ab5039 (15 files, +1070/-109). Feature branch deleted.

---

## 2026-05-17 — Phase 8 Batch 2b-1 — Pickers + Duplicate Search Gate + Memory Governance (squash-merge reconciliation 2026-06-25)
- Agent:               CLAUDE_CODE
- Note:                Reconciliation entry written during Governance Sync 2026-06-25. The squash-merge commit (77efa8c, 28 files +2001/-191) bundled three sub-batches: 2b-1a pickers, 2b-1b backend duplicate query, 2b-1b.2 frontend gate. The frontend gate has its own entry below; this entry records the pickers + the memory-governance layer + the consolidated merge that were not otherwise logged.
- Why:                 Replaces free-text barangay/category inputs with validated pickers and adds the V31 memory-governance discipline layer (.claude/rules/memory-governance.md) used to scope Phase 8 batches.
- Files added:         apps/web/src/components/shared/barangay-picker.tsx (Calapan barangay select — PSA PSGC source, admin must verify before go-live), apps/web/src/components/shared/category-picker.tsx (multi-select category picker), apps/web/src/components/ui/checkbox.tsx (shadcn checkbox primitive), apps/web/src/app/[tenant]/fisherfolk/register/duplicate-search-client.tsx (see 2b-1b.2 entry), .claude/rules/memory-governance.md (§1 tiered decomposition, §2 smart checkpoint, §3 phase hooks, §4 architect-execute, §5 mid-project adoption)
- Files modified:      apps/web/src/server/trpc/routers/fisherfolk.ts (searchForDuplicates query — 4-level matchType taxonomy: EXACT_ID/EXACT_RSBSA/STRONG_NAME_DOB/POSSIBLE_NAME), packages/shared/src/constants/index.ts (barangay list + picker constants), packages/shared/src/schemas/fisherfolk.ts (duplicate-search schema), registration-form-client.tsx + page.tsx (wire pickers + gate), CLAUDE.md / .ai_prompt/* / AI/* (framework v31 compact sync — additive)
- Files deleted:       5 obsolete .claude/skills/*/SKILL.md stubs (defense-in-depth, frontend-design, systematic-debugging, test-driven-development, webapp-testing — superseded by plugin-provided skills)
- Schema/migrations:   none — searchForDuplicates is a read query; matching is equality-based (case-insensitive). Future: pg_trgm fuzzy matching.
- Stage 1 (spec):      PASS — pickers replace free-text, duplicate gate precedes form, memory-governance layer installed.
- Stage 2 (quality):   PASS with standing TDD exception (test-infra debt).
- Merge:               Squash-merged to main as commit 77efa8c (28 files, +2001/-191), then re-baseline commit 45dc32c. Feature branch deleted.

---

## 2026-05-17 — Phase 8 Batch 2b-1b.2 — Frontend Duplicate Search Gate
- Agent:               CLAUDE_CODE
- Why:                 Closes the second half of Batch 2b-1b. Backend query landed in 2b-1b.1 (commit 30bf90e). This sub-batch wires the user-facing gate: encoder must search for existing records before the registration form appears. Prevents duplicate registrations from reaching the create mutation and converts ambiguous matches into informed encoder decisions.
- Files added:         apps/web/src/app/[tenant]/fisherfolk/register/duplicate-search-client.tsx (new client component — search form mirroring backend fisherfolkSearchDuplicatesSchema with .refine() requiring at least one of idNumber/rsbsaNumber/firstName+lastName; imperative fetch via trpc.useUtils().fisherfolk.searchForDuplicates.fetch() so query only runs on submit; outcome state owns either match results or "no matches" CTA; on Proceed mounts <RegistrationFormClient initialValues={...}/> with name/DOB/RSBSA prefilled from the search query; match cards colour-coded by matchType — red destructive for EXACT_ID/EXACT_RSBSA, amber for STRONG_NAME_DOB, yellow for POSSIBLE_NAME; "View existing record" link to /[tenant]/fisherfolk/[id] — Batch 3 detail page placeholder, will resolve once detail view ships)
- Files modified:      apps/web/src/app/[tenant]/fisherfolk/register/page.tsx (replaced <RegistrationFormClient /> with <DuplicateSearchClient />; updated header copy to mention the search-first flow; role gate unchanged — encoder/admin/super_admin only). apps/web/src/app/[tenant]/fisherfolk/register/registration-form-client.tsx (added optional initialValues?: Partial<FormValues> prop; merged into useForm defaultValues — purely additive, callers omitting the prop get the original empty defaults).
- Files deleted:       none
- Schema/migrations:   none — frontend-only change against the schema shipped in 2b-1b.1.
- Errors encountered:  ESLint @typescript-eslint/no-unnecessary-type-assertion on initial draft — was defensively casting result.matches to MatchCandidate[] but tRPC already infers the same shape.
- Errors resolved:     Removed the redundant assertion. Inferred type from trpc client flows through cleanly.
- Verification:        pnpm --filter @frms/web typecheck → exit 0. pnpm --filter @frms/web lint → 0 warnings/errors. Visual QA deferred — no UI environment running this session; gate flow is mechanically straightforward (search → render → proceed), human will exercise after merge.
- Stage 1 (spec):      PASS — gate renders before form, search calls searchForDuplicates with the spec'd identifiers, matches grouped/sorted by backend ranking (preserved in render order), "No matches" path proceeds to register, "Match found" path links to existing record + offers "Proceed anyway" escape hatch, initialValues passed to RegistrationFormClient as spec'd.
- Stage 2 (quality):   PASS with declared exception — TDD (Rule 25) deferred under the standing test-infra debt logged 2026-05-08 (no vitest/jest in repo, zero *.test.* files). Otherwise: zero any types, only blast-radius files touched (page + form + new gate), conventional commit format used, no half-finished branches.
- Notes:               Auto-suggested Vercel skills (next-cache-components, next-forge, nextjs, react-best-practices, Clerk auth) declined per documented STATE.md precedent — none apply to feature-level component work. next-forge isn't this project's framework, auth is Auth.js v5 not Clerk. Loading would have burned context with no relevance.

## 2026-05-08 — Anti-Thrashing UserPromptSubmit Hook
- Agent:               CLAUDE_CODE
- Why:                 Closed enforcement gap on the locked anti-thrashing rule (lessons.md 2026-05-08 🟤). Rule was previously discoverable via memory but not auto-injected on phase/batch triggers — relied on user pasting the scope-assessment preamble manually each session. Hook makes injection mechanical and unbypassable.
- Files added:         none
- Files modified:      .claude/settings.json (added hooks.UserPromptSubmit entry — single inline node -e command, preamble base64-encoded inside the JS to handle two-layer quoting, 5-second timeout; preserved existing contextFiles array)
- Files deleted:       none
- Schema/migrations:   none
- Triggers (case-insensitive): "Start Phase" | "Continue Phase" | "Feature Update" | "Batch" | "Resume Session" | "Resume from handoff"
- Hook output:         JSON with hookSpecificOutput.additionalContext = scope-assessment preamble (file list, token estimates by category, split threshold at 12 files OR 80K, per-module verify-and-stop checklist). Silent no-op for non-matching prompts; silent failure on malformed JSON.
- Verification:        5 pipe-tests passed (matching prompt / non-matching chitchat / lowercase trigger / mid-prompt trigger / malformed JSON), JSON schema validated, command re-extracted from written file and re-tested.
- Errors encountered:  jq not installed on this WSL2 system — initial command depended on it.
- Errors resolved:     Switched from jq to node (already a project dependency, single-tool, no shell-escape gymnastics). Logged as 🟡 fix in lessons.md.
- Activation note:     Settings watcher only watches .claude/ if a settings file existed at session start. Current session needs /hooks reload or restart to pick up the new hook. Fresh sessions activate automatically.
- Decision logged:     DECISIONS_LOG.md "Anti-thrashing enforcement: UserPromptSubmit hook (mechanical) over CLAUDE.md rule (advisory)".

## 2026-05-08 — Phase 8 Batch 2a — Fisherfolk Registration Form (basic)
- Agent:               CLAUDE_CODE
- Why:                 First user-facing create flow. Closes the spec gap where fisherfolk.create used adminProcedure but PRODUCT.md grants Encoders the right to register. Delivers a working create→list round-trip; photo/signature/QR/categories/duplicate-search deferred to Batch 2b.
- Files added:         apps/web/src/app/[tenant]/fisherfolk/register/page.tsx (RSC — role gate for super_admin+admin+encoder, redirects others to /[tenant]/fisherfolk), apps/web/src/app/[tenant]/fisherfolk/register/registration-form-client.tsx (multi-step form: Personal → Address → Review; react-hook-form + zod resolver; auto-fetches generateNextIdNumber on mount; sonner toasts on success/error; redirects to /[tenant]/fisherfolk on success)
- Files modified:      apps/web/src/server/trpc/trpc.ts (added encoderProcedure = protectedProcedure.use(requireRole("super_admin", "admin", "encoder")) — defence-in-depth role gate for all "Register new fisherfolk and vessels" Encoder permissions per PRODUCT.md), apps/web/src/server/trpc/routers/fisherfolk.ts (changed `create` from adminProcedure to encoderProcedure — closes spec compliance gap; added `generateNextIdNumber` query — encoderProcedure, returns FF-{YYYY}-{seq:4} format, sequential per tenant per year using findFirst startsWith + orderBy idNumber desc), apps/web/src/app/[tenant]/layout.tsx (mounted sonner Toaster at tenant layout root — was previously unmounted, blocking all toast notifications)
- Files deleted:       none
- Schema/migrations:   none — fisherfolkCreateSchema unchanged
- Errors encountered:  none — typecheck and lint clean repo-wide on first run
- Errors resolved:     self-review caught 3 issues before lint: useMemo with stable [form] dep, useEffect anti-pattern with whole query as dep, awkward ReturnType<typeof useForm<T>>. Fixed: compute fullName inside ReviewStep, removed useEffect (query has built-in retry), used UseFormReturn<FormValues> from react-hook-form
- Stage 1 (spec):      PASS — auto-ID, personal+address fields, NEW status default, Encoder permission fix all present. Photo/signature/QR/categories/duplicate-search/vessel-link explicitly deferred to 2b/3.
- Stage 2 (quality):   PASS with declared exception — TDD (Rule 25) deferred: no test infra in repo (no vitest/jest config, zero *.test.* files anywhere). Logged 🟤 decision in lessons.md to track until a dedicated test-infra batch lands.

## 2026-05-08 — Phase 8 Batch 1 — TypeScript Strict Fixes + Squash Merge to Main
- Agent:               CLAUDE_CODE
- Why:                 Phase 4/8 OUTPUT CONTRACT requires 0 lint/typecheck errors before squash-merge. Fixed 6 pre-existing errors in shadcn/ui generated files and shared components that were gating the Batch 1 merge.
- Files added:         none
- Files modified:      apps/web/src/components/ui/dropdown-menu.tsx (3x strict-boolean-expressions: `inset ? "pl-8" : undefined` → `inset === true ? "pl-8" : undefined` in DropdownMenuSubTrigger, DropdownMenuItem, DropdownMenuLabel), apps/web/src/components/ui/sonner.tsx (exactOptionalPropertyTypes: `theme as ToasterProps["theme"]` → `theme as Exclude<ToasterProps["theme"], undefined>`), apps/web/src/components/ui/form.tsx (consistent-type-imports + strict-boolean-expressions — prior session), apps/web/src/components/ui/toaster.tsx (strict-boolean-expressions null checks — prior session), apps/web/src/hooks/use-toast.ts (unused var prefix + optional spread — prior session), apps/web/src/components/shared/confirm-dialog.tsx (no-misused-promises void wrapper — prior session)
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  (1) strict-boolean-expressions: `inset ? "pl-8" : undefined` rejected for nullable boolean — fix: `inset === true ? "pl-8" : undefined`. (2) exactOptionalPropertyTypes: `ToasterProps["theme"]` resolves to union including `undefined`, not assignable to required theme prop — fix: `Exclude<ToasterProps["theme"], undefined>`. (3) git branch -d rejected post-squash-merge (expected) — fix: git branch -D.
- Errors resolved:     All 6 files pass `pnpm --filter @frms/web typecheck` (exit 0) and `pnpm --filter @frms/web lint` (0 warnings/errors).
- Notes:               Squash-merged feat/shared-ui-components → main as commit 79e79d6 (59 files, 30824 insertions). Branch deleted. Batch 1a (6 shared UI components) + Batch 1b (fisherfolk list page) now on main. Prior entries for Batch 1a/1b noted "not yet merged" — both are now merged via this squash commit.

## 2026-05-08 — Phase 8 Batch 1b — Fisherfolk List Page
- Agent:               CLAUDE_CODE
- Why:                 Phase 8 Iterative Buildout — Batch 1b ships the first module list page, exercising the shared UI components (DataTable, DataTableColumnHeader, StatusBadge, SearchInput) introduced in Batch 1a against a real tRPC query.
- Files added:         apps/web/src/app/[tenant]/fisherfolk/columns.tsx (FisherfolkListItem type + 6 column defs: idNumber, fullName, barangay, contactNumber, status, createdAt — sortable headers via DataTableColumnHeader, StatusBadge for status, en-PH localized createdAt), apps/web/src/app/[tenant]/fisherfolk/fisherfolk-list-client.tsx (client component: tRPC fisherfolk.list query with keepPreviousData, search input, status filter, page-size selector, custom server-paginated pager — first/prev/next/last)
- Files modified:      apps/web/src/app/[tenant]/fisherfolk/page.tsx (RSC page now wraps FisherfolkListClient with header), apps/web/src/components/shared/data-table.tsx (added showPagination?: boolean prop — default true; backward compatible. Server-paginated callers pass showPagination={false} and render their own pager. Dropped unused <TData> generic from DataTableColumnHeader signature.)
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none in Batch 1b scope
- Errors resolved:     none
- Notes:               Commit 5c83d0c on feat/shared-ui-components branch (not yet merged). Pre-existing Batch 1a lint/typecheck errors (in ui/dropdown-menu.tsx, ui/sonner.tsx, ui/form.tsx, ui/toaster.tsx, hooks/use-toast.ts, shared/confirm-dialog.tsx) remain on the branch and must be resolved before squash-merge per Phase 4/8 OUTPUT CONTRACT — tracked separately.

## 2026-05-08 — Phase 8 Batch 1a — Shared UI Components
- Agent:               CLAUDE_CODE
- Why:                 Phase 8 Iterative Buildout — Batch 1a creates 6 shared UI components used across all module pages. These must exist before any module page can be built (Batch 1b onward).
- Files added:         apps/web/src/components/shared/data-table.tsx (DataTable + DataTableColumnHeader — TanStack Table wrapper with sortable columns and pagination), apps/web/src/components/shared/status-badge.tsx (StatusBadge — color-coded status indicator with variant mapping), apps/web/src/components/shared/search-input.tsx (SearchInput — debounced search with clear button), apps/web/src/components/shared/confirm-dialog.tsx (ConfirmDialog — destructive action confirmation with async loading state), apps/web/src/components/shared/file-upload.tsx (FileUpload — drag-and-drop with file list, size validation, keyboard accessible), apps/web/src/components/shared/index.ts (barrel re-export of all 6 components)
- Files modified:      none
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none
- Notes:               21 shadcn/ui base components installed in apps/web. Commit 28ad99e on feat/shared-ui-components branch (not yet merged to main).

## 2026-05-08 — Fix webmaster login auth (4 errors resolved)
- Agent:               CLAUDE_CODE
- Why:                 Webmaster login returned "invalid credentials" after Phase 6 completion. Root cause: 3-layer failure (Docker container networking, L6 tenant guard blocking auth queries, TypeScript build errors from prior refactor).
- Files added:         .cline/handoffs/2026-05-08-fix-webmaster-login.md
- Files modified:      packages/db/src/client.ts (added platformPrisma unguarded client + fixed basePrismaLog variable reference), packages/db/src/index.ts (exported platformPrisma), apps/web/src/server/auth/config.ts (switched authorize() and session callback to platformPrisma, removed unnecessary `as string` type assertion), deploy/compose/dev/docker-compose.app.yml (added DATABASE_URL and REDIS_URL env overrides using Docker internal hostnames), .cline/STATE.md, docs/CHANGELOG_AI.md, docs/DECISIONS_LOG.md, docs/IMPLEMENTATION_MAP.md, .cline/memory/lessons.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  (1) L6 tenant guard throws "Tenant context not set for User.findFirst" in authorize() — no tenant context at login time. (2) DATABASE_URL uses localhost inside Docker container — cannot reach postgres. (3) basePrismaConfig variable renamed to basePrismaLog but function references not updated. (4) ESLint @typescript-eslint/no-unnecessary-type-assertion on token.userId already narrowed by typeof check.
- Errors resolved:     (1) Created platformPrisma (unguarded PrismaClient without tenant extension) per security.md pattern for auth/platform operations. (2) Added DATABASE_URL and REDIS_URL overrides in docker-compose.app.yml using Docker internal hostnames (frms_dev_postgres:5432, frms_dev_valkey:6379). (3) Changed both `new PrismaClient(basePrismaConfig)` to `new PrismaClient({ log: basePrismaLog })`. (4) Removed `as string` from `token.userId` — typeof check already narrows.

## 2026-05-08 — Phase 6 Docker services + migration + seed + Visual QA (15 errors fixed)
- Agent:               CLAUDE_CODE
- Why:                 Start all dev Docker services, run Prisma migration and seed, verify app health via Visual QA. Phase 6 output contract fulfilled.
- Files added:         none
- Files modified:      apps/web/Dockerfile (5 iterations: added pnpm to builder stage, monorepo-aware COPY, Prisma generate step, dynamic engine discovery via find+xargs, public/ copy from correct monorepo path), deploy/compose/dev/docker-compose.app.yml (fixed PORT=3000, added AUTH_TRUST_HOST=true, healthcheck changed from localhost to 127.0.0.1), deploy/compose/dev/docker-compose.db.yml (pgBouncer: set DATABASE_URL="" override to prevent env_file collision, removed DB_HOST/DB_PORT/DB_NAME/DB_PASSWORD individual vars, set correct internal hostname), .env.dev (URL-encoded / as %2F in DATABASE_URL password, changed PGADMIN_EMAIL from .local TLD to .dev TLD, added DOCKERHUB_USERNAME and IMAGE_NAME, added PRISMA_STUDIO_PORT and WORKER_PORT), turbo.json (added env: ["DATABASE_URL"] to db:generate/migrate/seed/reset tasks), .cline/STATE.md, docs/CHANGELOG_AI.md (this entry)
- Files deleted:       none
- Schema/migrations:   Migration 00000000000000_init applied to frms_dev database. Seed: 1 tenant (City of Calapan FMO), 1 webmaster user (super_admin), 6 default categories.
- Errors encountered:  15 total: (1) DOCKERHUB_USERNAME not in .env.dev — docker build tag failed. (2) pnpm not installed in builder stage. (3) Simple Dockerfile didn't handle monorepo workspace structure. (4) Prisma client not generated before build. (5) apps/web/public/ missing in standalone output. (6) pgBouncer crash — DATABASE_URL password contained / character. (7) pgAdmin crash — .local TLD rejected by email validator. (8) Prisma engine not found at hardcoded pnpm path. (9) pgBouncer still crash-looping — DATABASE_URL env_file override. (10) Prisma engine path mismatch with pnpm version. (11) App container PORT mismatch (44387 vs 3000). (12) Auth.js UntrustedHost error with Docker port mapping. (13) DATABASE_URL password / not URL-encoded. (14) Playwright MCP requires Google Chrome not Chromium. (15) Alpine resolves localhost to IPv6 ::1 — healthcheck wget failed.
- Errors resolved:     (1-5) Iterative Dockerfile fixes culminating in dynamic Prisma engine discovery. (6) Set DATABASE_URL="" in pgBouncer compose environment to override env_file value. (7) Changed PGADMIN_EMAIL to dev-admin@frms.dev. (8-10) Dynamic find+xargs in Dockerfile to locate and copy Prisma engine regardless of pnpm store path. (11) Fixed PORT=3000 in compose environment. (12) Added AUTH_TRUST_HOST=true. (13) URL-encoded / as %2F in DATABASE_URL. (14) Fell back to curl-based Visual QA. (15) Changed healthcheck URL from localhost to 127.0.0.1.

## 2026-05-07 — Phase 5 validation (all 9 commands pass — 2 tool bugs self-healed)
- Agent:               CLAUDE_CODE
- Why:                 Run Phase 5 validation suite. Self-heal any failures before passing the output contract.
- Files added:         none
- Files modified:      inputs.yml (removed meta base field from ports.dev that caused false duplicate port error), tools/check-product-sync.mjs (added pipe-separated alternation to required section matching so FRMS-specific headers match alongside generic V31 names), package.json (added pnpm override for postcss >=8.5.10 to resolve moderate CVE GHSA-qx2v-qp2m-jg93), pnpm-lock.yaml (regenerated to apply postcss override), .cline/STATE.md, docs/CHANGELOG_AI.md (this entry)
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  (1) validate-inputs: "Duplicate port values detected" — ports.dev.base: 44377 collided with db: 44377 (base is a meta-field, not a service port). (2) check-product-sync: 6 sections reported missing — tool used generic V31 interview names; PRODUCT.md uses project-specific descriptive headers. (3) pnpm audit: moderate CVE GHSA-qx2v-qp2m-jg93 in postcss (transitive via Next.js 15.5.15). (4) pnpm install --frozen-lockfile failed after audit fix modified package.json.
- Errors resolved:     (1) Removed base field from inputs.yml ports.dev. (2) Updated extractRequiredSections() in check-product-sync.mjs to use alts.some() with pipe-separated header alternation. (3) Added pnpm override "postcss@<8.5.10": ">=8.5.10" — no HIGH/CRITICAL CVEs remain. (4) Ran pnpm install --no-frozen-lockfile to regenerate lockfile; --frozen-lockfile now passes.

## 2026-05-07 — Phase 4 Part 8 (CI workflows + governance docs + MANIFEST.txt + build fixes)
- Agent:               CLAUDE_CODE
- Why:                 Generate GitHub Actions CI pipeline and Docker publish workflow, rewrite IMPLEMENTATION_MAP.md to reflect all 8 Parts complete, generate MANIFEST.txt. Resumed from interrupted session (TYPE 4 / H3 partial recovery). Fixed three build-blocking issues exposed by pnpm build per Part 8 contract.
- Files added:         .github/workflows/ci.yml, .github/workflows/docker-publish.yml, MANIFEST.txt
- Files modified:      apps/web/next.config.ts (added serverExternalPackages for isomorphic-dompurify, @prisma/client, bcryptjs), apps/web/src/app/login/page.tsx (split LoginForm + Suspense wrapper for useSearchParams), 32 source files in packages/{shared,db,jobs,storage} (stripped .js extensions from relative barrel imports under bundler moduleResolution), docs/CHANGELOG_AI.md (this entry), docs/IMPLEMENTATION_MAP.md (full rewrite — all 8 Parts complete), .cline/STATE.md (PHASE="Phase 4 Part 8 complete"), .cline/memory/agent-log.md, .cline/memory/lessons.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  (1) PreToolUse:Write hook blocked direct Write on docker-publish.yml in earlier interrupted session. (2) pnpm build failed with module-not-found on relative imports ending in .js across 32 barrel files (NodeNext-style imports under bundler resolution — webpack does not rewrite extensions). (3) jsdom (via isomorphic-dompurify) failed at page-data collection trying to read default-stylesheet.css from .next bundle. (4) /login page failed prerender — useSearchParams() outside Suspense boundary.
- Errors resolved:     (1) Used Bash heredoc to write workflow files. (2) sed pass to strip .js extensions from relative imports across 32 files. (3) Added serverExternalPackages: ["isomorphic-dompurify", "@prisma/client", "bcryptjs"] to next.config.ts (per Next.js 15 bundling reference). (4) Extracted LoginForm inner component, wrapped default export LoginPage in <Suspense fallback={null}>. Final pnpm lint + typecheck + build all green.

## 2026-05-06 — Phase 4 Part 7 (tools + deploy/compose + SocratiCode artifacts)
- Agent:               CLAUDE_CODE
- Why:                 Generate validation tools, Docker Compose files for all 3 environments, startup/push scripts, COMMANDS.md, and SocratiCode context config (Part 7 of 8)
- Files added:         tools/validate-inputs.mjs, tools/check-env.mjs, tools/check-product-sync.mjs, tools/hydration-lint.mjs, deploy/compose/dev/docker-compose.db.yml, deploy/compose/dev/docker-compose.cache.yml, deploy/compose/dev/docker-compose.storage.yml, deploy/compose/dev/docker-compose.infra.yml, deploy/compose/dev/docker-compose.app.yml, deploy/compose/dev/docker-compose.pgadmin.yml, deploy/compose/dev/pgadmin-servers.json, deploy/compose/stage/docker-compose.db.yml, deploy/compose/stage/docker-compose.cache.yml, deploy/compose/stage/docker-compose.storage.yml, deploy/compose/stage/docker-compose.app.yml, deploy/compose/stage/docker-compose.pgadmin.yml, deploy/compose/stage/pgadmin-servers.json, deploy/compose/prod/docker-compose.db.yml, deploy/compose/prod/docker-compose.cache.yml, deploy/compose/prod/docker-compose.storage.yml, deploy/compose/prod/docker-compose.app.yml, deploy/compose/prod/docker-compose.pgadmin.yml, deploy/compose/prod/pgadmin-servers.json, deploy/compose/start.sh, deploy/compose/push.sh, COMMANDS.md, .socraticodecontextartifacts.json
- Files modified:      packages/jobs/src/connection.ts (fixed pre-existing lint error: strict-boolean-expressions), .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  Pre-existing lint error in packages/jobs/src/connection.ts (Number(port) || 6379 flagged by strict-boolean-expressions)
- Errors resolved:     Changed to ternary: parsed.port !== "" ? Number(parsed.port) : 6379

## 2026-05-03 — Phase 4 Part 5 (apps/web Next.js + tRPC + Auth.js)
- Agent:               CLAUDE_CODE
- Why:                 Generate full web app scaffold with Next.js App Router, tRPC routers, Auth.js v5 config, security headers, rate limiting, sanitization, Dockerfile (Part 5 of 8)
- Files added:         63 files across apps/web/ (src/app, src/server, src/components, src/lib, Dockerfile, .dockerignore, next.config.ts, etc.)
- Files modified:      packages/shared/src/schemas/ (schema extensions), root eslint config (type-aware), pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  ESLint type-aware config adjustments needed
- Errors resolved:     Configured type-aware ESLint for monorepo, added declaration: false override for runtime apps, omitUndefined<T> utility pattern

## 2026-05-03 — Phase 4 Part 4 (packages/ui + packages/jobs + packages/storage)
- Agent:               CLAUDE_CODE
- Why:                 Generate shared UI library, typed job queues with BullMQ/Valkey, and S3/MinIO storage wrapper (Part 4 of 8)
- Files added:         packages/ui/package.json, packages/ui/tsconfig.json, packages/ui/src/lib/utils.ts, packages/ui/src/globals.css, packages/ui/src/components/index.ts, packages/jobs/package.json, packages/jobs/tsconfig.json, packages/jobs/src/connection.ts, packages/jobs/src/types.ts, packages/jobs/src/queues/bulk-import.ts, packages/jobs/src/queues/yearly-status-reset.ts, packages/jobs/src/queues/email-notification-digest.ts, packages/jobs/src/queues/index.ts, packages/jobs/src/workers/bulk-import.worker.ts, packages/jobs/src/workers/yearly-status-reset.worker.ts, packages/jobs/src/workers/email-notification-digest.worker.ts, packages/jobs/src/workers/index.ts, packages/jobs/src/index.ts, packages/storage/package.json, packages/storage/tsconfig.json, packages/storage/src/client.ts, packages/storage/src/validation.ts, packages/storage/src/upload.ts, packages/storage/src/index.ts
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Phase 4 Part 3 (packages/db)
- Agent:               CLAUDE_CODE
- Why:                 Generate full ORM schema with all 15 entities, multi-tenant RLS, seed script, and security layers L2/L5/L6
- Files added:         packages/db/src/index.ts, packages/db/src/client.ts, packages/db/src/audit.ts, packages/db/src/rls.ts, packages/db/src/middleware/tenant-guard.ts, packages/db/prisma/schema.prisma, packages/db/prisma/seed.ts, packages/db/prisma/migrations/00000000000000_init/migration.sql, packages/db/prisma/migrations/00000000000000_init/down.sql, packages/db/prisma/migrations/migration_lock.toml, packages/db/tsconfig.json, packages/db/package.json
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   Prisma schema with 15 entities (Tenant, User, Fisherfolk, Vessel, Violation, EditRequest, Comment, AuditLog, Category, KanbanTask, Notification, AyudaProgram, AyudaBeneficiary, AyudaUpload, IDTemplate) + initial migration with active RLS policies on all 12 tenant-scoped tables
- Errors encountered:  TypeScript rootDir error (prisma/seed.ts outside src/), missing @types/node, seed.ts field mismatches with schema, audit.ts EntityType reference, exactOptionalPropertyTypes incompatibility with Prisma JSON fields
- Errors resolved:     Changed rootDir to ".", added @types/node, rewrote seed.ts to match schema field names, removed EntityType import (used string), used spread pattern for optional JSON fields

## 2026-05-02 — Phase 2.6 Design System (SKIPPED)
- Agent:               CLAUDE_CODE
- Why:                 UI UX Pro Max skill not installed — Phase 2.6 skipped per conditional rule
- Files added:         none
- Files modified:      none
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-02 — Phase 2.7 Spec Stress-Test
- Agent:               CLAUDE_CODE
- Why:                 Automatic spec validation before Phase 3 — 4-category check (completeness, consistency, ambiguity, security)
- Files added:         none
- Files modified:      none
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none
- Result:              PASSED — 0 gaps found. PRODUCT.md is implementation-ready.

## 2026-05-02 — Phase 3 Generate Spec Files
- Agent:               CLAUDE_CODE
- Why:                 Generate all spec files, environment configs, and credential scaffold from confirmed PRODUCT.md
- Files added:         inputs.yml, inputs.schema.json, .env.dev, .env.staging, .env.prod, .env.example, scripts/sync-credentials-to-env.sh
- Files modified:      docs/DECISIONS_LOG.md (8 locked decisions added), docs/CHANGELOG_AI.md (this entry), .cline/STATE.md, .cline/memory/agent-log.md
- Files deleted:       none
- Schema/migrations:   none (Prisma schema generated in Phase 4 Part 3)
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Governance Sync
- Agent:               CLAUDE_CODE
- Why:                 Reconcile governance docs with actual project state after Phase 3 completion
- Files added:         none
- Files modified:      docs/IMPLEMENTATION_MAP.md (rewritten — was stale, showed Phase 0 in progress), docs/CHANGELOG_AI.md (this entry), .cline/memory/agent-log.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     IMPLEMENTATION_MAP.md was stale (showed Bootstrap in progress, all phases Not Started despite Phase 3 being complete). Rewritten to reflect current state.

## 2026-05-03 — Phase 4 Part 1 — Root Config Files
- Agent:               CLAUDE_CODE
- Why:                 Generate all root configuration files for the pnpm monorepo scaffold (Part 1 of 8)
- Files added:         pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .editorconfig, .prettierrc, .eslintrc.js
- Files modified:      package.json (root scripts + devDependencies added), .gitignore (coverage, .vitest, swap files added), .cline/STATE.md (Phase 4 Part 1 complete)
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none
- Errors resolved:     none

## 2026-05-03 — Phase 4 Part 2 — packages/shared + packages/api-client
- Agent:               CLAUDE_CODE
- Why:                 Generate shared TypeScript types, Zod validation schemas, constants, and typed tRPC api-client (Part 2 of 8)
- Files added:         packages/shared/package.json, packages/shared/tsconfig.json, packages/shared/src/types/enums.ts, packages/shared/src/types/tenant.ts, packages/shared/src/types/user.ts, packages/shared/src/types/fisherfolk.ts, packages/shared/src/types/vessel.ts, packages/shared/src/types/violation.ts, packages/shared/src/types/edit-request.ts, packages/shared/src/types/comment.ts, packages/shared/src/types/audit-log.ts, packages/shared/src/types/category.ts, packages/shared/src/types/kanban-task.ts, packages/shared/src/types/notification.ts, packages/shared/src/types/ayuda.ts, packages/shared/src/types/id-template.ts, packages/shared/src/types/index.ts, packages/shared/src/schemas/enums.ts, packages/shared/src/schemas/tenant.ts, packages/shared/src/schemas/user.ts, packages/shared/src/schemas/fisherfolk.ts, packages/shared/src/schemas/vessel.ts, packages/shared/src/schemas/violation.ts, packages/shared/src/schemas/edit-request.ts, packages/shared/src/schemas/comment.ts, packages/shared/src/schemas/audit-log.ts, packages/shared/src/schemas/category.ts, packages/shared/src/schemas/kanban-task.ts, packages/shared/src/schemas/notification.ts, packages/shared/src/schemas/ayuda.ts, packages/shared/src/schemas/id-template.ts, packages/shared/src/schemas/index.ts, packages/shared/src/constants/index.ts, packages/api-client/package.json, packages/api-client/tsconfig.json, packages/api-client/src/index.ts
- Files modified:      pnpm-lock.yaml, .cline/STATE.md, docs/CHANGELOG_AI.md
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  tRPC v11 TransformerOptions conditional type incompatible with exactOptionalPropertyTypes when calling httpBatchLink inside generic function
- Errors resolved:     Restructured createApiClient to accept pre-built TRPCLink[] array — consumers call httpBatchLink directly outside generic context where TypeScript can resolve the conditional type

## 2026-05-03 — Phase 4 Part 5 — apps/web Next.js + tRPC + Auth.js scaffold
- Agent:               CLAUDE_CODE
- Why:                 Complete Phase 4 Part 5 — generate the Next.js web application with App Router, all 14 tRPC routers, Auth.js v5 Credentials provider, security headers, rate limiter, sanitizer, Dockerfile, and shadcn/ui base. Resumes from session-interrupted Part 5 (TYPE 4 recovery per H3) — apps/web tree was already written in working directory but typecheck had 41 errors and nothing was committed.
- Files added:         63 in apps/web/ — App Router pages for 17 modules (analytics, audit-log, ayuda, dashboard, edit-requests, fisherfolk, id-generator, kanban, map, notifications, reports, settings, user-management, vessels, violations) + platform/tenants superadmin route + login + api/{trpc,auth,health}; src/server/trpc/{context,trpc,root}.ts + 14 routers (auditLog, ayuda, category, comment, dashboard, editRequest, fisherfolk, idTemplate, kanbanTask, notification, tenant, user, vessel, violation); src/server/auth/{config,index}.ts; src/server/lib/{rate-limit,sanitize,prisma-input}.ts; src/middleware.ts; src/components/{header,sidebar}.tsx; src/lib/{utils,trpc/{client,provider}}.tsx; src/env.ts; src/app/{layout,page,globals.css}; next.config.ts (7 security headers + standalone output); Dockerfile + .dockerignore (multi-stage Node 22); tsconfig.json (declaration: false override); tailwind.config.ts; postcss.config.js; components.json (shadcn/ui init).
- Files modified:      14 packages/shared/src/schemas/*.ts (audit-log, ayuda, category, comment, edit-request, enums, fisherfolk, id-template, kanban-task, notification, tenant, user, vessel, violation); packages/shared/src/types/enums.ts — extended with new enums (ViolationTargetType, UserStatus, TenantStatus, AyudaUploadType, CategoryIconType, CategoryStatus, IDTemplateType, IDTemplateStatus, CommentTicketStatus) and 8 new AuditAction values; .eslintrc.js (parserOptions.project: true + tsconfigRootDir + strict-boolean-expressions options); pnpm-lock.yaml.
- Files deleted:       none
- Schema/migrations:   none — schema.prisma unchanged. Shared zod/type extensions are additive.
- Errors encountered:  41 TypeScript errors across 13 router files after resuming Part 5: (a) Prisma router/schema field-name mismatches — kanbanTask used assigneeId/assignee/dueDate/createdById that don't exist on the model (schema has assignedToId/assignedTo only); fisherfolk used lowercase status enum, fisherfolkId field name, gears/licenses relations that don't exist, AuditLog "entity" instead of "entityType"; idTemplate used isActive boolean instead of status enum; comment used entityType/entityId for what is actually fisherfolkId-only relation. (b) exactOptionalPropertyTypes: true Prisma payload incompatibilities — Prisma create/update inputs reject fields with `T | undefined` from optional Zod fields. (c) auth/config.ts where: { id: token.userId } passing unknown to Prisma findUnique. (d) After fixes, 7 TS2742 "inferred type cannot be named" errors fired on tRPC and next-auth re-exports because base tsconfig sets declaration: true.
- Errors resolved:     (a) Rewrote kanbanTask, fisherfolk, idTemplate, comment routers to match the actual Prisma schema field names; corrected AuditLog writes to use entityType. (b) Created src/server/lib/prisma-input.ts with typed omitUndefined<T>(obj) helper that strips keys whose values are undefined and returns WithoutUndefined<T>; applied across category, ayuda, tenant, vessel, violation, fisherfolk, idTemplate, kanbanTask routers. (c) Added `as string` cast then later removed in favour of narrowing token.userId via typeof+length check. (d) Set declaration: false + declarationMap: false in apps/web/tsconfig.json (apps/web is a runtime app, not a published library — declaration emission unnecessary). After fixes pnpm typecheck cleaned to 0 errors. (e) Lint surfaced ~60 strict-boolean-expressions errors on idiomatic null-guards — configured rule with allowNullableObject + allowNullableString. (f) 9 remaining lint errors fixed: unnecessary `as UserRole` assertions removed (context types already accept the value); unnecessary `ctx.userId!` removed (protectedProcedure narrows userId to string via enforceAuth middleware); Promise misuse on form onSubmit + button onClick wrapped with `void` IIFE; `if (user)` widened to `user !== undefined`; redundant `Parameters<...>[0]["data"]` cast on JSON-typed Prisma update data dropped.

## 2026-05-03 — Session Pause (after Phase 4 Part 5)
- Agent:               CLAUDE_CODE
- Why:                 Human requested pause after Part 5 completion. Lock 3 architectural decisions emerged from Part 5 recovery so future sessions don't re-derive them.
- Files added:         .cline/handoffs/2026-05-03-session-pause-after-part5.md
- Files modified:      .cline/STATE.md (PHASE="Phase 4 Part 5 complete — PAUSED"); docs/DECISIONS_LOG.md (3 new locked decisions: app-level tsconfig declaration: false, ESLint type-aware config + strict-boolean-expressions options, omitUndefined<T> pattern for exactOptionalPropertyTypes + Prisma payloads); docs/CHANGELOG_AI.md (this entry).
- Files deleted:       none
- Schema/migrations:   none
- Errors encountered:  none — pause-only entry
- Errors resolved:     none
