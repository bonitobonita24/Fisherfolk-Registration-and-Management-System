# Pending Owner Decisions — FRMS

> [WHAT] / product / business decisions awaiting owner (FMO/Bonito) sign-off.
> Per the autonomous-loop contract: these NEVER block un-gated work — record here,
> keep building, re-surface each session until answered. Back-port the answer to
> docs/PRODUCT.md + DECISIONS_LOG.md once decided.

---

## PD-001 — Fisherfolk ID number convention for NEW registrations
- **Opened:** 2026-06-25 (during data-management adoption from the production FMO reporting tool)
- **Context:** The live FMO Calapan tool's 3,003 records use the real LGU ID format
  **`MR-CL-NNNNNN-YYYY`**. FRMS Batch 2a currently generates **`FF-YYYY-NNNN`**.
- **Decision needed:** Should *new* FRMS registrations adopt the production `MR-CL-NNNNNN-YYYY`
  convention (LGU continuity / matches existing physical IDs and printed cards) or keep the
  current generated `FF-YYYY-NNNN`?
- **Not blocking:** Imported legacy records **preserve their source ID exactly** regardless of
  this decision (legacy ID preservation rule, PRODUCT.md → Data Management & Normalization
  Standards). Only the *generator* for brand-new registrations is in question.
- **Impact if changed:** `generateNextIdNumber` in `apps/web/src/server/trpc/routers/fisherfolk.ts`
  (Batch 2a) would need a new pattern; ID Template variables `{{registration_number}}` unaffected.
- **Recommendation (for owner):** Adopt `MR-CL-NNNNNN-YYYY` for LGU continuity unless FMO
  prefers a clean new sequence — confirm the segment meaning (MR=municipality? CL=Calapan?
  6-digit running number? trailing year = registration year vs issue year).
- **Status:** ✅ ANSWERED 2026-06-26 — "no ID format, just make it ready for mixed of any ID
  format." Resolution: idNumber is a freeform per-tenant-unique string accepting ANY format;
  no mandated pattern; manual entry on registration + optional generate-suggest; legacy IDs
  preserved. Locked in DECISIONS_LOG. Implementation tracked as its own batch.

---

