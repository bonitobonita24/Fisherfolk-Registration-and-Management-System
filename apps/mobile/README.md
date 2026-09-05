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

- Scaffold + auth spine (login screen, token/user persistence via `expo-secure-store`, protected
  tRPC calls with `Authorization: Bearer <token>`) is **authored**, matching the server contract
  shipped in `mobileAuth.login` / `mobileAuth.me`.
- **NOT yet installed, built, or device-verified** — this seat has no device/emulator. The next
  step is running the Bring-up steps above and manually verifying: login succeeds against a real
  dev server, the token survives an app restart (SecureStore), `mobileAuth.me` succeeds while
  signed in, and sign-out clears the session.
- Root `.npmrc` `node-linker=hoisted` change and its impact on `apps/web` has **not** been
  validated — do this as part of first install.

## Next (Module B / C)

- QR scan (`expo-camera` → `fisherfolk.verifyByQr` or equivalent lookup procedure).
- Manual fisherfolk search screen.
- RBAC-aware gating of screens/actions based on `user.role` (mirror the web app's tenant-RBAC
  model — Rule 34).
- Revisit offline/read-caching only if a future owner decision changes the online-first stance.
