"use client";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: "Tenant Admin",
  encoder: "Encoder",
  viewer: "Viewer",
  bantay_dagat: "Bantay Dagat",
};

/** Only these domain-role tiers may carry a custom-role overlay (server enforces the same set). */
const ASSIGNABLE_ROLES = new Set(["encoder", "viewer", "bantay_dagat"]);

const NONE_VALUE = "__none__";

interface AssignRoleSectionProps {
  tenantId: string;
}

/**
 * Minimal "assign a custom role to a user" control. Lists this tenant's
 * users (via `tenantUser.list`) and, for each user whose fixed tier allows
 * a custom-role overlay (encoder / viewer / bantay_dagat), offers a
 * dropdown of "None" + every active custom role, calling
 * `customRole.assignToUser` on change. Fixed-tier users (tenant_admin /
 * tenant_superadmin) show a disabled "Not applicable" cell instead — the
 * server refuses those assignments outright (FORBIDDEN).
 */
export function AssignRoleSection({ tenantId }: AssignRoleSectionProps) {
  const utils = trpc.useUtils();

  const { data: usersData, isLoading: usersLoading } = trpc.tenantUser.list.useQuery({
    tenantId,
    page: 1,
    limit: 100,
  });

  const { data: roles } = trpc.customRole.list.useQuery({ tenantId });

  const assign = trpc.customRole.assignToUser.useMutation({
    onSuccess: () => {
      void utils.tenantUser.list.invalidate();
      toast.success("Custom role assignment updated.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update assignment.");
    },
  });

  const users = usersData?.items ?? [];
  const activeRoles = (roles ?? []).filter((r) => r.isActive);

  function handleChange(userId: string, value: string) {
    assign.mutate({
      tenantId,
      userId,
      customRoleId: value === NONE_VALUE ? null : value,
    });
  }

  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Assign Custom Roles</CardTitle>
        <CardDescription className="text-xs">
          Attach a custom role to an Encoder, Viewer, or Bantay Dagat user.
          Tenant Admin and Tenant Superadmin accounts always keep their full
          fixed-tier access and cannot carry a custom role.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {usersLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No users found in this tenant.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableCaption className="sr-only">
                Assign a custom role to each eligible user.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">User</TableHead>
                  <TableHead scope="col">Fixed Tier</TableHead>
                  <TableHead scope="col">Custom Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const assignable = ASSIGNABLE_ROLES.has(u.role);
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.username}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {assignable ? (
                          <Select
                            value={u.customRoleId ?? NONE_VALUE}
                            onValueChange={(v) => handleChange(u.id, v)}
                            disabled={assign.isPending}
                          >
                            <SelectTrigger
                              aria-label={`Custom role for ${u.name}`}
                              className="h-8 w-56 text-sm"
                            >
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>None</SelectItem>
                              {activeRoles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not applicable — fixed-tier access
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
