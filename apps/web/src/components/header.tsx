"use client";

import { Suspense } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, LogOut, Settings, PanelLeft } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTenantHref } from "@/lib/use-tenant-href";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { YearSelect } from "@/app/[tenant]/dashboard/year-select";
import {
  RegistrationTypeSelect,
  type RegistrationType,
} from "@/app/[tenant]/dashboard/registration-type-select";

interface HeaderProps {
  userName: string;
  role: string;
  onMenuClick?: () => void;
  onToggleSidebar?: () => void;
}

// Isolated so useSearchParams() doesn't force the whole Header (and thus
// every authenticated route via AppShell) to bail out of static rendering.
function DashboardHeaderFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const parsedYear = Number(searchParams.get("year"));
  const year =
    Number.isFinite(parsedYear) && parsedYear > 0
      ? parsedYear
      : new Date().getFullYear();
  const rawReg = searchParams.get("reg");
  const registrationType: RegistrationType =
    rawReg === "NEW" || rawReg === "RENEWED" ? rawReg : "ALL";

  function updateDashboardParam(key: "year" | "reg", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="hidden flex-1 items-center gap-2 md:flex">
      <div className="w-28">
        <YearSelect
          value={year}
          onValueChange={(y) => updateDashboardParam("year", String(y))}
        />
      </div>
      <div className="w-44">
        <RegistrationTypeSelect
          value={registrationType}
          onValueChange={(v) => updateDashboardParam("reg", v)}
        />
      </div>
    </div>
  );
}

export function Header({ userName, role, onMenuClick, onToggleSidebar }: HeaderProps) {
  const initials =
    userName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const pathname = usePathname();
  const onDashboard = pathname?.endsWith("/dashboard") ?? false;
  const tenantHref = useTenantHref();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-muted/40 px-4">
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
        <>
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 md:flex"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mr-1 h-5" />
        </>
      )}

      {/* Dashboard-only filters — desktop only */}
      {onDashboard ? (
        <Suspense fallback={<div className="hidden flex-1 md:flex" />}>
          <DashboardHeaderFilters />
        </Suspense>
      ) : (
        <div className="hidden flex-1 md:flex" />
      )}

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
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
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
              <Link href={tenantHref("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
