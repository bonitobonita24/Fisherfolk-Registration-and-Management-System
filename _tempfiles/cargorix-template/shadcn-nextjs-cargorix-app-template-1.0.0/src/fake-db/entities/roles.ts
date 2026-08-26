// Type Imports
import type { ResourcePermissions, Role } from '@/types/entities/role'

// Data Imports
import { PERMISSION_RESOURCES } from '@/types/entities/role'

type AccessLevel = 'full' | 'manage' | 'read' | 'none'

const LEVEL_MATRIX: Record<AccessLevel, [read: boolean, write: boolean, create: boolean, remove: boolean]> = {
  full: [true, true, true, true],
  manage: [true, true, true, false],
  read: [true, false, false, false],
  none: [false, false, false, false]
}

const buildPermissions = (
  levels: Partial<Record<string, AccessLevel>>,
  fallback: AccessLevel = 'none'
): ResourcePermissions[] =>
  PERMISSION_RESOURCES.map(resource => {
    const [read, write, create, remove] = LEVEL_MATRIX[levels[resource] ?? fallback]

    return { resource, read, write, create, delete: remove }
  })

export const db: Role[] = [
  {
    id: 'role-001',
    name: 'Administrator',
    permissions: buildPermissions({}, 'full')
  },
  {
    id: 'role-002',
    name: 'Operations Manager',
    permissions: buildPermissions(
      {
        Orders: 'full',
        Shipments: 'full',
        'Route Planning': 'full',
        Fleet: 'manage',
        Drivers: 'manage',
        Clients: 'manage',
        'Inventory & Stock': 'read',
        Warehouses: 'read',
        Suppliers: 'read',
        'Purchase Orders': 'read',
        Reports: 'read',
        'Settings & Users': 'none'
      },
      'read'
    )
  },
  {
    id: 'role-003',
    name: 'Dispatcher',
    permissions: buildPermissions({
      Orders: 'manage',
      Shipments: 'manage',
      'Route Planning': 'full',
      Fleet: 'read',
      Drivers: 'read',
      Clients: 'read',
      Reports: 'read'
    })
  },
  {
    id: 'role-004',
    name: 'Warehouse Supervisor',
    permissions: buildPermissions({
      'Inventory & Stock': 'full',
      Warehouses: 'manage',
      'Purchase Orders': 'manage',
      Orders: 'read',
      Shipments: 'read',
      Suppliers: 'read',
      Reports: 'read'
    })
  },
  {
    id: 'role-005',
    name: 'Finance',
    permissions: buildPermissions({
      'Purchase Orders': 'manage',
      Suppliers: 'manage',
      Clients: 'read',
      Orders: 'read',
      'Inventory & Stock': 'read',
      Reports: 'full'
    })
  },
  {
    id: 'role-006',
    name: 'Viewer',
    permissions: buildPermissions({ 'Settings & Users': 'none' }, 'read')
  }
]
