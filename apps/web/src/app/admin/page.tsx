"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Default UNCHECKED — ticking this trades the short default session for
  // a long-lived (~30 day) one. See server/auth/config.ts for the
  // jwt.encode-based mechanism.
  const [rememberMe, setRememberMe] = useState(false);

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

    router.push(callbackUrl);
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
            FRMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Staff &amp; Administrator Sign-in
          </p>
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
