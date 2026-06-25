# FRMS — Fisherfolk Registration and Management System

## App Identity
Name:           FRMS
Tagline:        Digitizing fisherfolk registration, compliance, and demographic intelligence for Philippine LGUs
Industry:       Government / Fisheries / Marine Resource Management
Primary users:  LGU fisheries staff (encoders, admins), Bantay Dagat enforcement officers, municipal planners

## Problem Statement
Philippine LGUs manage thousands of fisherfolk registrations annually using Excel spreadsheets — resulting in duplicate records, inconsistent data, no audit trail, and zero demographic intelligence. Yearly renewal cycles are error-prone, violation tracking is manual, and producing reports for BFAR, election planning, or LGU budgeting requires days of manual work. FRMS replaces this with a multi-tenant SaaS platform that handles registration, renewal, violation enforcement, vessel management, ID generation, and real-time demographic dashboards — per LGU, with full audit logging.

## Core User Flows

1. **Encoder registers a new fisherfolk**: Search by ID/name/RSBSA → no match found → click (+) to create → fill personal info (name, DOB, address, sex, contact, RSBSA#, category with icons, 1x1 photo, signature) → if category includes "Boat Owner/Operator", (+) button appears to search existing vessels or register new vessel inline (optional, skippable) → save → status becomes "New" + "Active" → "Date Joined" badge stamped → QR code auto-generated → record appears in Daily Operations sub-tab. Error: duplicate ID detected → system warns and shows existing record for review.

2. **Encoder renews a fisherfolk at start of year**: Search by ID/name/RSBSA/QR scan → match found → verify identity → click "Renew" → update any changed fields (address, contact, category, photo) without admin approval → save → status changes from "Inactive" to "Renewed" + "Active" → registration year updated → appears in Daily Operations. Error: fisherfolk has active violation → renewal blocked, must resolve violation first.

3. **Encoder edits an existing record (non-renewal)**: Open fisherfolk profile → click "Edit" → modify fields → submit as edit request (not saved immediately) → Admin receives notification → Admin reviews diff (old vs new values with red strikethrough → green highlight) → approve or reject with reason → if approved: changes applied immediately, Encoder notified → if rejected: Encoder notified with rejection reason. Exception: records missing basic info (photo/signature) can be edited without approval to complete the record. Error: Admin rejects but Encoder resubmits same change → system shows previous rejection history.

4. **Bantay Dagat files a violation**: Open QR scanner or search by ID/name/RSBSA → find fisherfolk → click "File Violation" → select violation subject (from configurable predefined list) → enter detailed description → upload evidence images (optional, auto-compressed) → add notes → choose whether violation also applies to linked vessel(s) (flexible: fisherfolk only, vessel only, or both) → submit → fisherfolk status becomes "Inactive (Violation)" → linked vessel status becomes "Impounded" if selected → Admin notified. Error: fisherfolk already has active violation → system allows additional violation to be stacked.

5. **Admin lifts a violation**: Open violation record → review details and evidence → click "Lift Violation" → add resolution notes → confirm → fisherfolk status reverts to previous active/renewed status → vessel status reverts if impound was lifted → all parties notified. Error: attempt to lift on archived record → system blocks.

6. **Encoder uses Daily Operations board**: Navigate to Fisherfolk → click "Today's Operations" sub-tab → view today's registrations/renewals/updates with photo/signature completion status → incomplete records (no photo/sig) highlighted and editable without approval → print queue shows ready (complete) vs incomplete (blocked) members regardless of registration date → checkout selected for ID printing → IDs auto-fill on PVC sheet layout → printed IDs logged in today's summary with timestamp and staff name. Two workflows: split (LGU registers incomplete → store adds photo/sig → prints) or direct (register complete → print immediately).

7. **Admin designs and generates fisherfolk IDs**: Navigate to ID Generation → Template Editor tab → select fisherfolk or vessel template → upload background image for front and back → drag data field variables onto 86×54mm canvas → adjust font family/size/weight/color/position per element → category icons (emoji or uploaded image) appear on ID → save template → Select & Print tab → multi-select fisherfolk → PVC Sheet Layout tab → selected members auto-fill onto 200×300mm sheet (1-4 IDs, empty slots shown as dashed placeholders) → content mirrored (scaleX -1) for PVC film back-printing → print. Error: missing photo or signature → blocked from checkout.

8. **Admin manages yearly cycle**: At start of new registration year, Admin triggers "Start New Year" → all Active/Renewed from previous year marked "Inactive" → Encoders renew returning or register new → inactive for 5 consecutive years → auto-archived (still searchable). Error: accidental mid-year trigger → requires confirmation with year selection and impact count.

9. **Any role uses comment/mention system**: Open fisherfolk profile → comments section → rich text → type @ for autocomplete staff mention → submit → mentioned staff gets push notification + email → ticket-type comments for action items. Error: mentioned user deactivated → warning shown, comment still posts.

10. **Encoder registers a new vessel**: Navigate to Vessel Registration → fill MFVR form (vessel name, MFVR number, type, hull material, dimensions, tonnage, engine specs, homeport, fishing gear) → QR code auto-generated → optionally link to fisherfolk owner → save → status "Active". Error: duplicate MFVR → system warns.

11. **Admin creates Ayuda Program**: Navigate to Ayuda Programs → "Create program" → enter title, description → define beneficiary criteria (mix-and-match: status, barangay multi-select, category multi-select, age range, sex) → preview matching count and list → save → generates master list with blank columns (REMARKS, SIGNATURE, DATE RECEIVED) → print with government header → distribute → staff uploads signed sheets (PDF/images, multiple files, auto-compressed) + event photos → Admin verifies: "Check all" per page → uncheck those who didn't receive → save verification → completion progress tracked. Each fisherfolk's profile shows full Ayuda history.

12. **Any authorized role views Dashboard**: Navigate to Dashboard → restructured KPIs: Total Registered with New/Renewed split below, Active Members with inactive breakdown (not renewed + violations) below, Gender distribution, Senior citizens + eligible voters, Vessels + impounded → geographic density map with distinct per-barangay colors on real OpenStreetMap tiles or table heatmap grid → global Charts↔Maps toggle converts ALL bar charts to individual geographic mini-maps → barangay comparison, age demographics, voter analysis, family clusters, category distribution, trends, birthdays, senior citizens by barangay, violation hotspots.

13. **Admin generates reports**: Navigate to Reports → select report type (9 types: Member List, New Registrations, Renewed, Inactive, Senior Citizens, Voter-Eligible, Violations, Vessels, Family Clusters) → filter by status/barangay/category/year/date range → preview records → generate PDF or Excel with official header: Republic of the Philippines / City Government of Calapan / Fisheries Management Office / [Report Title].

## Modules + Features

### Authentication & Access
- Login with email/password
- Role-based access control (Super Admin, Admin, Encoder, Viewer, Bantay Dagat)
- Per-tenant user management
- PWA install prompt for Bantay Dagat mobile use

### Fisherfolk Registration
- New registration form with all personal fields + photo + signature upload
- Smart search before registration (ID, name, RSBSA) with (+) create shortcut
- Auto-generated QR code per fisherfolk (encodes profile URL)
- "Date Joined" badge on profile
- Status management: New, Active, Renewed, Inactive, Inactive (Violation), Archived
- Inline vessel linking during registration for Boat Owner/Operator category
- Image auto-compression on upload (reduce to viewable quality in kilobytes)
- Category icons (emoji or uploaded custom image) displayed on registration form and ID cards
- Incomplete records (missing photo/signature) allow direct edits without admin approval

### Daily Operations (sub-tab under Fisherfolk)
- Today's registrations, renewals, and updates with timestamps
- Photo/signature completion status (✅ Complete or ⚠ Incomplete) per record
- Incomplete records highlighted — editable without approval for basic info completion
- ID print queue showing ready vs incomplete members regardless of registration date
- Checkout selected for printing → auto-fills PVC sheet layout
- Today's printed IDs summary with breakdown (new/renewed/update) and staff attribution
- Supports split workflow (LGU registers → store completes + prints) and direct workflow

### Fisherfolk Renewal
- Yearly renewal workflow triggered by Admin
- Search and renew without edit approval
- Field updates allowed during renewal (address, contact, category, photo)
- Registration year tracking
- Bulk status transition: Active/Renewed → Inactive at year start

### Edit Request System
- Encoder submits edit as request (diff tracked)
- Admin notification queue for pending requests
- Approve/reject with reason — diff view: old (red strikethrough) → new (green highlight)
- Change applied immediately on approval
- Full request history per record
- Notification to Encoder on resolution

### Vessel Registration (BoatR-aligned)
- MFVR number, vessel name, vessel type (Motorized, Non-Motorized)
- Hull material (Wood, Fiberglass, Composite), place built, year built
- Dimensions: registered length, breadth, depth
- Tonnage: gross tonnage, net tonnage
- Propulsion: engine make, serial number, horsepower
- Homeport, fishing gear classification
- Vessel photo upload with compression
- Auto-generated QR code per vessel (encodes vessel profile URL)
- Link to fisherfolk owner (optional, searchable)
- Vessel status: Active, Impounded, Inactive, Archived
- Vessel violation records (independent from fisherfolk violations)
- Vessel profile with linked owner(s), QR code, and violation history
- Vessel ID card template (same 86×54mm PVC format as fisherfolk ID)

### QR Code System
- Auto-generated QR for every fisherfolk: frms.powerbyteitsolutions.app/{tenant}/scan/{fisherfolk_id}
- Auto-generated QR for every vessel: frms.powerbyteitsolutions.app/{tenant}/scan/vessel/{mfvr_number}
- QR Scanner page with camera viewfinder (Mobile First, PWA camera access)
- Manual search fallback (ID number, name, MFVR#)
- Recent scans history showing both fisherfolk and vessel entries
- Scan targets: fisherfolk PVC card QR codes and vessel registration QR stickers

### Violation Management
- QR scan or search to find fisherfolk/vessel
- Violation form: subject (from configurable predefined list), details (rich text), evidence images, notes
- Flexible violation target: fisherfolk only, vessel only, or both
- Bantay Dagat can only view violations they personally filed
- Admin can view all violations across all Bantay Dagat personnel
- Admin-only violation lift with resolution notes
- Violation stacking (multiple active violations per record)
- Status cascade: violation on fisherfolk can optionally cascade to linked vessels

### ID Generation & Template Editor
- **Template editor** (Admin only): drag-and-drop canvas for ID card front and back
  - Upload custom background image for front and back
  - Drag data field variables onto canvas (fisherfolk fields, vessel fields, shared fields)
  - Adjust font family, size, weight, color, alignment, position (X/Y in mm) per element
  - Category icons (emoji or uploaded custom image) appear on ID card
  - ID content area: 86 × 54mm; bleed area: 90 × 58mm (2mm bleed on all sides)
  - Separate templates for fisherfolk IDs and vessel IDs
  - Save, edit, duplicate templates per tenant
- **Select & print**: multi-select fisherfolk/vessels with photo/signature validation
- **PVC sheet layout**: 200 × 300mm sheet, auto-fills 1-4 ID pairs based on selection count
  - Content mirrored (scaleX -1) for PVC film back-printing
  - Empty slots shown as dashed placeholders
  - Supports 1, 2, 3, or 4 IDs per sheet
- Template variables:
  - Fisherfolk: {{photo}}, {{signature}}, {{qr_code}}, {{registration_number}}, {{full_name}}, {{last_name}}, {{first_name}}, {{middle_name}}, {{date_of_birth}}, {{sex}}, {{address}}, {{barangay}}, {{rsbsa_number}}, {{categories}}, {{date_joined}}
  - Vessel: {{vessel_photo}}, {{vessel_qr_code}}, {{mfvr_number}}, {{vessel_name}}, {{vessel_type}}, {{hull_material}}, {{dimensions}}, {{engine_hp}}, {{homeport}}, {{fishing_gear}}, {{owner_name}}, {{year_built}}, {{gross_tonnage}}, {{net_tonnage}}, {{valid_until}}
  - Shared: {{mayor_name}}, {{mayor_signature}}, {{registration_year}}

### Comments & Mentions
- Rich text comments on fisherfolk profiles
- @mention with autocomplete (filtered as you type)
- Push notification + email to mentioned staff
- Ticket-type comments for items needing confirmation
- Visible to all roles on the profile

### Kanban Task Board
- Personal task board per user
- Tasks created from comments, mentions, or manually
- Drag-and-drop columns (To Do, In Progress, Done)
- Assignable to self or from @mention context

### Dashboard (rich analytics hub — charts belong here, not Reports)
- Restructured KPI cards with parent + children layout:
  - Total Registered (top) → New + Renewed split (below)
  - Active Members (top) → Not Renewed + Violations split (below)
  - Gender Distribution → Male % + Female % split
  - Senior Citizens (60+) → Eligible Voters (18+)
  - Vessels Registered → Active Violations + Impounded Vessels
- KPI values: 30px, 800 weight, brighter color variants (#70A8FF, #4ADE80, #FBC02D, #FF6B6B)
- Geographic density map with distinct per-barangay colors on real OpenStreetMap tiles (Leaflet.js iframe, darkened filter for dark theme)
- Table heatmap grid with exact numbers per barangay (switchable with map view)
- **Global Charts ↔ Maps toggle**: single button in Dashboard header converts ALL bar charts to individual geographic mini-maps
  - Each chart becomes its own separate mini-map with data bubbles on real OSM tiles
  - Mini-maps for: barangay comparison, seniors by barangay, voters by barangay, family clusters, violation hotspots
- Barangay population comparison (top 10 bar chart / mini-map)
- Age distribution with 7 brackets (18-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80+)
- Potential voters by barangay (color-intensity grid + campaign insights)
- Family clusters by surname with barangay location
- Category distribution breakdown
- Registration trend (yearly stacked bars: new + renewed)
- Upcoming birthdays (next 30 days with urgency indicators)
- Senior citizens (60+) by barangay
- Violation hotspots with enforcement insights
- Recent activity feed (live)

### Reports (list generator with official government headers — NOT charts)
- Reports is a list generator, not a chart module (charts belong on Dashboard)
- 9 report types: Member List, New Registrations, Renewed Members, Inactive Members, Senior Citizens, Voter-Eligible, Violation Report, Vessel Inventory, Family Clusters
- Official header on all generated reports:
  Republic of the Philippines
  City Government of Calapan
  Fisheries Management Office
  [Report Title]
- Left sidebar: report type selector with descriptions
- Comprehensive filter panel: Status (All/New/Renewed/Active/Inactive), Barangay, Category, Year, Date range
- Live matching record count + preview table
- Generate as PDF or Excel (Admin and Super Admin only)
- Print-friendly layout for LGU presentations and Ayuda distribution lists

### Ayuda Programs (standalone sidebar module — Admin only creation)
- Create program: Title, Description, Date/time created
- Define beneficiary criteria with mix-and-match filters: Status, Barangay (multi-select), Category (multi-select), Age range (from/to), Sex
- Preview matching beneficiary count and list before saving
- Generated master list table with blank columns: REMARKS, SIGNATURE, DATE RECEIVED
- Print master list with official government header
- Upload signed master list sheets as proof (PDF or images, multiple files, auto-compressed to <200KB)
- Upload event photos (images, multiple files, auto-compressed)
- Post-distribution verification by Admin:
  - "Check all" per page → uncheck those who didn't receive
  - Per-page pagination (20 per page) for large lists
  - Verification status: ✅ Received, ❌ Did not receive, ⏳ Unchecked
  - Save verification with "Verified by" attribution
- Program status: Active, Distributing, Completed
- Completion progress bar (percentage based on verification)
- Fisherfolk profile shows Ayuda history: all programs from day 1 with dates and receipt status

### Audit Logging
- Every creation, edit, update, request logged with timestamp + user + IP
- Per-fisherfolk change history (field-level diff)
- Per-vessel change history
- Global activity log (Admin/Super Admin: bird's eye view of all user actions)
- Per-user activity log
- Log retention: permanent (no auto-deletion)

### Tenant Settings (Admin) — tabbed: General / Categories / Violations / Email
- **General**: LGU name, registration year, mayor name + signature upload for ID printing, accent color picker (free color selector, default #4F8EF7 blue)
- **Categories**: Full CRUD management of fisherfolk categories
  - Add new category: name, description, display color
  - Edit existing categories
  - Drag-to-reorder display order (affects registration form dropdown and ID card layout)
  - Disable categories (not delete — existing member assignments preserved)
  - Icon per category: emoji picker (24+ fishing-related emojis) or upload custom image (64×64px PNG/SVG, max 50KB, auto-compressed)
  - Category icons appear on printed ID cards next to category name
  - ID card preview showing how icon + category renders on printed ID
  - Member count per category
  - Auto-generated slug per category
  - **Default seed categories (the real FMO 6-activity taxonomy — see Data Management & Normalization Standards):** Boat Owner/Operator, Capture Fishing, Gleaning, Vendor, Fish Processing, Aquaculture. Seeded for every new tenant; tenants may add/disable but these are the canonical defaults proven against 3,003 production records.
- **Violations**: Configurable predefined violation subjects list (add/remove tags)
- **Email (SMTP)**: Per-tenant SMTP credentials (host, port, username, password, from address)
- Barangay list management

### User Management (Super Admin)
- Create/edit/deactivate user accounts per tenant
- Assign roles
- View per-user activity logs
- System-level deletion (Super Admin only)

### Data Import (Admin only — bulk migration tool)
- 5-step wizard: Upload Excel → Upload Photos → Upload Signatures → Preview & Validate → Import
- **Step 1 — Upload Excel**: accepts cleaned .xlsx with standard columns (ID NUMBER, FULL NAME, DATE OF BIRTH, ADDRESS, SEX, IMAGE, SIGNATURE, RSBSA #, CATEGORY, CONTACT NUMBER, REMARKS)
  - Pre-upload validation: duplicate ID detection (keeps record with most data), date format correction (auto-fix to MM/DD/YYYY), contact number normalization (+63 prefix), category matching against tenant config, required field checks
  - Validation report: valid count, warnings, errors with specific issue descriptions
- **Step 2 — Upload Photos**: batch .jpg files where filename = fisherfolk ID number (e.g., `2025-175205000-08252.jpg`)
  - System matches filenames to Excel rows by ID number
  - Match report: matched, unmatched (skipped), records without photo
  - Auto-compression to <200KB per image
  - Skippable — photos can be added later via Daily Operations
- **Step 3 — Upload Signatures**: batch .png files where filename = fisherfolk ID number
  - Same matching and compression logic as photos
  - Skippable
- **Step 4 — Preview & Validate**: full preview table with status icons (✅/⚠/❌) per row
  - Filter tabs: All, Valid, Warnings, Errors, No Photo, No Signature
  - Error rows highlighted red, warning rows yellow
  - Invalid data flagged inline (e.g., invalid date shown with indicator)
  - Import summary: records to import, to skip, photos/signatures matched
  - Download error report before confirming
- **Step 5 — Import**: bulk insert into database
  - QR codes auto-generated for all imported records
  - Status set to "Active" for all imported members
  - Incomplete records (no photo/sig) available in Daily Operations for completion
  - Import report + error log downloadable
- Access: Admin only, located at /[tenant]/import under System menu
- Use case: initial data migration from Excel-based systems, yearly batch uploads from other LGU offices

### Data Management & Normalization Standards (adopted from the production FMO reporting tool)

> Adopted 2026-06-25 from the live FMO Calapan reporting tool (fmo.powerbyte.app — PHP/SQLite, **3,003 real fisherfolk** across ~51 barangay labels). These are production-proven data-hygiene rules. They are the **single source of truth for data normalization** and apply to BOTH manual registration/renewal AND the bulk Data Import wizard (Step 1 validation + Step 4 preview enforce them).

- **Canonical fisherfolk activity categories (default tenant seed — the real FMO 6-category taxonomy):** Boat Owner/Operator · Capture Fishing · Gleaning · Vendor · Fish Processing · Aquaculture. A fisherfolk may hold multiple (modeled as independent flags, not one exclusive value). Free-text source `CATEGORY` values map to these on import via keyword match: `boat owner`→Boat Owner/Operator, `capture fish`→Capture Fishing, `gleaning`/`gleaner`→Gleaning, `vend`→Vendor, `processing`→Fish Processing, `aquaculture`→Aquaculture. Tenants keep full category CRUD (add/disable), but these 6 seed every new tenant.

- **Field normalization rules (applied on registration save AND on import):**
  - **Date of birth** → canonical `YYYY-MM-DD`. Two-digit year heuristic: `yy > 30` → `19yy`, else `20yy`. Malformed / 3-digit-year values (real case: `990-11-19`) → store null + raise a data-quality **warning** (never silently drop); record falls into the "Unknown" age bucket.
  - **Sex** → `Male` / `Female` derived from the first character (`m`→Male, `f`→Female); anything else → unspecified + flag.
  - **Barangay** → extracted as the text **before the first comma** of a free-text address, Title Case, with Roman numerals upper-cased (`Nag-Iba 1, Calapan` → `Nag-Iba I`). A **tenant-editable typo-normalization map** reconciles known source variants (real cases: `Comunal`↔`Communal`, `Nag-Iba 1`↔`Nag-Iba I`, stray one-offs like `Svs`). Result is validated against the tenant barangay list.
  - **Contact number** → Philippine mobile `09xxxxxxxxx`: strip all non-digits; a 10-digit value starting with `9` gets a leading `0`. Non-conforming numbers are stored but flagged. (Supersedes the earlier "+63 prefix" note — production canonical form is `09xxxxxxxxx`.)

- **Deduplication & idempotency:**
  - Dedup key = `idNumber` (per tenant). Detection runs **in-file** (within one upload) and **in-DB** (against existing records).
  - Import is **insert-only and idempotent** — re-running the same file inserts zero new rows. On a duplicate `idNumber`, FRMS keeps the record with the most complete data; it never blind-overwrites.
  - **ID-collision integrity (real production failure mode):** if the SAME `idNumber` maps to a DIFFERENT person (name/DOB/sex/barangay mismatch beyond tolerance), the row is **NOT auto-merged** — it is flagged in the validation report as an **ID conflict for manual FMO resolution** (issue a new ID or correct the source). This caught a real collision in production: `MR-CL-000534-2015` was held by two different people across two masterlist batches.

- **Photo / signature asset linking:**
  - Assets are matched to records by `idNumber` (filename = ID), case-insensitive, searched across multiple source locations in priority order (current upload batch → existing uploads → prior backup archive; first match wins).
  - Unmatched/missing assets produce a downloadable **data-quality report (CSV)**: records with no photo, records with no signature, and **orphan asset files** that match no record. (Production reference: 22 photos + 11 signatures genuinely missing of 2,976; ~184 orphan images for people not in the list.)
  - A shared placeholder image renders for any record lacking a photo or signature.

- **Incremental import mode:** beyond the full 5-step wizard, an **incremental mode** adds ONLY new `idNumber`s from a partial masterlist (one barangay's batch, or another LGU office's list), links their assets, and skips any `idNumber` already present. The database is **backed up before** an incremental run. (Production reference: a 27-record "EditingPC" batch applied on top of 2,976.)

- **Legacy ID preservation:** imported records **preserve their source `idNumber` exactly** as issued by FMO (production format `MR-CL-NNNNNN-YYYY`). FRMS does NOT regenerate IDs for imported records; newly registered fisherfolk receive an FRMS-generated `idNumber`. ⚠ **DEFERRED OWNER DECISION (PENDING):** whether *new* FRMS registrations should adopt the production `MR-CL-NNNNNN-YYYY` convention (LGU continuity) or keep the current generated `FF-YYYY-NNNN`. Recorded for FMO sign-off — does not block import (imported IDs are preserved either way).

- **Dry-run / preview is non-destructive:** the import preview performs all parsing, normalization, dedup, and asset-matching with **zero DB writes and zero file copies**, then emits the full validation + data-quality summary before any commit (FRMS Step 4 = production `--dry-run`).

## Roles + Permissions

| Role | Can do | Cannot do |
|------|--------|-----------|
| Super Admin | Everything: manage all tenants, create/delete tenants, system-level deletion, manage all users across tenants, view all logs, configure system settings, all Admin capabilities | No restrictions |
| Admin | Register/renew/edit fisherfolk and vessels, approve/reject edit requests, lift violations, manage users within own tenant, view all charts and reports, export reports (PDF/Excel), configure tenant settings (SMTP, mayor name, accent color, categories with icons, barangay list, violation subjects), view all audit logs within tenant, trigger yearly renewal cycle, manage ID templates and generation, create and manage Ayuda programs with verification | System-level deletion, tenant creation/deletion, cross-tenant access |
| Encoder | Register new fisherfolk and vessels, renew existing (with field updates, no approval needed), view records, submit edit requests (cannot edit directly except incomplete records missing photo/signature), generate and print IDs from approved templates, post comments with @mentions, manage personal Kanban tasks, view own activity log, use Daily Operations board | Direct editing outside renewal (except incomplete records), approve/reject requests, lift violations, export reports, view other users' logs, access tenant settings, delete records, create ID templates, create Ayuda programs |
| Viewer | View all charts and dashboards, search records (read-only), post comments with @mentions, view printable reports on-screen (no export) | Create/edit/delete records, submit edit requests, file violations, generate IDs, export reports, access logs or settings |
| Bantay Dagat | Search fisherfolk/vessel via QR scan or search, file violation reports with evidence, view only violations they personally filed, request Admin to lift violations | View other Bantay Dagat's violations, create/edit records, approve/reject anything, view charts/dashboards, export reports, access settings or logs |

## Data Entities

**Fisherfolk**: id, tenantId, idNumber (unique per tenant), fullName, lastName, firstName, middleName, suffix, dateOfBirth, sex, address, barangay, contactNumber, rsbsaNumber, categories (array of category IDs with icons), photo (compressed image path), signature (compressed image path), qrCode (auto-generated, encodes profile URL), status (New, Active, Renewed, Inactive, Inactive-Violation, Archived), dateJoined, registrationYear, remarks, linkedVessels (relation), violations (relation), comments (relation), editRequests (relation), ayudaRecords (relation), createdAt, updatedAt, createdBy, updatedBy

**Vessel**: id, tenantId, mfvrNumber (unique per tenant), vesselName, vesselType (Motorized, Non-Motorized), hullMaterial (Wood, Fiberglass, Composite), placeBuilt, yearBuilt, registeredLength, registeredBreadth, registeredDepth, grossTonnage, netTonnage, engineMake, engineSerialNumber, horsepower, homeport, fishingGearClassification (array), vesselPhoto (compressed image path), qrCode (auto-generated, encodes vessel profile URL), status (Active, Impounded, Inactive, Archived), linkedOwners (relation to Fisherfolk), violations (relation), createdAt, updatedAt, createdBy, updatedBy

**Violation**: id, tenantId, targetType (Fisherfolk, Vessel, Both), fisherfolkId (nullable), vesselId (nullable), subject (from tenant's predefined list), details (rich text), evidenceImages (array of compressed image paths), notes, status (Active, Lifted), filedBy (Bantay Dagat user), liftedBy (Admin user, nullable), liftedAt (nullable), resolutionNotes (nullable), createdAt, updatedAt

**EditRequest**: id, tenantId, fisherfolkId, requestedBy (Encoder user), fieldChanges (JSON: {field: {old, new}}), status (Pending, Approved, Rejected), reviewedBy (Admin user, nullable), reviewedAt (nullable), rejectionReason (nullable), createdAt

**Comment**: id, tenantId, fisherfolkId, authorId, content (rich text), mentionedUserIds (array), isTicket (boolean), ticketStatus (Open, Resolved, nullable), createdAt, updatedAt

**AuditLog**: id, tenantId, userId, action (CREATE, UPDATE, DELETE, REQUEST, APPROVE, REJECT, RENEW, VIOLATION_FILED, VIOLATION_LIFTED, LOGIN, EXPORT), entityType, entityId, changes (JSON diff), ipAddress, userAgent, createdAt

**User**: id, tenantId, email, name, role (SuperAdmin, Admin, Encoder, Viewer, BantayDagat), status (Active, Deactivated), avatarUrl, createdAt, updatedAt

**Tenant**: id, slug (URL path: calapan, naujan, etc.), name, logoUrl, mayorName, mayorSignatureUrl, accentColor (hex, default #4F8EF7), smtpHost, smtpPort, smtpUser, smtpPassword (encrypted), smtpFrom, barangayList (array), violationSubjects (array), currentRegistrationYear, status (Active, Suspended), createdAt, updatedAt

**Category**: id, tenantId, name, description, slug (auto-generated), displayColor (hex), iconType (emoji, image), iconEmoji (nullable), iconImageUrl (nullable, compressed), displayOrder (integer), status (Active, Disabled), memberCount (computed), createdAt, updatedAt

**KanbanTask**: id, tenantId, assignedTo (userId), title, description, status (Todo, InProgress, Done), sourceCommentId (nullable), createdAt, updatedAt

**Notification**: id, tenantId, userId, type (EditRequestPending, EditRequestApproved, EditRequestRejected, ViolationFiled, ViolationLifted, MentionedInComment, TaskAssigned, AyudaDistribution), title, message, entityType, entityId, isRead, createdAt

**AyudaProgram**: id, tenantId, title, description, filters (JSON: {status, barangays[], categories[], ageFrom, ageTo, sex}), beneficiaryCount (computed), status (Active, Distributing, Completed), verifiedCount, notReceivedCount, createdBy, createdAt, updatedAt

**AyudaBeneficiary**: id, programId, fisherfolkId, verificationStatus (Unchecked, Received, NotReceived), verifiedBy (nullable), verifiedAt (nullable), createdAt

**AyudaUpload**: id, programId, uploadType (SignedSheet, EventPhoto), filePath (compressed), originalFilename, fileSize, uploadedBy, uploadedAt

**IDTemplate**: id, tenantId, name, templateType (Fisherfolk, Vessel), frontBackgroundUrl, backBackgroundUrl, frontElements (JSON array: {fieldKey, type, x, y, width, height, fontFamily, fontSize, fontWeight, fontColor, alignment}), backElements (JSON array, same structure), status (Active, Archived), createdBy, createdAt, updatedAt

## Integrations
SMTP (per-tenant): transactional email for notifications, approval alerts, mention alerts — configured by Admin in tenant settings

### PWA
Bantay Dagat personnel can install FRMS as a PWA on mobile devices for quick access to QR scanning and violation filing.

## Deployment Config
Environments: dev / staging / prod
Hosting:      Single Komodo server (VPS) — scalable to multiple servers later
Dev mode:     MODE A — WSL2 native (only supported mode — pre-locked)
Docker Hub:   enabled — hub_repo: bonitobonita24/frms

## Mobile Needs

**Native mobile app:** None — PWA for Bantay Dagat field use (installable via browser, camera access for QR scanning, push notifications via service worker)
**Auth mode:** Session-based (requires active connection)

**Per-page mobile strategy:**

| # | Page | Strategy | Notes |
|---|---|---|---|
| 1 | Login | Mobile First | Access from anywhere |
| 2 | Dashboard | Mobile Ready | Data-dense KPIs, charts, maps, analytics hub |
| 3 | Fisherfolk List + Daily Ops | Mobile Ready | Data tables, sub-tabs (Master List / Today's Operations) |
| 4 | Fisherfolk Profile | Mobile First | Field lookup by Bantay Dagat via QR scan |
| 5 | Fisherfolk Registration Form | Mobile Ready | Multi-field form, desk encoding |
| 6 | Fisherfolk Renewal | Mobile Ready | Desk encoding at start of year |
| 7 | Vessel List | Mobile Ready | Data table, filtering |
| 8 | Vessel Registration Form | Mobile Ready | Multi-field form |
| 9 | Vessel Profile | Mobile First | Field lookup during enforcement |
| 10 | QR Scanner | Mobile First | Camera-based field use |
| 11 | Violation Filing Form | Mobile First | Bantay Dagat files in the field |
| 12 | Violation Records List | Mobile Ready | Admin review |
| 13 | Edit Request Queue | Mobile Ready | Approval workflow, diff view |
| 14 | ID Generation — Select & Print | Mobile Ready | Print workflow |
| 15 | ID Generation — Template Editor | Mobile Ready | Desktop-only drag-drop design tool |
| 16 | ID Generation — PVC Sheet Layout | Mobile Ready | Print preview, auto-fill |
| 17 | Ayuda Programs List | Mobile Ready | Program management |
| 18 | Ayuda Program Detail | Mobile Ready | Master list, verification, uploads |
| 19 | Ayuda Program Create | Mobile Ready | Filter builder, preview |
| 20 | Reports (List Generator) | Mobile Ready | Filter + generate PDF/Excel |
| 21 | Kanban Task Board | Mobile Ready | Drag-and-drop |
| 22 | Audit Logs | Mobile Ready | Data table |
| 23 | User Management | Mobile Ready | Admin settings |
| 24 | Data Import Wizard | Mobile Ready | Admin bulk migration, desktop workflow |
| 25 | Settings — General | Mobile Ready | LGU config, mayor, accent color |
| 26 | Settings — Categories | Mobile Ready | CRUD with icons, reorder |
| 27 | Settings — Violations | Mobile Ready | Tag management |
| 28 | Settings — Email (SMTP) | Mobile Ready | Credential config |
| 29 | Notification Center | Mobile First | Quick check from anywhere |
| 30 | My Profile | Mobile First | Personal settings from any device |

**Phase 4 implementation guidance (for Claude Code):**
- **Mobile First pages:** Design mobile layout first (375px baseline), progressively enhance for tablet (768px) and desktop (1024px+). Touch targets ≥44×44px minimum. Simplified column counts. Single-column forms when viewport <768px.
- **Mobile Ready pages:** Design desktop layout first (1280px+ baseline), gracefully degrade to tablet (768px) and mobile (375px). Horizontal scroll for wide tables, collapsible sidebars, drawer-based navigation on narrow viewports.
- **BOTH strategies use shadcn/ui components** — the difference is breakpoint priority and initial design focus.
- **Tailwind breakpoint convention:** `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px). Mobile First pages use base + `md:` enhancements. Mobile Ready pages use base + `max-md:` fallbacks.

## Non-functional Requirements
Performance:    <300ms API response at 50 concurrent users per tenant
Uptime:         99.5% SLA for prod
Data retention: Fisherfolk records kept indefinitely; archived after 5 years inactive (still searchable); audit logs permanent
Compliance:     Data Privacy Act of 2012 (RA 10173) awareness — to be formally assessed later; no PII export without Admin role
Image storage:  All uploaded images auto-compressed to <200KB while maintaining viewable quality on mobile and desktop

## Tenancy Model
Multi-tenant SaaS
Subdirectory routing: frms.powerbyteitsolutions.app/calapan, frms.powerbyteitsolutions.app/naujan, etc.
Shared global data: none — each LGU is fully isolated
DB isolation exception: none — single shared database with tenant_id row-level isolation via L1-L6 security stack

## User-Facing URLs
/                              Public landing (app info + login redirect)
/login                         Login page
/[tenant]/dashboard            Main dashboard (rich analytics hub)
/[tenant]/fisherfolk            Fisherfolk list + Daily Operations sub-tab
/[tenant]/fisherfolk/new        New registration
/[tenant]/fisherfolk/[id]       Fisherfolk profile / detail (with QR code, Ayuda history)
/[tenant]/fisherfolk/renew      Renewal search & process
/[tenant]/vessels               Vessel list
/[tenant]/vessels/new           New vessel registration
/[tenant]/vessels/[id]          Vessel profile / detail (with QR code)
/[tenant]/scanner               QR scanner (camera + manual search)
/[tenant]/violations            Violation records list
/[tenant]/violations/new        New violation form (with QR scan entry)
/[tenant]/requests              Edit request queue (Admin)
/[tenant]/ids                   ID generation (Select & Print + Template Editor + PVC Layout)
/[tenant]/ayuda                 Ayuda programs list
/[tenant]/ayuda/new             Create new Ayuda program
/[tenant]/ayuda/[id]            Ayuda program detail (master list, verification, uploads)
/[tenant]/reports               Reports list generator
/[tenant]/kanban                Kanban task board
/[tenant]/notifications         Notification center
/[tenant]/logs                  Activity / audit logs (Admin+)
/[tenant]/settings              Tenant settings (General / Categories / Violations / Email)
/[tenant]/users                 User management (Admin+)
/[tenant]/import                Data import wizard (Admin — bulk migration)
/[tenant]/profile               My profile / account settings
/[tenant]/scan/[id]             QR redirect: opens fisherfolk profile
/[tenant]/scan/vessel/[mfvr]    QR redirect: opens vessel profile
/admin                          Super Admin: tenant management, cross-tenant overview

## Access Control
Public routes:    /, /login
Protected routes: /[tenant]/* (require login + tenant membership)
Admin-only:       /[tenant]/requests, /[tenant]/logs, /[tenant]/settings, /[tenant]/users, /[tenant]/import, /[tenant]/ids (template editor tab), /[tenant]/ayuda/new
Super Admin only: /admin, system-level deletion actions

## Data Sensitivity
PII stored:       Yes — full name, date of birth, address, contact number, RSBSA number, photos, signatures
Financial data:   No
Health data:      No
Audit required:   All CRUD on fisherfolk, vessels, violations; all edit requests; all renewals; all logins; all exports; violation filing/lifting; Ayuda program creation/verification; ID generation
GDPR/compliance:  RA 10173 awareness (Data Privacy Act) — formal assessment deferred; PII export restricted to Admin+

## Security Requirements
Rate limiting:    public: 30/min | auth: 10/min | api: 120/min | upload: 20/min
CORS origins:     dev: localhost:* | staging: https://staging-frms.powerbyteitsolutions.app | prod: https://frms.powerbyteitsolutions.app
Security layers:  L1 tenant isolation (row-level tenantId) + L2 tenant middleware (URL slug ↔ session cross-check) + L3 RBAC + L4 tenant-scoped queries + L5 AuditLog + L6 Prisma guardrails — all active in multi-tenant mode
Image uploads:    MIME type validation (image/* only), file extension whitelist (.jpg, .jpeg, .png, .webp), server-side compression before storage, max upload size 10MB pre-compression
Document uploads: PDF allowed for Ayuda signed sheets, max 10MB, MIME validation

## Environments Needed
dev / stage / prod

## Domain / Base URL Expectations
Dev:     http://localhost:[port assigned by Phase 3 — do not specify a number here]
Stage:   https://staging-frms.powerbyteitsolutions.app
Prod:    https://frms.powerbyteitsolutions.app

## Background Jobs (BullMQ + Valkey)
Queue provider: BullMQ (MIT) on Valkey
Retry policy: 3 retries, exponential backoff (1s, 4s, 16s), dead-letter queue after final failure

| Queue Name                  | Trigger                                  | Notes                                                                 |
|-----------------------------|------------------------------------------|-----------------------------------------------------------------------|
| `bulk-import`               | Admin starts Data Import wizard (Step 5) | Processes thousands of rows + photo/signature matching. **Resumable**: saves progress (row index) so it can resume from where it left off on failure rather than restarting from scratch. |
| `yearly-status-reset`       | Admin triggers "Start New Year"          | Bulk status update: Active/Renewed → Inactive for thousands of records |
| `email-notification-digest` | Scheduled / event-driven                 | Pending edit request reminders, daily summary digests                 |

Inline processing (NOT queued — runs during request):
- Image compression (sharp): fast enough per-upload, no queue needed
- QR code generation: fast enough per-record, no queue needed

## Bot Protection (Cloudflare Turnstile)
Turnstile enabled: yes
Widget mode: Managed
Protected pages: Login page only (/login) — no open registration exists (Admins create accounts), so login is the only public-facing form needing bot protection
Dev + staging: Cloudflare test keys (always pass, no hostname needed)
Prod: real keys from dash.cloudflare.com → Turnstile widget (1 hostname: frms.powerbyteitsolutions.app)

## Infrastructure Notes
Default: all services run in Docker Compose — mono-server Komodo for dev/staging/prod.
Docker Hub publishing: enabled — hub_repo: bonitobonita24/frms
GitHub repo: https://github.com/bonitobonita24/Fisherfolk-Registration-and-Management-System.git
pgAdmin: included on all environments — credentials auto-generated by Phase 3
CREDENTIALS.md: generated by Phase 3 — master credentials list for all envs, strictly gitignored
Security: HTTP headers + rate limiter + DOMPurify sanitizer scaffolded by Phase 4 — always-on defaults
Spec stress-test: Phase 2.7 runs automatically before Phase 3 — catches PRODUCT.md gaps early
SMTP: per-tenant configuration stored encrypted in Tenant entity, managed by Admin in frontend settings
Image processing: sharp library for server-side image compression on upload (target <200KB)
QR code generation: server-side QR code generation per fisherfolk and vessel (encodes profile URL)
AWS path when ready: RDS, S3, ElastiCache, SES — update .env.{env} only, zero code changes.

## Tech Stack Preferences
Frontend framework:        Next.js
API style:                 tRPC
ORM / DB layer:            Prisma
Auth provider:             Auth.js v5 (email/password, sessions in PostgreSQL)
Auth strategy:             authjs
Primary database:          PostgreSQL
Cache / queue:             Valkey + BullMQ
File storage:              MinIO (dev) / S3 (prod)
UI component library:      shadcn/ui + Tailwind CSS (locked)
Chart library:             shadcn/ui Chart (Recharts)
Map library:               Leaflet.js + OpenStreetMap (choropleth + density heatmaps + pin/marker)
Complex UI components:     Kibo UI (Kanban board, rich text editor, file dropzone)
Icon set:                  lucide-react (shadcn/ui default)

## Design Identity
Brand feel:         Professional / government-grade with modern dark aesthetic
Target aesthetic:   Linear-inspired dark mode — minimal, monochrome dark surfaces, clean typography, subtle borders, muted palette with configurable blue accent color per tenant
Industry category:  Government / Fisheries SaaS
Dark mode required: Yes — dark mode by default, no light mode toggle; accent color customizable per tenant via color picker (default: #4F8EF7 blue)
Key constraint:     Must work on low-bandwidth connections in coastal barangays; PWA-installable for field enforcement; NO purple or violet colors anywhere in the design
Theming approach:   shadcn/ui CSS variables (--primary set from tenant accentColor, all other tokens derived) — customized in globals.css
                    Design system reference: Linear (https://getdesign.md/linear.app/design-md)
                    Design tokens: see docs/DESIGN.md (extracted from confirmed Phase 2.8 JSX mockup)
                    Reference: https://ui.shadcn.com/docs/theming · Dark mode: https://ui.shadcn.com/docs/dark-mode

## Out of Scope
- No public API for third-party developers
- No SMS notifications (planned for future)
- No BFAR API integration (not connecting to government systems yet)
- No billing or subscription management within the app
- No multi-language support (English only for this version)
- No offline mode (requires internet connection; PWA for quick access, not offline data entry)
- No light mode (dark mode only with accent color customization)
- No boat licensing or permit issuance (registration only)
- No fish catch reporting or harvest tracking
- No financial transaction processing
- No integration with MARINA vessel documentation system
- No purple or violet colors in the design system
