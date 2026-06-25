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
