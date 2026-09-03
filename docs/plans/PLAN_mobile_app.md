# Implementation Plan — FRMS Field Mobile App (Android + iOS)

> Status: DRAFT — decision-ready design doc. No code written. HARD HOLD (local only).
> Author: Claude (Opus) · Date: 2026-09-04 · Scope: `apps/mobile/` (new), additive server changes only.
> Ground truth: scouted against the live monorepo (paths cited inline). Supersedes nothing.

## 0. Executive summary

Field staff need a phone app to do a small, high-value slice of FRMS work **in the field, offline-tolerant**,
where the primary way a record is found is **scanning a QR code** (fisherfolk ID card, vessel, ayuda record),
with manual search as the fallback. Core jobs: **QR scan → resolve + confirm fisherfolk status**, **enter a
violation** (with photo evidence + GPS), and **note-taking** (ties to the planned diary/notes feature).

**Recommendation:** React Native via **Expo (managed workflow)**, in a new `apps/mobile/` workspace, consuming
the existing tRPC API through `@frms/api-client`, reusing `@frms/shared` (types/schemas/rbac — pure TS, RN-safe)
directly, and **never** importing `@frms/db` (Rule 13). Auth becomes token-based via one new mobile-auth
endpoint issuing a bearer token the app stores in Expo SecureStore. Server changes are strictly **additive** —
the web app is untouched.

The heavy lift is NOT the UI; it is (a) a mobile auth path parallel to the web's cookie/JWT session, and
(b) offline queueing for field writes. Both are designed below.

---

## 1. Scouted ground truth (what exists today)

### 1.1 Monorepo shape
- `apps/web` — the Next.js 15 App Router application (the only app today).
- `packages/`:
  - `@frms/shared` (`packages/shared/`) — **pure TS + `zod@^3.23` only** (`packages/shared/package.json`).
    Exports `./types`, `./schemas`, `./constants`, `./rbac`. **Edge/RN-safe — reuse verbatim in RN.**
    - RBAC lives here: `packages/shared/src/rbac/{feature-key.ts,permissions.ts,platform-permissions.ts,index.ts}`.
      `FEATURE_KEYS` = fisherfolk, households, vessels, fish_catches, violations, ayuda, edit_requests, kanban,
      reports, analytics, map, notifications, id_generator, import, audit_log, data_management
      (`packages/shared/src/rbac/feature-key.ts`).
    - Enums: `FisherfolkStatus = NEW | ACTIVE | RENEWED | INACTIVE` (`packages/shared/src/types/enums.ts`) — the FIS-12 status model.
  - `@frms/api-client` (`packages/api-client/src/index.ts`) — thin wrapper over `@trpc/client`
    (`createApiClient(links)`, re-exports `createTRPCClient`, `httpBatchLink`). **Already RN-consumable.**
  - `@frms/db` (`packages/db/`) — Prisma client. **Mobile must never import this (Rule 13).**
  - `@frms/storage`, `@frms/jobs`, `@frms/ui` (web-only shadcn UI — NOT reused on mobile).

### 1.2 tRPC API surface (`apps/web/src/server/trpc/`)
- Router root: `apps/web/src/server/trpc/root.ts`; HTTP handler: `apps/web/src/app/api/trpc/[trpc]/route.ts`.
- Procedure builders (`apps/web/src/server/trpc/trpc.ts`):
  - `publicProcedure`, `protectedProcedure` (enforces `ctx.session` + `ctx.userId`, wraps in `runWithTenant(ctx.tenantId, …)`).
  - `matrixProcedure(feature, action)` — **PD-005 data-driven RBAC** on top of `protectedProcedure`.
  - `adminProcedure`, `encoderProcedure`, `tenantManagerProcedure`, `tenantSuperadminProcedure`,
    `platformMatrixProcedure`, `platformOrTenantAdminProcedure`.
- Routers relevant to MVP: `fisherfolk.ts`, `violation.ts`, `vessel.ts`, `ayuda.ts`, `comment.ts`,
  `notification.ts`, `household.ts`, `family.ts`, `category.ts`.

### 1.3 Auth today (`apps/web/src/server/auth/`)
- Auth.js v5, **`session: { strategy: "jwt" }`**, encrypted JWT (jose `jwtDecrypt`), Credentials provider
  (`username` + `password` + optional `tenantSlug` + `rememberMe`), bcrypt verify against DB, DB-backed
  `securityVersion` check (`apps/web/src/server/auth/index.ts`, `config.ts`, `edge.ts`).
