"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

import { CreateUserDialog } from "./create-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface UsersClientProps {
  tenantId: string;
}

interface ResetTarget {
  userId: string;
  username: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  encoder: "Encoder",
  viewer: "Viewer",
  bantay_dagat: "Bantay Dagat",
};

export function UsersClient({ tenantId }: UsersClientProps) {
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);

  // Debounce: update `search` 300 ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(inputValue.trim() || undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [inputValue]);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.tenantUser.list.useQuery({
    tenantId,
    page: 1,
    limit: 20,
    search,
  });

  const setStatus = trpc.tenantUser.setStatus.useMutation({
    onSuccess: () => {
      void utils.tenantUser.list.invalidate();
      toast.success("User status updated.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update status.");
    },
  });

  function handleActivate(userId: string) {
    setStatus.mutate({ tenantId, userId, status: "ACTIVE" });
  }

  function handleDeactivate(userId: string, username: string) {
    if (
      !window.confirm(
        `Deactivate "${username}"? They will be logged out and unable to sign in.`,
      )
    )
      return;
    setStatus.mutate({ tenantId, userId, status: "DEACTIVATED" });
  }

  return (
    <div className="space-y-4">
      {/* ── Back link + tenant name ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/platform/tenants"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to tenants
        </Link>
        {data?.tenant.name && (
          <>
            <span>/</span>
            <span className="font-medium text-foreground">
              {data.tenant.name}
            </span>
          </>
        )}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search users…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="max-w-sm"
          aria-label="Search users"
        />
        <CreateUserDialog
          tenantId={tenantId}
          onCreated={() => void utils.tenantUser.list.invalidate()}
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Username
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Email
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground animate-pulse"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : (data?.items.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              (data?.items ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {u.username}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {u.status === "ACTIVE" ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${u.username}`}
                          disabled={setStatus.isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setResetTarget({
                              userId: u.id,
                              username: u.username,
                            })
                          }
                        >
                          Reset password
                        </DropdownMenuItem>
                        {u.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              handleDeactivate(u.id, u.username)
                            }
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivate(u.id)}
                          >
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Reset-password dialog (controlled) ────────────────────────────── */}
      <ResetPasswordDialog
        tenantId={tenantId}
        userId={resetTarget?.userId ?? ""}
        username={resetTarget?.username ?? ""}
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        onReset={() => void utils.tenantUser.list.invalidate()}
      />
    </div>
  );
}