## PD-002 — Edit Request Workflow: which Fisherfolk fields are editable via request? 🔴
- **Opened:** 2026-06-25 (Batch 3c scoping — Edit Request Workflow, PRODUCT.md flow #3)
- **Context:** Backend is already scaffolded — `EditRequest` Prisma model + `editRequest.ts` router
  (list/getById/create/approve/reject) exist and work. PRODUCT.md flow #3 says encoder "modify
  fields → submit as edit request" but does **not enumerate which Fisherfolk fields** an encoder
  may change via request.
- **Decision needed:** The editable-field whitelist for the encoder Edit form. Options: (a) all
  profile fields except system/ID/audit fields; (b) a restricted set (e.g. contact, address,
  category, civil status) with identity fields (name, DOB, sex, RSBSA/ID number) admin-direct-only;
  (c) a custom list FMO specifies.
- **Blocks:** the encoder-facing Edit form UI (cannot build a field-level diff/edit form without the
  whitelist). Does NOT block the admin-side review (the diff viewer is field-agnostic — renders
  whatever `fieldChanges` JSON contains).
- **Recommendation:** (b) — identity/ID fields admin-direct-only, everything else via request.
- **Status:** ✅ ANSWERED 2026-06-26 — "all fields, just add to the history whatever field has
  been changed." Resolution: whitelist = full `fisherfolkUpdateSchema` field set; fieldChanges
  records only changed keys (= the history). Locked in DECISIONS_LOG.

---

## PD-003 — Notification channel for Edit Request (and system notifications generally) 🟡
- **Opened:** 2026-06-25 (Batch 3c scoping)
- **Context:** PRODUCT.md flow #3 says "Admin receives notification" on submit and "Encoder notified"
  on approve/reject, but the **delivery channel is unspecified**.
- **Decision needed:** in-app notification center, email (SMTP — tenant SMTP settings exist), SMS, or
  a combination? This also sets the pattern for ALL future system notifications (renewals,
  violations, etc.).
- **Blocks:** wiring notification triggers in editRequest create/approve/reject. Does NOT block the
  approve/reject actions themselves (those already apply changes + audit).
- **Recommendation:** in-app notification center first (no external cost/dependency), email opt-in
  later via existing tenant SMTP.
- **Status:** ✅ ANSWERED 2026-06-26 — "in-app & email but SMS just prepare." Resolution: in-app
  + email ACTIVE (email via tenant SMTP); SMS = prepared interface/stub + config flag, inactive.
  Becomes the standard for all future system notifications. Locked in DECISIONS_LOG.

---

## PD-004 — Edit Request: approval-bypass scope + resubmit/history behavior 🟡🟢
- **Opened:** 2026-06-25 (Batch 3c scoping)
- **Context:** PRODUCT.md flow #3 says records "missing basic info (photo/signature) can be edited
  without approval to complete the record," and that on resubmit of a previously-rejected change the
  "system shows previous rejection history."
- **Decisions needed:** (1) Does the no-approval bypass cover ONLY photo/signature, or any
  currently-empty required field? (2) Resubmit model — create a NEW EditRequest each time (history =
  query prior rejected requests for that fisherfolk+fields), or append to an existing record?
- **Blocks:** exception-routing logic in create() + the rejection-history UI. Lower priority — core
  approve/reject flow works without these.
- **Recommendation:** (1) photo/signature + any empty required field; (2) new EditRequest per submit,
  history via query — simplest + fully auditable.
- **Status:** ✅ RESOLVED 2026-06-26 (owner delegated "how should I answer this?" → agent
  recommendation adopted as provisional default; owner may flip): (1) bypass = missing photo/signature
  + any currently-empty required field (changing populated fields always needs approval); (2) new
  EditRequest per submit, rejection history via query. Locked (provisional) in DECISIONS_LOG.

---

## PD-005 — RBAC: custom-role permission-matrix + role-builder UI scope 🟤
- **Opened:** 2026-07-10 (Full-Auto M3 RBAC 3-tier retrofit)
- **Context:** M3 lands the fleet 3-tier backbone (tenant_manager / tenant_superadmin / tenant_admin
  + domain roles). The fleet standard also defines a data-driven CUSTOM-role layer below tenant_admin:
  a `feature_registry`, a `role_permissions(tenant_id, role_id, feature_key, view, write, update, delete)`
  matrix, a `hasPermission()` resolver wired at tRPC + route middleware + sidebar, and a
  tenant_superadmin-only role-builder screen.
- **Decision needed:** Is the custom-role matrix + role-builder in scope for FRMS now, or deferred?
  It is a large, self-contained milestone; FRMS currently ships fixed domain roles that meet LGU needs.
- **Recommendation (agent [HOW] lean):** DEFER to a later milestone — ship the 3-tier backbone +
  two-way succession first (Chunks B/C), which is the auth-critical core. Build the matrix only if/when
  a tenant needs bespoke roles. No code until owner confirms scope.
- **Status:** ⏸ DEFERRED — awaiting owner [WHAT]. Un-gated RBAC work (Chunks B/C/D) proceeds without it.

## PD-006 — Remote push / staging / prod promotion for the RBAC + v0.9.0 work 🟤
- **Opened:** 2026-07-10
- **Context:** All 2026-07-10 work (v0.9.0 versioning, RBAC retrofit) is LOCAL commits on
  `feat/household-management` under HARD HOLD. Branch is far ahead of origin/main; local main 4 ahead
  of origin. An RBAC enum migration + a data import both touch auth/PII.
- **Decision needed:** When (and in what order) to push to origin/main → staging (data-first gate) →
  prod. Prod is NEVER automatic (deploy-discipline). RBAC migrations must rehearse on staging with a
  prod-data copy before any prod promotion.
- **Status:** ⏸ DEFERRED — no push/deploy without explicit owner word ("push to staging"/"go live").
