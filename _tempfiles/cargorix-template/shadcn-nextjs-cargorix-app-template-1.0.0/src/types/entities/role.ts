export type PermissionKey = 'read' | 'write' | 'create' | 'delete'

export const PERMISSION_KEY_LIST: PermissionKey[] = ['read', 'write', 'create', 'delete']

export const PERMISSION_RESOURCES: string[] = [
  'Orders',
  'Shipments',
  'Route Planning',
  'Inventory & Stock',
  'Warehouses',
  'Fleet',
  'Drivers',
  'Clients',
  'Suppliers',
  'Purchase Orders',
  'Reports',
  'Settings & Users'
]

export interface ResourcePermissions {
  resource: string
  read: boolean
  write: boolean
  create: boolean
  delete: boolean
}

export interface Role {
  id: string
  name: string
  permissions: ResourcePermissions[]
}

export interface RoleFormData {
  name: string
  permissions: ResourcePermissions[]
}

export type RoleDialogMode = 'add' | 'edit'
