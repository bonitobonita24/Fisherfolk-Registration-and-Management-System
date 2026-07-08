# 📋 PRODUCT.md Back-Port Candidates

> **✅ ALL CANDIDATES BACK-PORTED 2026-06-30.** Owner authorized the agent to apply candidates
> A–I to PRODUCT.md (candidate J was applied earlier the same day). Rule 1 waiver logged in
> DECISIONS_LOG.md ("Rule 1 waiver (extended)"). Where a candidate's pre-drafted text conflicted
> with shipped code, the code won — notably **B** used ground-truth schema hex defaults
> (`#F97316`/`#1E3A5F`, not the stale `#E8843C`/`#336F92`) and **C** left the Category entity
> `iconType` enum unchanged (lucide is a render-layer mapping). This file is now historical.

> **Generated 2026-06-27** by the deferred back-port surface task (V32.5.5 Back-Port Surface Check).
> **Surface-and-inform only.** PRODUCT.md is human-owned (Rule 1) — agents do NOT edit it.
> The owner reviews each candidate and: ✅ back-ports the proposed text, ⏸ defers, or 🚫 logs
> `spec-divergent: <reason>` in DECISIONS_LOG.md. Nothing here is applied automatically.
>
> Source of "answered" facts: `docs/DECISIONS_LOG.md` + shipped features on `main`
> (charts/reports `fb5bd43`, DM-6/7 `f6ca837`, asset import `6cd55cb`, lucide icons `b532e08`,
> theming `704147a`). Line numbers reference PRODUCT.md as of this date.

---

## HIGH — spec contradicts a now-locked decision or live behavior

### A. Fisherfolk ID is format-agnostic (PD-001) — PRODUCT.md still shows it as PENDING
- **Decision (locked):** DECISIONS_LOG "Fisherfolk registration ID — format-agnostic (PD-001)" — no
  ID format is enforced; `idNumber` is a freeform, per-tenant-unique string accepting ANY format
  (legacy `MR-CL-NNNNNN-YYYY`, generated `FF-YYYY-NNNN`, or arbitrary). New registrations may enter
  the ID manually; `generateNextIdNumber` stays an optional "suggest" helper, not a mandate. Owner-decided.
- **PRODUCT.md drift:** **line 285** still carries `⚠ DEFERRED OWNER DECISION (PENDING): whether new
  FRMS registrations should adopt MR-CL-NNNNNN-YYYY or keep FF-YYYY-NNNN`. **This question is now
  RESOLVED** (neither is mandated; format-agnostic).
- **Proposed back-port:** Replace the "DEFERRED OWNER DECISION (PENDING)" sentence on line 285 with a
  statement that new registrations accept any freeform unique ID (manual entry allowed; generator is an
  optional suggestion); legacy imported IDs preserved exactly. Optionally note it in Core Flow #1 (line 14).

### B. Per-tenant theming is now DUAL-color (tangerine + marine) with an admin editor — spec says single blue
- **Shipped (live on main, `704147a`):** Two configurable accents — **primary tangerine `#E8843C`** +
  **secondary marine `#336F92`** as defaults; `Tenant.primaryColor` + `Tenant.secondaryColor` fields
  (migration `20260627035633_tenant_accent_colors`); admin **Settings → Theme** editor with live preview,
  save, and reset-to-default. App is always-dark; `--accent` decoupled from `--secondary`.
- **PRODUCT.md drift (single blue accent assumed throughout):**
  - **line 212** Settings/General: `accent color picker (free color selector, default #4F8EF7 blue)` — now TWO colors.
  - **line 315** Tenant entity: only `accentColor (hex, default #4F8EF7)` — missing `primaryColor`/`secondaryColor`.
  - **lines 512, 514–516** Design Identity: "configurable blue accent color", "default: #4F8EF7 blue",
    "`--primary set from tenant accentColor`" — defaults are now tangerine/marine, dual-token.
