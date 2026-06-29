# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

> Owner directed these to the NEXT session reboot loop (2026-06-29).

- [ ] **PRODUCT.md back-port — custom-domain support (DRAFTED — owner to apply).**
  Custom-domain "masking" is a new [WHAT] the owner approved 2026-06-29. The loop
  drafted the proposed PRODUCT.md text (Tenancy Model + Domain sections) in
  `docs/BACKPORT_CANDIDATES.md` **candidate F** and logged the decision in
  `docs/DECISIONS_LOG.md`. PRODUCT.md is human-owned (Rule 1) → **owner reviews
  candidate F and applies / defers / logs spec-divergent.** Only the human edit to
  PRODUCT.md remains. Ref: docs/MULTITENANCY.md, [[project_tenant_isolation_custom_domains]].

## Resolved

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
