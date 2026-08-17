import { redirect } from "next/navigation";

/**
 * The global staff/administrator sign-in that used to live here is DROPPED
 * (Milestone 4a — site-access-tenancy standard): every tenant now has its
 * OWN sign-in form at `/{slug}/login`, and platform staff sign in at
 * `/tm/login`. This route has no single tenant context to route an old
 * `/admin` bookmark to, so it falls back to the public marketing landing —
 * the same safe fallback used by `app/login/page.tsx`.
 */
export default function AdminLegacyRedirect() {
  redirect("/");
}
