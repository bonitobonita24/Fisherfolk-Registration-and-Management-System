# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

_(none open — all owner `[WHAT]` decisions resolved as of 2026-06-30)_

## Resolved

- [x] 2026-06-30 — **Merge PR #5 — WCAG 2.2 AA accessibility fixes** (`feat/a11y-wcag-audit`) →
  DONE. Owner merged; squash-landed to `main` @ `bf8306f` (alongside PR #6 hydration/favicon
  @ `eda7614`). CI green. Gov hard-gate (Rule 33) satisfied. Ref: [[project_a11y_wcag_audit]].


- [x] 2026-06-30 — **PRODUCT.md back-port — custom-domain support** → DONE.
  Owner authorized the agent to apply candidate J directly (Rule 1 waived for this
  one change, logged in `docs/DECISIONS_LOG.md`). Back-ported to PRODUCT.md ## Tenancy
  Model, ## Domain / Base URL Expectations, and the Tenant entity under ## Data Entities
  (lines 315 / 401 / 461). Candidate J marked ✅ BACK-PORTED in
  `docs/BACKPORT_CANDIDATES.md`; committed `c74bccb`. No further action.

- [x] 2026-06-29 — **Live middleware wiring for custom-domain masking** → DONE.
  `apps/web/src/middleware.ts` now wires `resolveTenantRoute` + `parseCustomDomainMap`
  per docs/MULTITENANCY.md §Activation: parses `TENANT_CUSTOM_DOMAINS` once per runtime
  and rewrites a matching Host to `/<slug>/...` before auth. **Inert** while the env var
  is empty (resolver returns rewriteTo=null) — zero behaviour change, data boundary
  unchanged. Verified: tsc + lint clean, 159 tests, build OK. Merged to main `3ca67bf`,
  pushed. First real activation must still run the MULTITENANCY.md §Verify checklist
  against a live domain.

- [x] 2026-06-29 — **Merge / push the UI rehab branch** → owner **loosened the HARD HOLD**:
  "I don't have any staging nor production yet deployed so it's safe to push to main."
  Resolution: integrate the finished stack into `main` and push. `feat/ui-rehab-pro` fast-forwarded
  `main` (brings PR #3 CRUD, PR #4 attachments, data-management, + all rehab); `feat/deploy-seed`
  (PR #2) merged for the seed scripts; PR #1 (csp) closed as **superseded** by the ported `e5ef970`.
  No live deploy occurs (no staging/prod stack exists yet). HARD HOLD now lifted for this project.

- [x] 2026-06-29 — Palette direction → **modern dark, orange + navy** (owner picked after a light
  "Deep Sea Teal" trial); greenish chart accent retuned to navy. Shipped in the rehab.