- **Proposed back-port:** Update Settings/General + Tenant entity + Design Identity to describe a
  primary+secondary accent pair (defaults tangerine `#E8843C` / marine `#336F92`), admin Theme editor,
  and the always-dark constraint. The "NO purple/violet" key constraint (line 515) still holds.

---

## MEDIUM — shipped behavior diverges from spec wording

### C. Category icons: emoji → lucide SVG (anti-"tofu box" on LGU workstations)
- **Shipped (`b532e08`):** Category icons render as **font-independent lucide SVG icons** (mapped per
  category, colored-dot fallback) because seeded emoji rendered as missing-glyph □ boxes on LGU
  workstations lacking an emoji font.
- **PRODUCT.md drift:** **lines 56, 121, 218** all describe icons as "emoji (24+ picker) or uploaded
  custom image". The emoji path was deliberately dropped for production reliability.
- **Proposed back-port:** Reword the icon option to lucide-icon selection (+ optional uploaded image),
  drop the emoji-picker promise, in all three places. (Category entity `iconType (emoji, image)` on
  line 317 would follow.)

### D. Edit-request no-approval bypass is broader than "missing photo/signature" (PD-004)
- **Decision (locked, provisional/agent-default):** DECISIONS_LOG PD-004 — no-approval bypass covers a
  missing photo/signature **AND any currently-EMPTY required field** (filling a blank = encoder-direct);
  CHANGING an already-populated field always routes through admin approval. Resubmit creates a NEW
  EditRequest per submission; rejection history shown by querying prior requests.
