'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { KeyRoundIcon, LayersIcon, ShieldCheckIcon } from 'lucide-react'

// Type Imports
import type { Role } from '@/types/entities/role'
import { PERMISSION_KEY_LIST, PERMISSION_RESOURCES } from '@/types/entities/role'
import type { User } from '@/types/entities/user'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import PermissionsTable from './permissions-table'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useRolesStore } from '@/store/use-roles-store'
import { useUsersStore } from '@/store/use-users-store'

type PermissionsViewProps = {
  roles: Role[]
  users: User[]
}

const PermissionsView = ({ roles: initialRoles, users: initialUsers }: PermissionsViewProps) => {
  // Hooks
  const roles = useRolesStore(state => state.roles)
  const initialize = useRolesStore(state => state.initialize)
  const setPermission = useRolesStore(state => state.setPermission)
  const users = useUsersStore(state => state.users)
  const initializeUsers = useUsersStore(state => state.initialize)

  // Vars
  const activePermissions = roles.reduce(
    (total, role) =>
      total +
      role.permissions.reduce((sum, permission) => sum + PERMISSION_KEY_LIST.filter(key => permission[key]).length, 0),
    0
  )

  useEffect(() => {
    initialize(initialRoles)
    initializeUsers(initialUsers)
  }, [initialize, initialRoles, initializeUsers, initialUsers])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Permissions</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Overview of every role and the resource permissions granted to it.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard
          label='Roles'
          value={roles.length}
          icon={<ShieldCheckIcon />}
          iconClassName='bg-info-soft text-info'
        />
        <StatCard
          label='Resources'
          value={PERMISSION_RESOURCES.length}
          icon={<LayersIcon />}
          iconClassName='bg-accent text-accent-foreground'
        />
        <StatCard
          label='Active Permissions'
          value={activePermissions}
          icon={<KeyRoundIcon />}
          iconClassName='bg-success-soft text-success'
        />
      </div>

      <Card className='gap-0 p-0 shadow-none'>
        <CardContent className='overflow-x-auto p-0'>
          <PermissionsTable
            roles={roles}
            users={users}
            resources={PERMISSION_RESOURCES}
            onPermissionChange={setPermission}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionsView
