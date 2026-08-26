'use client'

// Third-party Imports
import type { ColumnDef, SortingFn } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ShieldCheckIcon } from 'lucide-react'

// Type Imports
import type { Role } from '@/types/entities/role'
import type { User, UserStatus } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import UserRowActions from './user-row-actions'

// Util Imports
import { getRoleName, getScopeLabel } from '@/lib/selectors/user-selectors'

export const USER_STATUS_BADGE: Record<UserStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success' },
  invited: { label: 'Invited', className: 'bg-info-soft text-info' },
  suspended: { label: 'Suspended', className: 'bg-warning-soft text-warning' }
}

const sortLastLogin: SortingFn<User> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<string | undefined>(columnId)
  const b = rowB.getValue<string | undefined>(columnId)

  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1

  return new Date(a).getTime() - new Date(b).getTime()
}

const getUserColumns = (
  roles: Role[],
  warehouses: Warehouse[],
  onEditUser?: (id: string) => void
): ColumnDef<User>[] => [
  {
    id: 'user',
    accessorFn: row => row.name,
    meta: { filterVariant: 'text', label: 'User' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
    filterFn: (row, _id, value: string) => {
      const search = value.trim().toLowerCase()
      const u = row.original

      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.jobTitle.toLowerCase().includes(search) ||
        getRoleName(roles, u.roleId).toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const u = row.original

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarImage src={u.avatarUrl} alt={u.name} />
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{u.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='font-medium'>{u.name}</span>
            <span className='text-muted-foreground text-xs'>{u.jobTitle}</span>
          </div>
        </div>
      )
    }
  },
  {
    id: 'email',
    accessorFn: row => row.email,
    meta: { label: 'Email' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Email' />,
    cell: ({ row }) => (
      <span className='block max-w-56 truncate text-sm' title={row.original.email}>
        {row.original.email}
      </span>
    )
  },
  {
    id: 'role',
    accessorFn: row => getRoleName(roles, row.roleId),
    meta: { filterVariant: 'select', label: 'Role' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Role' />,
    filterFn: (row, _id, value: string) => value === 'all' || row.original.roleId === value,
    cell: ({ row }) => (
      <span className='flex items-center gap-1.5 text-sm'>
        <ShieldCheckIcon className='text-muted-foreground size-4' />
        {getRoleName(roles, row.original.roleId)}
      </span>
    )
  },
  {
    id: 'scope',
    accessorFn: row => getScopeLabel(row, warehouses).warehouse,
    meta: { label: 'Scope' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
    cell: ({ row }) => {
      const scope = getScopeLabel(row.original, warehouses)

      return (
        <div className='flex flex-col'>
          <span className='text-sm'>{scope.warehouse}</span>
          <span className='text-muted-foreground text-xs'>{scope.region}</span>
        </div>
      )
    }
  },
  {
    id: 'status',
    accessorFn: row => row.status,
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const badge = USER_STATUS_BADGE[row.original.status]

      return <Badge className={badge.className}>{badge.label}</Badge>
    }
  },
  {
    id: 'lastLogin',
    accessorFn: row => row.lastLoginAt ?? undefined,
    meta: { label: 'Last login' },
    sortUndefined: 'last',
    sortingFn: sortLastLogin,
    header: ({ column }) => <DataTableColumnHeader column={column} title='Last login' />,
    cell: ({ row }) => {
      const lastLoginAt = row.original.lastLoginAt

      if (!lastLoginAt) return <span className='text-muted-foreground'>—</span>

      const stamp = new Date(lastLoginAt)

      return (
        <div className='flex flex-col'>
          <span className='text-sm'>{format(stamp, 'MMM d, yyyy')}</span>
          <span className='text-muted-foreground text-xs'>{format(stamp, 'hh:mm a')}</span>
        </div>
      )
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <UserRowActions user={row.original} onEditUser={onEditUser} />
  }
]

export default getUserColumns