- tRPC context (`apps/web/src/server/trpc/context.ts`) does `const session = await auth()` and reads
  `session.user.{id, role, tenantId, tenantSlug}`. **Auth is 100% cookie-driven today — there is NO
  token/bearer/mobile auth path.** `apps/web/src/server/lib/route-auth.ts` gates page routes.
- Implication: a mobile client cannot ride the browser cookie. We add a **bearer-token path** (§3).

### 1.4 QR — what FIS-13 shipped, what's missing
- Payload lib: `apps/web/src/lib/qr-code.ts`
  - `QR_PAYLOAD_VERSION = 1`; payload = `{ v: 1, id, regNo, tenantId }` as **JSON string**, deliberately
    **PII-free** (no name/address/birthdate).
  - `buildQRPayload(input)`, `parseQRPayload(raw): QRPayload | null`, `renderQRDataUrl(payload)` (client PNG).
- Verify resolver: `fisherfolk.verifyByQr` (`apps/web/src/server/trpc/routers/fisherfolk.ts:682`) —
  `matrixProcedure("fisherfolk","view")`, input `{ raw: string(1..2000) }`. Accepts a raw JSON payload **or**
  a bare fisherfolk cuid (manual fallback). **Tenant-scoped** (embedded `tenantId` must equal `ctx.tenantId`;
  cross-tenant → `{ valid: false }`, never leaks existence). Returns a **safe summary**:
  `{ valid, fisherfolk: { id, fullName, status, registrationYear, barangay, photoKey } }`.
  **The mobile scan reuses this resolver as-is.**
- Fisherfolk QR is minted at create (`fisherfolk.ts:383` → `qrCode` column).
- **Vessel QR IS minted** at `vessel.create` (`apps/web/src/server/trpc/routers/vessel.ts:140`, payload
  `{id, regNo: mfvrNumber, tenantId}`) — but there is **NO `vessel.verifyByQr` resolver** → NEW work.
- **Ayuda has NO QR** — no `qrCode` mint, no verify resolver → NEW work (both mint + resolver).
- Current web scan UX (`apps/web/src/app/[tenant]/verify/verify-client.tsx`) is **manual paste only** —
  no camera library is in the repo. The mobile app is exactly where a real camera scanner belongs.

### 1.5 Violation entry (`apps/web/src/server/trpc/routers/violation.ts`)
- `list`/`getById` = `protectedProcedure`; **`create`/`update` = `adminProcedure`** (⚠ see §7 open decision — field
  staff may not be admins; may need a matrix-gated create).
- Create schema (`packages/shared/src/schemas/violation.ts` → `violationCreateSchema`):
  `{ targetType, fisherfolkId?, vesselId?, subject, details?, evidenceImages: string[], notes?, status?,
  latitude?, longitude? }`. **Already GPS-aware and evidence-image-aware** — a perfect fit for field capture.

### 1.6 Note-taking / notifications
- Closest existing note primitive: `comment.ts` (`create`/`list`, `protectedProcedure`, entity-scoped). The
  planned "diary/notes" feature is **not yet built**; note-taking on mobile should target that plan's router
  when it lands, or the `comment` router as an interim (see §3.4, §7).
- `notification.ts` is **in-app only** (`list`, `getUnreadCount`, `markRead`, `markAllRead`) — **no push infra**
  (no Expo push tokens, no web-push). Push is out of MVP (§7 open decision).

---

## 2. Recommended stack

