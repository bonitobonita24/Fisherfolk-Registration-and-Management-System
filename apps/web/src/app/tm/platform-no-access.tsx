"use client";

import { signOut } from "next-auth/react";
import { LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * PlatformNoAccess — the neutral landing shown to an authenticated platform
 * account (`tenant_manager`) that currently has NO reachable `/tm` section:
 * a restricted BILLING/TECH platform custom role grants `billing` /
 * `tech_support` keys, but no `/tm` page consumes those yet, and it lacks the
 * `tenant_management` grant that `/tm/tenants` requires. Rendered instead of
 * hard-landing such a user on `/tm/tenants` (which would 403 + retry-loop).
 *
 * Copy is deliberately generic — it names no role, states the account has no
 * available sections, and points at the administrator (owner-approved
 * 2026-08-17).
 */
export function PlatformNoAccess() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <ShieldAlert
          className="mx-auto mb-4 h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          No sections available
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No platform sections are available for your account. Contact your
          administrator.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
