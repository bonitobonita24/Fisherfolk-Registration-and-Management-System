# Pending Owner Decisions

Owner `[WHAT]` calls the autonomous loop must NOT decide itself. The loop keeps
rebooting and re-surfacing these until the owner answers. Technical `[HOW]` is the
conductor's to decide and never lands here.

## Open decisions / next-loop follow-ups

> Owner directed these to the NEXT session reboot loop (2026-06-29).

- [ ] **PRODUCT.md back-port — custom-domain support.** Custom-domain "masking" is a
  new [WHAT] the owner approved this session. PRODUCT.md is human-owned (Rule 1), but
  owner asked the loop to handle it next session → draft the PRODUCT.md section +
  DECISIONS_LOG entry for owner review. Ref: docs/MULTITENANCY.md,
  [[project_tenant_isolation_custom_domains]].
- [ ] **Live middleware wiring for custom-domain masking.** Foundation shipped
  (schema + tested `resolveTenantRoute` + docs). Wire `apps/web/src/middleware.ts`
  per docs/MULTITENANCY.md §Activation (inert with empty `TENANT_CUSTOM_DOMAINS`,
  so safe to land). Deferred from this session to keep the now-green auth middleware
  stable; pick up next loop. Verify per the doc's checklist.

## Resolved

- [x] 2026-06-29 — **Merge / push the UI rehab branch** → owner **loosened the HARD HOLD**:
  "I don't have any staging nor production yet deployed so it's safe to push to main."
  Resolution: integrate the finished stack into `main` and push. `feat/ui-rehab-pro` fast-forwarded
  `main` (brings PR #3 CRUD, PR #4 attachments, data-management, + all rehab); `feat/deploy-seed`
  (PR #2) merged for the seed scripts; PR #1 (csp) closed as **superseded** by the ported `e5ef970`.
  No live deploy occurs (no staging/prod stack exists yet). HARD HOLD now lifted for this project.

- [x] 2026-06-29 — Palette direction → **modern dark, orange + navy** (owner picked after a light
  "Deep Sea Teal" trial); greenish chart accent retuned to navy. Shipped in the rehab.