| Concern | Choice | Justification |
|---|---|---|
| Framework | **React Native + Expo (managed)** | Fastest path to Android+iOS from one TS codebase; OTA updates via EAS Update (ship field fixes without app-store review); first-class camera/secure-storage/filesystem modules; the monorepo is already TS/pnpm so an Expo workspace drops in. Bare RN only if a native module Expo lacks is required — none is (§7). |
| Monorepo placement | `apps/mobile/` (new pnpm workspace) | Mirrors `apps/web`; shares `@frms/shared` + `@frms/api-client` via workspace deps. |
| API transport | tRPC client over HTTP (`@frms/api-client` + `httpBatchLink`) | Reuse the exact server contract + end-to-end types. Import `AppRouter` **type** from web (type-only, no runtime/`@frms/db` leak). |
| Shared code | `@frms/shared` (types, zod schemas, **RBAC resolver**) imported directly | Pure TS + zod — RN-safe. Reuse `parseQRPayload`/`QRPayload` type and the permission matrix so client-side gating matches the server. |
| QR scanning | **`expo-camera`** (has built-in `barcodeScannerSettings` for QR) | Maintained, managed-workflow-native. (`expo-barcode-scanner` is deprecated/merged into `expo-camera`.) Decode QR → feed the raw string straight into `fisherfolk.verifyByQr`. |
| Secure token storage | **`expo-secure-store`** | Keychain (iOS) / Keystore (Android) for the bearer token — never AsyncStorage for secrets. |
| Local persistence / offline | **`expo-sqlite`** (or WatermelonDB) + a write outbox | Field connectivity is patchy; reads cache, writes queue. See §1/offline. |
| Camera/photo evidence | `expo-camera` + `expo-image-picker` | Violation `evidenceImages` capture; upload via existing media path. |
| Location | `expo-location` | Populate violation `latitude`/`longitude` (schema already supports it). |
| State/data cache | **`@tanstack/react-query`** (tRPC's React client) + persisted cache | Same query layer as web; `persistQueryClient` to SQLite/AsyncStorage for offline reads. |
| Navigation | `expo-router` | File-based, matches team's Next.js mental model. |
| Build/distribution | **EAS Build + EAS Submit + EAS Update** | Cloud builds for both stores; OTA JS updates. |

**`@frms/db` boundary (Rule 13):** mobile imports the `AppRouter` **type** only. Enforce with an ESLint
`no-restricted-imports` rule in `apps/mobile/` banning `@frms/db` and any `apps/web/src/server/**` runtime path.

---

## 3. Auth strategy for mobile (token-based, additive)

The web keeps its Auth.js cookie/JWT session untouched. Mobile gets a parallel **bearer-token** path.

### 3.1 New mobile-auth endpoint (server, additive)
- Add a route handler (e.g. `apps/web/src/app/api/mobile/auth/login/route.ts`) that:
  1. Accepts `{ username, password, tenantSlug? }` (reuse the existing `loginSchema` from `auth/index.ts`).
  2. Runs the **same bcrypt verify + tenant resolution + securityVersion** logic the Credentials provider
    already does (extract that into a shared `authorizeCredentials()` helper so web + mobile share one code
    path — no duplicated auth logic).
  3. Issues a **signed JWT access token** (short-lived, e.g. 1h) + a **refresh token** (longer, e.g. 30d,
    rotating). Claims mirror the session: `{ userId, role, tenantId, tenantSlug, securityVersion }`.
  4. Refresh endpoint `…/api/mobile/auth/refresh` validates the refresh token + re-checks `securityVersion`
    (so a server-side revocation / password change invalidates mobile sessions too).
- Reuse the existing JWT signing secret/machinery (jose) — do not invent a second crypto stack.

### 3.2 tRPC context accepts a bearer token (server, additive)
- Extend `apps/web/src/server/trpc/context.ts`: if there is **no** Auth.js cookie session, check for an
  `Authorization: Bearer <token>` header; verify + decode it; populate the **same** `{ session-shaped, userId,
  role, tenantId, tenantSlug }` context. This is the only context change — every existing `protectedProcedure`
  / `matrixProcedure` / `adminProcedure` then works for mobile **unchanged**, and RBAC + tenant scoping are
  enforced server-side exactly as today.
- Fail-closed: an invalid/expired token yields a null session → `protectedProcedure` throws `UNAUTHORIZED`,
  identical to web.

### 3.3 Client token lifecycle (mobile)
- Store access + refresh tokens in `expo-secure-store`.
- tRPC `httpBatchLink` `headers()` attaches `Authorization: Bearer <access>`.
- On `401`/`UNAUTHORIZED`, an interceptor calls the refresh endpoint once; on refresh failure → force re-login.
- Tenant scoping is carried in the token (`tenantId`), never trusted from the client — matches web.

### 3.4 RBAC on mobile
- Server enforcement is authoritative (unchanged). Client-side, import `@frms/shared/rbac` to **hide/disable**
  actions the user can't perform (e.g. show "Record violation" only if the user has `violations:create`),
  so the UX matches permissions without a round trip. Never rely on client gating for security.

---

## 4. Feature scope — MVP, mapped to existing procedures

| Mobile feature | Calls (existing → or NEW) | Notes |
|---|---|---|
| **Login** | NEW `POST /api/mobile/auth/login` (§3.1) | Username/password/tenant; token in SecureStore. |
| **QR scan → resolve fisherfolk** | `fisherfolk.verifyByQr` (EXISTS) | Camera decodes payload → pass `raw` string. Returns safe summary incl. **status** (NEW/ACTIVE/RENEWED/INACTIVE) → **status confirmation is the verify result itself**. |
| **QR scan → resolve vessel** | **NEW `vessel.verifyByQr`** (mirror fisherfolk's) | Vessel QR is already minted; only the resolver is missing (§1.4). |
| **QR scan → resolve ayuda** | **NEW** `ayuda` QR mint at create + **NEW `ayuda.verifyByQr`** | Both sides missing (§1.4). |
| **Scan dispatcher** | client-side | Parse `parseQRPayload` → the payload has no type tag; dispatch by trying fisherfolk first, then vessel/ayuda, OR add a `t` (type) field to the payload v2 (§7 decision). |
| **Manual search** | `fisherfolk.list` / `vessel.list` / `ayuda.list` (EXIST, `protectedProcedure`) | Debounced search by name/reg-no; reuse list filters. |
| **Fisherfolk status confirm** | `fisherfolk.verifyByQr` / `fisherfolk.getById` (EXIST) | Display `status` via shared enum; confirmation = read-only. (Any status *mutation* is out of MVP.) |
| **Violation entry** | `violation.create` (EXISTS, ⚠ `adminProcedure` — see §7) | Capture `subject`, `details`, `targetType`, `fisherfolkId`/`vesselId` (from the scan), `evidenceImages` (camera), `latitude`/`longitude` (`expo-location`). Schema already supports all of this. |
| **Note-taking** | interim `comment.create`/`comment.list` (EXIST) → migrate to the diary/notes router when built | Align field of the "diary/notes plan". Entity-scoped notes on a fisherfolk/vessel. |
| **Evidence photo upload** | existing media path (`@frms/storage` `/api/media`, Telegram backend) | Mobile uploads image → gets a key → put key into `evidenceImages`. Confirm the upload endpoint accepts bearer auth (part of §3.2 work). |

MVP explicitly **excludes**: dashboards/analytics, ID card printing, imports, household editing, push
notifications.

---

## 5. Server-side changes needed (all additive; web untouched)

1. **`authorizeCredentials()` helper** — extract the bcrypt+tenant+securityVersion logic from
   `auth/index.ts` so web Credentials provider and the mobile login endpoint share it.
2. **Mobile auth endpoints** — `POST /api/mobile/auth/login`, `POST /api/mobile/auth/refresh`,
   `POST /api/mobile/auth/logout` (refresh-token revoke). New files under `apps/web/src/app/api/mobile/auth/`.
3. **Bearer-token branch in tRPC context** (`context.ts`) — additive; cookie session still wins if present.
4. **`vessel.verifyByQr`** — new `matrixProcedure("vessels","view")` mirroring `fisherfolk.verifyByQr`
   (tenant-scoped, safe-summary return). ~30 lines.
5. **Ayuda QR** — (a) mint `qrCode` at `ayuda.create` via `buildQRPayload` (needs a `regNo`-equivalent field);
   (b) new `ayuda.verifyByQr` `matrixProcedure("ayuda","view")`. If ayuda has no natural human-readable
   number, decide the payload's `regNo` source (§7).
6. **(Optional, §7)** QR payload **v2** — add a `t: "fisherfolk"|"vessel"|"ayuda"` type tag so the mobile
   scanner dispatches to the right resolver deterministically instead of trial-and-error. Keep v1 parsing for
   already-printed cards (version-gated in `parseQRPayload`).
7. **Violation create authorization** — if field staff are not `tenant_admin`, add a matrix-gated variant
   (`matrixProcedure("violations","create")`) or widen the existing `create` (a [WHAT] scope call — §7).
8. **Media upload auth** — ensure the media/upload route accepts the mobile bearer token.

Every item above is new code or a new branch; **no existing web behavior changes**.

---

## 6. Architecture & delivery

### 6.1 Workspace
```
apps/
  web/        (unchanged)
  mobile/     (NEW — Expo app)
    app/                # expo-router screens (login, scan, search, record, violation, notes)
    src/lib/trpc.ts     # tRPC client, bearer headers, AppRouter type import
    src/lib/auth.ts     # SecureStore token lifecycle + refresh
    src/lib/offline/    # SQLite cache + write outbox + sync engine
    src/lib/qr.ts       # re-export parseQRPayload/QRPayload from @frms/shared or apps/web lib
    eas.json, app.config.ts
packages/
  shared/     (reused as-is)
  api-client/ (reused as-is)
```
- **Move `lib/qr-code.ts`'s pure payload functions** (`buildQRPayload`/`parseQRPayload`/`QRPayload`, minus the
  `qrcode` render dep) into `@frms/shared` so both web and mobile import one source of truth. (`renderQRDataUrl`
  stays web-only since it pulls the `qrcode` package.) This is a small refactor, additive to shared.

### 6.2 Env / config
- `apps/mobile/app.config.ts` reads `EXPO_PUBLIC_API_URL` per env (dev = LAN IP of the dev box; staging =
  `frms-staging.powerbyte.app`; prod = `frms.powerbyte.app`). No secrets in the bundle — tokens are runtime.
- EAS build profiles (`eas.json`): `development` (dev client), `preview` (internal APK/TestFlight), `production`.

### 6.3 CI / build / distribution
- **EAS Build** for both platforms (cloud; no local Xcode/Android SDK needed).
- **EAS Submit** to Play Console + App Store Connect; **EAS Update** for OTA JS patches.
- App-store accounts + signing credentials are an owner prerequisite (§7). LGU branding/app name TBD (§7).

### 6.4 Offline-first (field connectivity)
- **Reads:** persist the react-query cache (recently viewed fisherfolk/vessels) to SQLite so a re-scan or
  re-open works offline; show a "cached / may be stale" indicator.
- **Writes (violations, notes):** append to a local **outbox** (SQLite table: op, payload, createdAt,
  status). A sync engine flushes on reconnect, in order, with idempotency (client-generated request id) so a
  double-flush never creates duplicate violations. Mirrors the proven server-side `squirlnote-log` outbox
  pattern. Conflict policy: field writes are append-only (new violation/note), so last-writer conflicts are
  rare; surface any server rejection back to the user for manual retry.
- **QR verify offline:** `verifyByQr` needs the server; when offline, decode the payload locally and show the
  embedded `{id, regNo}` plus a "not yet verified — will confirm when online" state, queuing the verify.

---

## 7. Phasing + open [WHAT] decisions

### Phasing
- **Phase M1 — Auth + read-only QR verify.** Mobile login (token path), `fisherfolk.verifyByQr` scan +
  manual search + status display. Proves the auth + tRPC + camera spine end to end. Server work: items §5.1–5.4.
- **Phase M2 — Violation entry + status confirm.** Camera evidence + GPS + `violation.create`; vessel/ayuda
  verify resolvers (§5.4–5.5); media upload via bearer. Offline outbox for violation writes.
- **Phase M3 — Note-taking.** Wire to the diary/notes router (or interim `comment` router); offline notes.
- **Phase M4 — Hardening + full.** Refresh-token rotation, OTA update flow, broader read screens, EAS store
  submission, optional push.

### Open [WHAT] decisions for the owner
1. **Expo vs bare RN** — recommend Expo managed. Confirm no native module need forces bare.
2. **Offline scope** — full offline write outbox (M2) vs online-only-with-graceful-errors first? Outbox is
   more work; field reality likely demands it.
3. **App-store accounts + signing** — who owns the Apple Developer ($99/yr) + Google Play ($25) accounts;
   under Powerbyte or the LGU? Blocks store distribution.
4. **Branding / app identity** — app name, icon, splash, bundle id (`ph.gov.calapan.frms`?), LGU vs Powerbyte
   branding. Ties to the fleet white-label standard.
5. **Which roles get the mobile app** — and specifically **can non-admin field staff CREATE violations?**
   Today `violation.create` = `adminProcedure` (§1.5). If field enumerators need it, we either widen it or add
   a `matrixProcedure("violations","create")` variant — a real authorization/scope decision.
6. **Push notifications** — in scope at all? If yes, adds Expo push tokens + a device-registration table +
   notification-dispatch changes (server currently in-app only). Recommend deferring to post-MVP.
7. **QR payload v2 type tag** — add `t: fisherfolk|vessel|ayuda` for deterministic scan dispatch (recommended)
   vs client trial-and-error against three resolvers. v2 must stay backward-compatible with printed v1 cards.
8. **Ayuda QR `regNo` source** — ayuda records may lack a human-readable number; decide what fills the
   payload's `regNo` (or make it optional in a v2 payload).
9. **Diary/notes alignment** — confirm the note-taking data model with the (still-unbuilt) diary/notes plan so
   mobile notes and web notes share one router, not two.

---

## 8. Risks & guardrails
- **Rule 13 (no `@frms/db` on mobile):** enforced by ESLint `no-restricted-imports`; import only the
  `AppRouter` *type*.
- **Auth duplication:** the single biggest footgun — extract `authorizeCredentials()` so web + mobile share
  ONE verify path; never fork bcrypt/securityVersion logic.
- **Tenant isolation:** mobile must never send `tenantId` as trusted input — it lives in the token, checked
  server-side (matches `verifyByQr`'s cross-tenant fail-closed behavior).
- **PII:** the QR payload is deliberately PII-free — keep it that way in v2; the safe-summary return shape is
  the only fisherfolk data the scan exposes.
- **HARD HOLD:** this plan authorizes no deploys, no store submission, no code — all subsequent work is
  branch-and-commit local until the owner explicitly ships.
