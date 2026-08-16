import { redirect } from "next/navigation";

/**
 * `/login` is retained only as a silent redirect for old bookmarks, saved
 * sessions, or in-flight `callbackUrl` links, and as Auth.js's static
 * `pages.signIn`/`error` target (see server/auth/config.ts). It has no
 * single tenant context to route to, so — like the dropped global `/admin`
 * login (Milestone 4a — site-access-tenancy standard) — it falls back to
 * the public marketing landing. Real sign-in now lives per-tenant at
 * `/{slug}/login` (or `/tm/login` for platform staff); middleware.ts routes
 * every unauthenticated deep-link there directly, so this shim is reached
 * only via a stale link, never a normal app flow.
 */
export default function LoginRedirect() {
  redirect("/");
}
