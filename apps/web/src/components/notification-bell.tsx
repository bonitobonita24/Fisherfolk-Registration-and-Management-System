"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { notificationHref } from "@/lib/notification-href";
import { useTenantHref } from "@/lib/use-tenant-href";
import { trpc } from "@/lib/trpc/client";

const TYPE_DOT: Record<string, string> = {
  INFO: "bg-blue-500",
  SUCCESS: "bg-green-500",
  WARNING: "bg-yellow-500",
  ERROR: "bg-red-500",
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const tenantHref = useTenantHref();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();

  const { data: countData } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30_000 },
  );

  const { data: listData } = trpc.notification.listUnread.useQuery(
    { page: 1, limit: 10 },
    { refetchInterval: 30_000 },
  );

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.listUnread.invalidate();
    },
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.listUnread.invalidate();
    },
  });

  const unreadCount = countData?.count ?? 0;
  const notifications = listData?.items ?? [];

  function handleRowClick(notif: {
    id: string;
    entityType: string | null;
    entityId: string | null;
  }) {
    markRead.mutate({ id: notif.id });
    const rel = notificationHref(notif.entityType, notif.entityId);
    const href = rel ? tenantHref(rel) : null;
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
        <Separator />
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          // Radix ScrollArea: max-h on the Root never resolves (the Viewport is
          // h-full against an auto-height parent), so the Root's overflow-hidden
          // just clips. Target the Viewport itself with the max-height instead.
          <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-80">
            <ul>
              {notifications.map((notif, index) => {
                const dotClass = TYPE_DOT[notif.type] ?? "bg-gray-400";
                return (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleRowClick(notif)}
                      disabled={markRead.isPending}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {notif.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(new Date(notif.createdAt))}
                        </p>
                      </div>
                    </button>
                    {index < notifications.length - 1 && (
                      <Separator />
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
        <Separator />
        <Link
          href={tenantHref("/notifications")}
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
