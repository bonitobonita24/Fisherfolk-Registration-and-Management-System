"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PlatformHeaderActionsProps {
  username: string;
  /** Platform tier label — "Admin", "BILLING", "TECH SUPPORT", etc. */
  roleLabel: string;
}

export function PlatformHeaderActions({
  username,
  roleLabel,
}: PlatformHeaderActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-secondary-foreground">
        {roleLabel}
      </span>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {username}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void signOut({ callbackUrl: "/" })}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );
}
