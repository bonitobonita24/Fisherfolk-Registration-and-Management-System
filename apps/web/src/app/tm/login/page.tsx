import { LoginForm } from "@/components/login-form";

/**
 * Platform-staff sign-in (Milestone 4a — site-access-tenancy standard §2).
 * Reachable pre-auth as a GUARD EXCEPTION in both middleware.ts
 * (`loginRouteSlug`) and `app/tm/layout.tsx` (the `x-tenant-login-route`
 * header check) — no tenant theming, unlike `/{slug}/login`.
 */
export default function TmLoginPage() {
  return <LoginForm title="FRMS Platform" subtitle="Platform Staff Sign-in" />;
}
