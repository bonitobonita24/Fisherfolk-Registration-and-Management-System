"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Bell,
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
import { trpc } from "@/lib/trpc/client";

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

const ENTITY_ROUTES: Record<string, string> = {
  EditRequest: "edit-requests",
  Fisherfolk: "fisherfolk",
  Vessel: "vessels",
  Violation: "violations",
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
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
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
    if (notif.entityType && notif.entityId) {
      const segment = ENTITY_ROUTES[notif.entityType];
      if (segment) {
        router.push(`/${tenant}/${segment}/${notif.entityId}`);
      }
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
        <ul className="space-y-2" aria-label="Notifications list">
          {notifications.map((notif) => {
            const Icon = TYPE_ICON[notif.type] ?? Info;
            const iconClass = TYPE_ICON_CLASS[notif.type] ?? "text-gray-400";
            const isClickable =
              !!notif.entityType &&
              !!notif.entityId &&
              !!ENTITY_ROUTES[notif.entityType];

            return (
              <li key={notif.id}>
                <Card
                  className={
                    notif.isRead ? "bg-card" : "border-primary/40 bg-accent/40"
                  }
                >
                  <CardContent className="flex items-start gap-3 py-4">
                    <Icon
                      className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <Badge
                            variant="default"
                            className="h-4 px-1.5 text-[10px] leading-none"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatRelativeTime(new Date(notif.createdAt))}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {isClickable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(notif)}
                        >
                          View
                        </Button>
                      )}
                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markRead.mutate({ id: notif.id })}
                          disabled={markRead.isPending}
                          aria-label={`Mark "${notif.title}" as read`}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
