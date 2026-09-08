# @frms/mobile — FRMS Field (FIS-37)

Expo (React Native) field app for FRMS. This is the **Phase M1 scaffold** — the auth spine only
(login → bearer-token session → protected `mobileAuth.me` reachable, sign out). No field
features (QR scan, search, RBAC-aware data screens) are built yet — see "Next" below.

## Owner decisions (locked)

- **Expo managed workflow** (not bare) — keeps native build complexity low for a small field app.
- **Distribution: self-hosted / downloadable sideloaded APK only.** No App Store / Play Store
  submission — the `eas.json` build profiles reflect this (no `submit` block; `android-apk`
  profile builds an installable `.apk` for direct/internal distribution).
- **Online-first** — no offline-first sync layer in this phase. The app assumes a reachable
  FRMS API.
- **Read-only field staff** — this phase's users are field staff consuming data, not editing it.
- **Push notifications deferred** — not part of this scaffold.

## What's here

```
app/                  expo-router screens
  _layout.tsx         Root layout: SafeAreaProvider + QueryClientProvider + AuthProvider + Stack
  index.tsx           Auth gate — redirects to /login or /home
  login.tsx           Login form (org slug optional, username, password)
  home.tsx            Minimal authed placeholder screen
src/lib/
  api-url.ts          Resolves EXPO_PUBLIC_API_URL → API_URL / TRPC_URL
  trpc.ts             Vanilla tRPC client factory, typed against the web app's AppRouter (type-only import)
  auth.tsx            AuthProvider/useAuth/useTrpc — SecureStore-backed token/user persistence
```

The mobile app imports the web app's `AppRouter` **type only**
(`apps/web/src/server/trpc/root.ts` via the `@frms/web-router` path alias in `tsconfig.json`).
It never imports server or `@frms/db` runtime code — enforced by an ESLint
`no-restricted-imports` rule (Rule 13: mobile never imports `packages/db`).

## Bring-up (NOT yet done on this seat — no device/emulator available here)

1. **Add `node-linker=hoisted` to the REPO-ROOT `.npmrc`** (create it if it doesn't exist).
   pnpm's default `node-linker=isolated` breaks React Native's flat `node_modules` assumption.
   ⚠ This is a **monorepo-wide** setting — after adding it, reinstall and re-verify `apps/web`
   still builds/runs correctly (it should — the setting only changes how node_modules is
   physically laid out, not module resolution semantics for a Next.js app — but confirm).
2. `pnpm install` at the repo root.
3. Set `EXPO_PUBLIC_API_URL` to your dev machine's LAN IP + the web app's dev port, e.g.
   `EXPO_PUBLIC_API_URL=http://192.168.1.50:44387` (a physical device/emulator cannot reach
   `localhost` on the host machine).
4. `pnpm --filter @frms/mobile start` to launch the Expo dev server, then open in Expo Go /
   an emulator.
5. `eas build --profile android-apk` to produce a sideloadable `.apk` for distribution outside
   any app store.

## Status

**Phase M1 COMPLETE (Modules A + B + C) — verified as far as is possible without a device.**

- **Module A** — scaffold, tRPC client (bearer headers, type-only `AppRouter`), `expo-secure-store`
  auth, login screen. Matches the server contract shipped in `mobileAuth.login` / `mobileAuth.me`.
- **Module B** — QR scan (`expo-camera` -> `fisherfolk.verifyByQr`), debounced manual search
  (`fisherfolk.list`), read-only fisherfolk status detail, `StatusBadge`.
- **Module C** — `(tabs)` nav shell (Scan | Search | Profile) with Ionicons, `useCan()` RBAC gating
  on `fisherfolk:view` (cosmetic only — the server is authoritative), profile capability table.

Verified on this seat:

| Check | Result |
|---|---|
| `pnpm --filter @frms/mobile typecheck` | clean (end-to-end types vs the real `AppRouter`) |
| `npx expo-doctor` | 21/21 checks pass |
| `npx expo export --platform android` | bundles (3.2 MB Hermes, 1395 modules) |
| `apps/web` regression after the monorepo install changes | typecheck + build + 428 tests GREEN |

Install changes that were made and validated: root `.npmrc` `node-linker=hoisted` and
`pnpm.overrides` react/react-dom=19.2.3 (single React instance, required by RN). Both are
monorepo-wide; `apps/web` was re-verified green after each.

**NOT yet done — needs a physical device (this seat has none):** run the app and confirm the
login round-trip against a real dev server, that the token survives an app restart (SecureStore),
that the camera QR scan resolves a real fisherfolk QR, and that there is a single React instance at
runtime. Then produce a sideloadable build: `eas build --profile android-apk`.

## Next (Phase M2+)

Per `docs/plans/PLAN_mobile_app.md` §7 phasing — none of this is started:

- **M2 — Violation entry** (camera evidence + GPS via `violation.create`).
  ⚠ Carries a real `[WHAT]`: `violation.create` is `adminProcedure` today, so non-admin field staff
  cannot create violations without either widening it or adding a
  `matrixProcedure("violations","create")` variant. Owner decision before build.
  Also needs `vessel.verifyByQr` (vessel QR is minted, resolver missing) and an offline write outbox.
- **M3 — Notes**, aligned to the FIS-36 notes router (shipped in v0.28.0) rather than a second model.
- **M4 — Hardening**: refresh-token rotation (today's token is single, with `expiresAt`), OTA update
  flow, broader read screens.
- Offline read-caching stays out until a future owner decision changes the online-first stance.
