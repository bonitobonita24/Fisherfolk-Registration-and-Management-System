"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CheckCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationHref } from "@/lib/notification-href";
import { trpc } from "@/lib/trpc/client";
import { useTenantHref } from "@/lib/use-tenant-href";

const TYPE_ICON: Record<string, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const TYPE_ICON_CLASS: Record<string, string> = {
  INFO: "text-blue-500",
  SUCCESS: "text-green-500",
  WARNING: "text-yellow-500",
  ERROR: "text-red-500",
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
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationsSkeleton() {
  return (
    <div
      className="divide-y divide-border rounded-lg border border-border"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const tenantHref = useTenantHref();
  const router = useRouter();

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notification.listAll.useQuery({
    page: 1,
    limit: 50,
  });

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      void utils.notification.listAll.invalidate();
      void utils.notification.listUnread.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.listAll.invalidate();
      void utils.notification.listUnread.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function handleRowClick(notif: {
    id: string;
    isRead: boolean;
    entityType: string | null;
    entityId: string | null;
  }) {
    if (!notif.isRead) {
      markRead.mutate({ id: notif.id });
    }
    const rel = notificationHref(notif.entityType, notif.entityId);
    const href = rel ? tenantHref(rel) : null;
    if (href) {
      router.push(href);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            View system notifications and alerts for your account.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              You&apos;re all caught up
            </p>
            <p className="text-sm text-muted-foreground">
              No notifications yet — new alerts will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul
          className="divide-y divide-border rounded-lg border border-border bg-card"
          aria-label="Notifications list"
        >
          {notifications.map((notif) => {
            const Icon = TYPE_ICON[notif.type] ?? Info;
            const iconClass = TYPE_ICON_CLASS[notif.type] ?? "text-gray-400";
            const rel = notificationHref(notif.entityType, notif.entityId);
            const href = rel ? tenantHref(rel) : null;
            const isActionable = !!href || !notif.isRead;

            const rowContent = (
              <>
                <Icon
                  className={`h-4 w-4 shrink-0 ${iconClass}`}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span
                    className={`truncate text-sm ${
                      notif.isRead
                        ? "font-normal text-foreground"
                        : "font-medium text-foreground"
                    }`}
                  >
                    {notif.title}
                  </span>
                  <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground sm:inline">
                    {notif.message}
                  </span>
                </span>
                {!notif.isRead && (
                  <Badge
                    variant="default"
                    className="h-4 shrink-0 px-1.5 text-[10px] leading-none"
                  >
                    New
                  </Badge>
                )}
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatRelativeTime(new Date(notif.createdAt))}
                </span>
              </>
            );

            return (
              <li
                key={notif.id}
                className={`group flex items-center transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  isActionable ? "hover:bg-accent" : ""
                } ${notif.isRead ? "" : "bg-accent/40"}`}
              >
                {isActionable ? (
                  <button
                    type="button"
                    onClick={() => handleRowClick(notif)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={
                      href
                        ? `Open "${notif.title}"`
                        : `Mark "${notif.title}" as read`
                    }
                  >
                    {rowContent}
                  </button>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
                    {rowContent}
                  </div>
                )}
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate({ id: notif.id })}
                    disabled={markRead.isPending}
                    className="mr-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 disabled:opacity-50"
                    aria-label={`Mark "${notif.title}" as read`}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
