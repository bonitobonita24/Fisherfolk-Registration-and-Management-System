"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FormSection } from "@/components/shared";
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
      <FormSection
        title="Custom Roles"
        description="Build roles below Tenant Admin with a per-feature permission matrix. Custom roles can never grant Billing or User Management."
      >
        <div className="flex justify-end">
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            New Role
          </Button>
        </div>
        <div>
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
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Name</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Description</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Users</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-xs font-medium text-muted-foreground last:border-r-0">Status</TableHead>
                    <TableHead scope="col" className="border-r px-3 text-right text-xs font-medium text-muted-foreground last:border-r-0">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="border-r px-3 py-2 text-sm font-medium last:border-r-0">{role.name}</TableCell>
                      <TableCell className="border-r px-3 py-2 text-sm text-muted-foreground last:border-r-0">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">{role.userCount}</TableCell>
                      <TableCell className="border-r px-3 py-2 text-sm last:border-r-0">
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r px-3 py-2 text-right text-sm last:border-r-0">
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
        </div>
      </FormSection>

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
