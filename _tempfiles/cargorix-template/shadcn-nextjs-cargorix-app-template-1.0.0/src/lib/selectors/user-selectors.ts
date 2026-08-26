// Type Imports
import type { ExportTable } from '@/types'
import type { Role } from '@/types/entities/role'
import type { User, UserSummary } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

export const getUserCountByRole = (users: User[], roleId: string): number =>
  users.filter(user => user.roleId === roleId).length

export const getUserSummary = (users: User[]): UserSummary => ({
  total: users.length,
  invited: users.filter(user => user.status === 'invited').length,
  active: users.filter(user => user.status === 'active').length,
  suspended: users.filter(user => user.status === 'suspended').length
})

export const getUserName = (users: User[], id: string): string => users.find(user => user.id === id)?.name ?? '—'

export const getRoleName = (roles: Role[], roleId: string): string =>
  roles.find(role => role.id === roleId)?.name ?? '—'

export const getScopeLabel = (user: User, warehouses: Warehouse[]): { warehouse: string; region: string } => {
  if (user.warehouseIds.length === 0) return { warehouse: 'All Warehouses', region: 'All Regions' }

  const assigned = warehouses.filter(warehouse => user.warehouseIds.includes(warehouse.id))

  if (assigned.length === 0) return { warehouse: '—', region: '—' }

  const [first] = assigned
  const extra = assigned.length - 1

  return {
    warehouse: extra > 0 ? `${first.name} +${extra}` : first.name,
    region: extra > 0 ? `${assigned.length} locations` : first.location
  }
}

export const buildUsersExport = (users: User[], roles: Role[], warehouses: Warehouse[]): ExportTable => {
  const headers = ['User', 'Job Title', 'Email', 'Role', 'Assigned Warehouse', 'Region', 'Status', 'Last Login']

  const rows = users.map(user => {
    const scope = getScopeLabel(user, warehouses)

    return [
      user.name,
      user.jobTitle,
      user.email,
      getRoleName(roles, user.roleId),
      scope.warehouse,
      scope.region,
      user.status,
      user.lastLoginAt ?? '—'
    ]
  })

  return { headers, rows }
}
