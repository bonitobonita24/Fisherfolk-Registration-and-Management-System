"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isReservedTenantSlug } from "@/lib/tenant-routing";

/**
 * Public tenant PICKER (Milestone 4b — site-access-tenancy standard).
 *
 * `/login` has no single tenant context of its own, so it can't render a
 * sign-in form directly — the real sign-in forms live per-tenant at
 * `/{slug}/login` (or `/tm/login` for platform staff). This page is the
 * generic answer to "how does a public visitor reach their tenant's login":
 * they type their org's slug and get routed straight to it. Unknown slugs
 * are caught by `/{slug}/login` itself (`notFound()` — see that page).
 */
export default function LoginPickerPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your organization's ID to continue.");
      return;
    }
    if (isReservedTenantSlug(trimmed)) {
      setError("That ID isn't a valid organization. Check with your admin.");
      return;
    }
    router.push(`/${trimmed}/login`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your organization&apos;s ID to continue to its sign-in page.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-slug">Organization ID</Label>
            <Input
              id="tenant-slug"
              name="tenant-slug"
              placeholder="e.g. calapan-city"
              autoComplete="off"
              autoCapitalize="none"
              autoFocus
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setError(null);
              }}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