- **PRODUCT.md drift:** **line 18** (flow #3) and **line 57** scope the bypass narrowly to
  "records missing basic info (photo/signature)" — narrower than the locked "any empty required field".
- **Proposed back-port:** Generalize the exception in flow #3 / Fisherfolk Registration to "any currently-
  empty required field (incl. photo/signature) may be filled without approval; editing a populated field
  always requires approval." (Mark provisional — owner may flip per PD-004.)

### E. Edit-request editable-field whitelist (PD-002) — explicitly flagged back-port-pending
- **Decision (locked):** DECISIONS_LOG PD-002 — editable set = exactly the `fisherfolkUpdateSchema`
  field set; system/identity/audit columns (id, tenantId, idNumber, timestamps, createdById/updatedById,
  qrCode) are NOT user-editable. The decision text itself says *"Back-port to PRODUCT.md flow #3 pending."*
- **PRODUCT.md drift:** flow #3 (line 18) + Edit Request System (lines 75–81) describe the diff/approve
  flow but never state which fields are editable vs locked.
- **Proposed back-port:** Add one line to the Edit Request System section naming the editable scope
  (all user fields per the update schema) and the excluded system/identity columns.

---

## LOW — internal consistency / additive surfaces

### F. Contact-number normalization: internal contradiction inside PRODUCT.md
- **line 271** (canonical): `09xxxxxxxxx` — explicitly "Supersedes the earlier +63 prefix note".
- **line 237** (Data Import Step 1) still says: `contact number normalization (+63 prefix)`.
- **Proposed back-port:** Update line 237 to `09xxxxxxxxx` to match the canonical rule.

### G. Barangay-alias management is now a Settings surface (DM-7)
- **Shipped (`f6ca837`):** Admin **Settings → Barangay Aliases** CRUD UI (the tenant-editable typo-
  normalization map) backed by `routers/settings.ts`.
- **PRODUCT.md drift:** Settings is described as four tabs "General / Categories / Violations / Email"
  (line 211); the typo-map is mentioned only as a data rule (line 270), not as a Settings surface.
- **Proposed back-port:** Add barangay-alias management to the Settings tab list / Settings module.

### H. Dashboard missing-asset tracking (asset-coverage audit)
- **Shipped (`b532e08`):** Dashboard `getStats` returns missing-photo / missing-signature counts; the
  fisherfolk list has a `missing` filter for incomplete records.
- **PRODUCT.md drift:** Dashboard KPI list (lines 148–170) doesn't mention asset-coverage counts.
- **Proposed back-port:** Add a "records missing photo/signature" count to the Dashboard spec (optional).

### I. Notification channel standard (PD-003) — already largely consistent
- **Decision (locked):** in-app + email ACTIVE, SMS PREPARED-but-inactive (stub + config flag); this set
  is the standard for ALL future system notifications.
- **PRODUCT.md:** Out of Scope already says "No SMS notifications (planned for future)" (line 523), and
  the Notification entity exists. Mostly consistent — optional to state the in-app+email standard explicitly.
- **Proposed back-port:** Optional — note the standard notification channel set near the Notification entity.

---

## Not a PRODUCT.md item (flagged for awareness, no back-port)
- **Komodo deploy model:** DECISIONS_LOG "Komodo Deployment Model" still describes the **V27 poll-based
  auto-update**; the framework has since moved to **V32.13 CI → Docker Hub → Komodo-API** push deploy.
  This is a DECISIONS_LOG / infra-runbook update, **not** a PRODUCT.md change. Surface to owner separately.
- **platformPrisma / tenant-guard ALS fix:** technical `[HOW]` decisions already in DECISIONS_LOG; covered
  by PRODUCT.md's L1–L6 security layer description. No product-level back-port.

---

## NEW — feature shipped after this file was generated (custom-domain masking, 2026-06-29)

### J. Custom-domain "masking" — tenants may use their own domain  ✅ BACK-PORTED 2026-06-30
> **Status: ✅ BACK-PORTED to PRODUCT.md 2026-06-30** (owner authorized agent to apply; Rule 1 waived for this one change — logged in DECISIONS_LOG.md). Added to ## Tenancy Model, ## Domain / Base URL Expectations, and the Tenant entity under ## Data Entities. No further action.
- **Decision (locked):** DECISIONS_LOG "Custom-domain 'masking' — per-tenant own-domain support
  (2026-06-29)". A tenant serves the app from THEIR OWN domain while the shared codebase keeps
  serving the existing `/[tenant]/...` subdirectory routes; the browser shows the tenant's domain
  (internal `NextResponse.rewrite`, no iframes). **Data isolation is unchanged** — tenant is still
  derived from the authenticated session, never the host/URL.
- **Shipped (live on main):** `Tenant.customDomain` + `Tenant.domainVerifiedAt`
  (migration `20260629140000_tenant_custom_domain`); tested resolver `lib/tenant-routing.ts`;
  middleware wiring reading `TENANT_CUSTOM_DOMAINS` (inert while empty); `docs/MULTITENANCY.md`.
- **PRODUCT.md drift:** the **Tenancy Model** (line 396) and **Domain / Base URL Expectations**
  (line 456) sections describe ONLY subdirectory routing on `frms.powerbyteitsolutions.app/<slug>`;
  custom per-tenant domains are not mentioned.
- **Proposed back-port text:**
  - Under **## Tenancy Model**, add a line:
    > Custom domains (optional, per tenant): a tenant may point their own domain (CNAME) at the app
    > and have it serve their tenant via internal URL rewrite ("domain masking" — browser shows the
    > tenant's domain; no iframes). The data boundary is still session-derived, so a custom domain
    > changes only the visible URL, never tenant isolation. Stored as `Tenant.customDomain` +
    > `Tenant.domainVerifiedAt`; enabled per tenant after DNS + TLS verification.
  - Under **## Domain / Base URL Expectations**, add:
    > Per-tenant custom domains: e.g. a tenant LGU may use `fisherfolk.<lgu>.gov.ph` instead of the
    > `frms.powerbyteitsolutions.app/<slug>` subdirectory URL. Subdirectory routing always remains
    > valid; the custom domain is additive. See docs/MULTITENANCY.md.
  - Optionally under **## Data Entities** (Tenant), note the two new fields `customDomain` (unique,
    nullable) and `domainVerifiedAt`.
- **Note:** when the first custom domain is onboarded, the CORS-origins line under **## Security
  Requirements** (line ~448) and any absolute-URL builders should account for the tenant's domain.

### K. Household Management — new feature (2026-07-08) ⏳ DRAFT — awaiting owner application
> **Status: ⏳ DRAFT.** Feature is shipped on branch `feat/household-management` (unmerged, all 9
> tasks complete — see docs/STATE.md + docs/CHANGELOG_AI.md 2026-07-08 entry). This candidate is
> NOT yet applied to PRODUCT.md — Rule 1 (human-only edit) applies; the owner reviews and applies,
> defers, or logs `spec-divergent: <reason>` in DECISIONS_LOG.md.
- **Decision (locked):** DECISIONS_LOG "Household Management — [HOW] locked implementation
  decisions" (2026-07-08). Explicit `Household` model grouping a head Fisherfolk + members (head is
  also a member); household category for counts = head's category; HH-#### per-tenant numbering;
  ayuda `distributionUnit` set at program-creation time only; no backfill of existing fisherfolk
  (new households only, going forward); delete unlinks members without deleting fisherfolk records.
