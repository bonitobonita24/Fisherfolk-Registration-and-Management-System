"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { AssignRoleSection } from "./assign-role-section";
import { DeleteRoleDialog } from "./delete-role-dialog";
import { RoleFormDialog, type EditingRole } from "./role-form-dialog";

interface RoleBuilderClientProps {
  tenantId: string;
}

interface DeleteTarget {
  id: string;
  name: string;
}

/**
 * Tenant-superadmin Role-Builder screen (PD-005 Chunk 7): lists this
 * tenant's custom roles, and drives the create/edit permission-matrix
 * dialog + delete confirmation + the "assign to user" section below.
 */
export function RoleBuilderClient({ tenantId }: RoleBuilderClientProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EditingRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const utils = trpc.useUtils();
  const { data: roles, isLoading } = trpc.customRole.list.useQuery({ tenantId });

  function openCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function openEdit(role: NonNullable<typeof roles>[number]) {
    setEditingRole({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setFormOpen(true);
  }

  function handleSaved() {
    void utils.customRole.list.invalidate();
  }

  function handleDeleted() {
    void utils.customRole.list.invalidate();
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-3 pb-2">
          <div>
            <CardTitle className="text-sm">Custom Roles</CardTitle>
            <CardDescription className="text-xs">
              Build roles below Tenant Admin with a per-feature permission
              matrix. Custom roles can never grant Billing or User
              Management.
            </CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Role
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading custom roles…
            </p>
          ) : !roles || roles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No custom roles yet. Create one to get started.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableCaption className="sr-only">
                  Custom roles for this tenant, with user count and status.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Name</TableHead>
                    <TableHead scope="col">Description</TableHead>
                    <TableHead scope="col">Users</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions for ${role.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(role)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: role.id, name: role.name })
                              }
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignRoleSection tenantId={tenantId} />

      <RoleFormDialog
        tenantId={tenantId}
        open={formOpen}
        onOpenChange={setFormOpen}
        editingRole={editingRole}
        onSaved={handleSaved}
      />

      <DeleteRoleDialog
        tenantId={tenantId}
        roleId={deleteTarget?.id ?? null}
        roleName={deleteTarget?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
