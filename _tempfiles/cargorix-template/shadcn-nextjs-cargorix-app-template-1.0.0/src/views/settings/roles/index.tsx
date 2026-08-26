'use client'

// React Imports
import { useEffect, useState } from 'react'

// Type Imports
import type { Role, RoleDialogMode, RoleFormData } from '@/types/entities/role'
import { PERMISSION_RESOURCES } from '@/types/entities/role'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import UsersTable from '@/views/settings/users-table/users-table'
import RolePermissionDialog from './role-permission-dialog'
import RolesGrid from './roles-grid'

// Store Imports
import { useRolesStore } from '@/store/use-roles-store'
import { useUsersStore } from '@/store/use-users-store'

type RolesViewProps = {
  roles: Role[]
  users: User[]
  warehouses: Warehouse[]
}

const RolesView = ({ roles: initialRoles, users: initialUsers, warehouses }: RolesViewProps) => {
  // Hooks
  const roles = useRolesStore(state => state.roles)
  const initialize = useRolesStore(state => state.initialize)
  const addRole = useRolesStore(state => state.addRole)
  const updateRole = useRolesStore(state => state.updateRole)
  const deleteRole = useRolesStore(state => state.deleteRole)
  const users = useUsersStore(state => state.users)
  const initializeUsers = useUsersStore(state => state.initialize)

  // States
  const [dialogMode, setDialogMode] = useState<RoleDialogMode | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  // Vars
  const editingRole = roles.find(role => role.id === editingRoleId) ?? null

  const handleOpenAdd = () => {
    setEditingRoleId(null)
    setDialogMode('add')
  }

  const handleOpenEdit = (id: string) => {
    setEditingRoleId(id)
    setDialogMode('edit')
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setEditingRoleId(null)
  }

  const handleAddRole = (data: RoleFormData) => {
    addRole(data)
  }

  const handleUpdateRole = (id: string, data: RoleFormData) => {
    updateRole(id, data)
  }

  useEffect(() => {
    initialize(initialRoles)
    initializeUsers(initialUsers)
  }, [initialize, initialRoles, initializeUsers, initialUsers])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Roles</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Define what each team role can see and change across orders, fleet, inventory, and reporting.
        </p>
      </div>

      <RolesGrid roles={roles} users={users} onEdit={handleOpenEdit} onDelete={deleteRole} onAddNew={handleOpenAdd} />

      <Card className='gap-0 p-0 shadow-none'>
        <CardHeader className='border-b p-4'>
          <CardTitle>Total users with their roles</CardTitle>
          <CardDescription>Every user in the workspace and the role currently assigned to them.</CardDescription>
        </CardHeader>
        <CardContent className='p-0 *:rounded-none *:shadow-none'>
          <UsersTable roles={roles} warehouses={warehouses} />
        </CardContent>
      </Card>

      <RolePermissionDialog
        dialogMode={dialogMode}
        editingRole={editingRole}
        permissionResources={PERMISSION_RESOURCES}
        onAddRole={handleAddRole}
        onUpdateRole={handleUpdateRole}
        onClose={handleCloseDialog}
      />
    </div>
  )
}

export default RolesView
