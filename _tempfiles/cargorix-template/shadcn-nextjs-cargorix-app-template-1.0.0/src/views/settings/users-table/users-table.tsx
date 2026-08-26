'use client'

// React Imports
import { useMemo } from 'react'

// Type Imports
import type { Role } from '@/types/entities/role'
import { USER_STATUS_LIST } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import getUserColumns from './columns'

// Shared Imports
import EntityTable from '@/components/shared/entity-table'

// Store Imports
import { useUsersStore } from '@/store/use-users-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { buildUsersExport } from '@/lib/selectors/user-selectors'

// Data Imports
import { USER_STATUS_BADGE } from './columns'

const PAGE_SIZES = [10, 25, 50, 100]

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  ...USER_STATUS_LIST.map(status => ({ label: USER_STATUS_BADGE[status].label, value: status }))
]

type UsersTableProps = {
  roles: Role[]
  warehouses: Warehouse[]
  onEditUser?: (id: string) => void
}

const UsersTable = ({ roles, warehouses, onEditUser }: UsersTableProps) => {
  // Vars
  const users = useUsersStore(state => state.users)

  const columns = useMemo(() => getUserColumns(roles, warehouses, onEditUser), [roles, warehouses, onEditUser])

  const filters = useMemo(
    () => [
      { columnId: 'status', label: 'Filter by status', placeholder: 'All statuses', options: STATUS_OPTIONS },
      {
        columnId: 'role',
        label: 'Filter by role',
        placeholder: 'All roles',
        width: 'w-44',
        options: [{ label: 'All roles', value: 'all' }, ...roles.map(role => ({ label: role.name, value: role.id }))]
      }
    ],
    [roles]
  )

  // Hooks
  const table = useEntityTable({
    data: users,
    columns,
    getRowId: row => row.id,
    pageSize: PAGE_SIZES[0]
  })

  return (
    <EntityTable
      table={table}
      columnCount={columns.length}
      noun='users'
      emptyMessage='No users found.'
      search={{ columnId: 'user', label: 'Search users' }}
      filters={filters}
      pageSizes={PAGE_SIZES}
      exportAs={{
        filename: 'team-users',
        title: 'Team & Users',
        build: rows => buildUsersExport(rows, roles, warehouses)
      }}
    />
  )
}

export default UsersTable
