"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
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

import { CreateTenantDialog } from "./create-tenant-dialog";

export function TenantsClient() {
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);

  // Debounce: update `search` 300 ms after the user stops typing
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(inputValue.trim() || undefined);
    }, 300);
    return () => clearTimeout(id);
  }, [inputValue]);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.tenant.list.useQuery({
    page: 1,
    limit: 20,
    search,
  });

  const setStatus = trpc.tenant.setStatus.useMutation({
    onSuccess: () => {
      void utils.tenant.list.invalidate();
      toast.success("Tenant status updated.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update status.");
    },
  });

  function handleActivate(id: string) {
    setStatus.mutate({ id, status: "ACTIVE" });
  }

  function handleDeactivate(id: string, name: string) {
    if (
      !window.confirm(
        `Deactivate "${name}"? All active sessions for this tenant will be invalidated.`,
      )
    )
      return;
    setStatus.mutate({ id, status: "SUSPENDED" });
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex min-h-11 flex-wrap items-center gap-2 border-b px-1 py-1.5">
        <Input
          placeholder="Search tenants…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="h-8 w-full max-w-sm sm:w-56"
          aria-label="Search tenants"
        />
        <div className="ml-auto">
          <CreateTenantDialog
            onCreated={() => void utils.tenant.list.invalidate()}
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Name</TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Slug</TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Status</TableHead>
              <TableHead className="border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">Users</TableHead>
              <TableHead className="border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">Fisherfolk</TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Created</TableHead>
              <TableHead className="border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">Actions</TableHead>
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
                  No tenants found.
                </TableCell>
              </TableRow>
            ) : (
              (data?.items ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="border-r px-3 py-2 text-sm font-medium last:border-r-0">{t.name}</TableCell>
                  <TableCell className="border-r px-3 py-2 font-mono text-sm last:border-r-0">{t.slug}</TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    <Badge
                      variant={t.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {t.status === "ACTIVE" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-right text-sm last:border-r-0">
                    {t._count.users}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-right text-sm last:border-r-0">
                    {t._count.fisherfolk}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-right text-sm last:border-r-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${t.name}`}
                          disabled={setStatus.isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tm/tenants/${t.id}/users`}>
                            Manage users
                          </Link>
                        </DropdownMenuItem>
                        {t.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeactivate(t.id, t.name)}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivate(t.id)}
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
    </div>
  );
}
