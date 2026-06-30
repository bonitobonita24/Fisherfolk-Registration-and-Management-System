"use client";

import { useEffect, useState } from "react";
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
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search tenants…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="max-w-sm"
          aria-label="Search tenants"
        />
        <CreateTenantDialog
          onCreated={() => void utils.tenant.list.invalidate()}
        />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Fisherfolk</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-sm">{t.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant={t.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {t.status === "ACTIVE" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.users}
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.fisherfolk}
                  </TableCell>
                  <TableCell>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
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
