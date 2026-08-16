"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export interface LoginFormProps {
  /** Rendered as the card's H1 — tenant name (tenant login) or app name (`/tm/login`). */
  title: string;
  /** Rendered under the title — e.g. "Sign in" or "Platform Staff Sign-in". */
  subtitle: string;
}

/**
 * Shared sign-in FORM, reused by every per-tenant `/{slug}/login` route and
 * the platform `/tm/login` route (Milestone 4a — site-access-tenancy
 * standard). There is deliberately NO global login anymore — each caller
 * supplies its own title/subtitle; the form itself, the Credentials flow,
 * and the post-auth routing are identical everywhere.
 */
function LoginFormInner({ title, subtitle }: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Default UNCHECKED — ticking this trades the short default session for
  // a long-lived (~30 day) one. See server/auth/config.ts for the
  // jwt.encode-based mechanism.
  const [rememberMe, setRememberMe] = useState(false);

  // This page's own URL prefix (e.g. "/calapan-city" or "/tm") — everything
  // before the trailing "/login" segment.
  const scopePrefix = pathname.replace(/\/login$/, "");

  /**
   * A `callbackUrl` query param is a DEEP-LINK preservation hint (e.g. an
   * unauthenticated visit to `/{slug}/vessels` bounces here with
   * `?callbackUrl=/{slug}/vessels`), never the source of truth for the
   * DEFAULT post-login landing — that is always SERVER-derived by role
   * (middleware.ts's `/` root handler: tenant_manager -> /tm/tenants,
   * tenant_superadmin/tenant_admin -> /{slug}/admin, everyone else ->
   * /{slug}/dashboard). Only a callbackUrl within THIS login page's own
   * scope (same tenant / same `/tm`) is honored — anything else (a bare
   * "//host", an absolute URL, or a different tenant's path) is rejected
   * and we fall through to "/", letting the server compute the landing.
   */
  function resolvePostLoginTarget(): string {
    if (
      rawCallbackUrl &&
      !rawCallbackUrl.startsWith("//") &&
      !rawCallbackUrl.includes("://") &&
      (rawCallbackUrl === scopePrefix || rawCallbackUrl.startsWith(`${scopePrefix}/`))
    ) {
      return rawCallbackUrl;
    }
    return "/";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      turnstileToken: turnstileToken ?? "",
      rememberMe,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    router.push(resolvePostLoginTarget());
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to site
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          {error && (
            <div className="rounded-md bg-destructive p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="webmaster"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-2.5 py-0.5">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="rememberMe"
              className="cursor-pointer select-none text-sm font-normal text-foreground"
            >
              Remember me for 30 days
            </Label>
          </div>

          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
            onSuccess={setTurnstileToken}
            options={{ theme: "auto" }}
          />

          <button
            type="submit"
            disabled={loading}
            className="h-9 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