- **Shipped (branch `feat/household-management`, unmerged):** `Household` model + `Fisherfolk.householdId`
  + `AyudaProgram.distributionUnit` (FISHERFOLK|HOUSEHOLD) + `AyudaBeneficiary.householdId`
  (migration, `4b0995e`); `household` tRPC router (`6e1da3a`); `/households` list (`e83493d`),
  `/households/new` 3-step create wizard (`de6a42a`), `/households/[id]` detail/edit (`fd572d0`);
  household membership badge on fisherfolk detail (`1a3eb7a`); ayuda program create form Distribution
  Unit select + household-beneficiary picker (`5132016`); dashboard `getHouseholdStats` + Households
  tile/charts + "Household Masterlist" report type (`2e2eadd`); guarded demo seed (`3d1897a`).
- **PRODUCT.md drift:** no mention of Household anywhere in the spec.
- **Proposed back-port text:**
  - Under **### Fisherfolk Registration** (or a new subsection immediately after it, e.g.
    "### Household Management"), add:
    > Fisherfolk may be grouped into a **Household** (head + members; the head is always also a
    > member). Households are created explicitly by staff — existing fisherfolk are NOT
    > auto-grouped or backfilled; only newly-created households exist going forward. A household's
    > category (for counts/reporting) is the head's fisherfolk category. Households are auto-numbered
    > `HH-####` per tenant. Deleting a household unlinks its members (fisherfolk records are
    > preserved, never deleted). Managed under a new **RECORDS → Households** list/create-wizard/
    > detail-edit flow, with a membership badge shown on the fisherfolk profile.
  - Under **### Ayuda Programs**, add:
    > Ayuda programs choose a **Distribution Unit** at creation time: `Fisherfolk` (existing
    > per-person beneficiary counting) or `Household` (one beneficiary record per household, keyed
    > to the household head). This setting is fixed once the program is created (no edit-program
    > form exists); duplicate-household selection is blocked in the household-mode beneficiary picker.
  - Under **## Data Entities**, add a new **Household** entity: `id, tenantId, code (HH-#### per
    tenant), headFisherfolkId, members (relation to Fisherfolk, head included), createdAt, updatedAt,
    createdBy, updatedBy`; update **Fisherfolk** entity to add `householdId (nullable, relation)`;
    update **AyudaProgram** entity to add `distributionUnit (Fisherfolk, Household)`; update
    **AyudaBeneficiary** entity to add `householdId (nullable)`.
- **Recommended section:** primarily **### Fisherfolk Registration** (new Household Management
  subsection) + **### Ayuda Programs** + **## Data Entities**.
