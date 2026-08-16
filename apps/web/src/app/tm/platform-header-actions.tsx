"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PlatformHeaderActionsProps {
  username: string;
}

export function PlatformHeaderActions({ username }: PlatformHeaderActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
        super admin
      </span>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {username}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void signOut({ callbackUrl: "/admin" })}
      >
        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );
}
