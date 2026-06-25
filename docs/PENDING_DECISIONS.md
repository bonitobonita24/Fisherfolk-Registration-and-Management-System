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
- **Status:** ⏳ AWAITING FMO/owner answer.

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
- **Status:** ⏳ AWAITING FMO/owner answer.

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
- **Status:** ⏳ AWAITING FMO/owner answer.

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
- **Status:** ⏳ AWAITING FMO/owner answer.
