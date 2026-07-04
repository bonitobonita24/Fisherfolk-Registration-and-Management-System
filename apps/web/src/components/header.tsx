"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Menu, LogOut, Settings, Search, PanelLeft } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userName: string;
  role: string;
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
  tenantSlug?: string;
}

export function Header({ userName, role, onMenuClick, onToggleSidebar, tenantSlug }: HeaderProps) {
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-3">
      {/* Mobile: always-present drawer trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Desktop: collapse toggle — only when app-shell provides the handler */}
      {onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 md:flex"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Search — desktop only; button (not input) so screen readers don't enter forms mode */}
      <div className="hidden flex-1 md:flex">
        <button
          type="button"
          className="flex h-8 w-60 items-center gap-2 rounded-md bg-muted/50 px-2.5 text-sm text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-border px-1 text-xs text-muted-foreground">⌘K</kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{userName}</span>
                <span className="text-xs font-normal capitalize text-muted-foreground">
                  {role.replace("_", " ")}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${tenantSlug ?? ""}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
