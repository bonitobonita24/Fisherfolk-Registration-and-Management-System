"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { MoreHorizontal, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { ListToolbar, ListPagination, SearchInput } from "@/components/shared";

import { CreateUserDialog } from "./create-user-dialog";
import { ChangeRoleDialog } from "./change-role-dialog";

const ROLE_LABELS: Record<string, string> = {
  tenant_manager: "Tenant Manager",
  tenant_superadmin: "Owner",
  tenant_admin: "Admin",
  encoder: "Encoder",
  viewer: "Viewer",
  bantay_dagat: "Bantay Dagat",
};

const ASSIGNABLE_ROLES = [
  { value: "tenant_admin", label: "Admin" },
  { value: "encoder", label: "Encoder" },
  { value: "viewer", label: "Viewer" },
  { value: "bantay_dagat", label: "Bantay Dagat" },
] as const;

const STATUS_FILTERS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DEACTIVATED", label: "Deactivated" },
] as const;

const ROLE_FILTERS = [
  { value: "ALL", label: "All Roles" },
  ...ASSIGNABLE_ROLES,
] as const;

const PAGE_SIZES = [10, 20, 50] as const;

interface RoleTarget {
  id: string;
  username: string;
  role: string;
}

export function UsersClient() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [roleTarget, setRoleTarget] = useState<RoleTarget | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.user.list.useQuery(
    {
      page,
      limit,
      search: search || undefined,
      role: role === "ALL" ? undefined : (role as (typeof ASSIGNABLE_ROLES)[number]["value"]),
      status: status === "ALL" ? undefined : (status as "ACTIVE" | "DEACTIVATED"),
    },
    { placeholderData: keepPreviousData },
  );

  const setStatusMutation = trpc.user.setStatus.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      toast.success("User status updated.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update status.");
    },
  });

  function handleActivate(id: string) {
    setStatusMutation.mutate({ id, status: "ACTIVE" });
  }

  function handleDeactivate(id: string, username: string) {
    if (
      !window.confirm(
        `Deactivate "${username}"? They will be logged out and unable to sign in.`,
      )
    )
      return;
    setStatusMutation.mutate({ id, status: "DEACTIVATED" });
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-4">
      <ListToolbar>
        <div className="flex items-center gap-2">
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">All Users</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {data ? data.total : "-"}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search users…"
            className="w-full sm:w-56"
          />
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[150px]" aria-label="Filter by role">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="w-52">
              {ROLE_FILTERS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="w-52">
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateUserDialog onCreated={() => void utils.user.list.invalidate()} />
        </div>
      </ListToolbar>

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Name
              </TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Username
              </TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Email
              </TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Role
              </TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Status
              </TableHead>
              <TableHead className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">
                Created
              </TableHead>
              <TableHead className="border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">
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
                  <TableCell className="border-r px-3 py-2 text-sm font-medium last:border-r-0">
                    {u.name}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 font-mono text-sm last:border-r-0">
                    {u.username}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    {u.email}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    <Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                      {u.status === "ACTIVE" ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="border-r px-3 py-2 text-right text-sm last:border-r-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${u.username}`}
                          disabled={setStatusMutation.isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setRoleTarget({ id: u.id, username: u.username, role: u.role })
                          }
                        >
                          Change role
                        </DropdownMenuItem>
                        {u.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeactivate(u.id, u.username)}
                          >
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(u.id)}>
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

      <ListPagination
        page={page}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZES}
        pageCount={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        summary={
          data ? `${data.total} user${data.total !== 1 ? "s" : ""} found` : "Loading..."
        }
      />

      <ChangeRoleDialog
        target={roleTarget}
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
        onChanged={() => void utils.user.list.invalidate()}
      />
    </div>
  );
}
