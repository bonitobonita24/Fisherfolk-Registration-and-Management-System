'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'

// Third-party Imports
import { UserPlusIcon } from 'lucide-react'

// Type Imports
import type { Role } from '@/types/entities/role'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import InviteUserDialog from './invite-user-dialog'
import TeamSummaryCard from './team-summary-card'
import UsersTable from '@/views/settings/users-table/users-table'

// Store Imports
import { useRolesStore } from '@/store/use-roles-store'
import { useUsersStore } from '@/store/use-users-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type TeamViewProps = {
  users: User[]
  roles: Role[]
  warehouses: Warehouse[]
}

const TeamView = ({ users: initialUsers, roles: initialRoles, warehouses: initialWarehouses }: TeamViewProps) => {
  // States
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Hooks
  const users = useUsersStore(state => state.users)
  const initializeUsers = useUsersStore(state => state.initialize)
  const roles = useRolesStore(state => state.roles)
  const initializeRoles = useRolesStore(state => state.initialize)
  const warehouses = useWarehousesStore(state => state.warehouses)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  // Vars
  const editingUser = users.find(user => user.id === editingUserId) ?? null

  const handleEditUser = useCallback((id: string) => {
    setEditingUserId(id)
    setIsInviteOpen(true)
  }, [])

  const handleOpenInvite = () => {
    setEditingUserId(null)
    setIsInviteOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsInviteOpen(open)
    if (!open) setEditingUserId(null)
  }

  useEffect(() => {
    initializeUsers(initialUsers)
    initializeRoles(initialRoles)
    initializeWarehouses(initialWarehouses)
  }, [initializeUsers, initialUsers, initializeRoles, initialRoles, initializeWarehouses, initialWarehouses])

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Team &amp; Users</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage internal users, access roles, and warehouse assignments.
          </p>
        </div>
        <Button onClick={handleOpenInvite} className='sm:w-auto'>
          <UserPlusIcon data-icon='inline-start' />
          Invite user
        </Button>
      </div>

      <TeamSummaryCard />
      <UsersTable roles={roles} warehouses={warehouses} onEditUser={handleEditUser} />

      <InviteUserDialog
        open={isInviteOpen}
        onOpenChange={handleOpenChange}
        roles={roles}
        warehouses={warehouses}
        editingUser={editingUser}
      />
    </div>
  )
}

export default TeamView
