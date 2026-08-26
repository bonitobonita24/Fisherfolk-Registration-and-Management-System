// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { PermissionKey, Role, RoleFormData } from '@/types/entities/role'

const buildNewRole = (data: RoleFormData): Role => ({
  id: crypto.randomUUID(),
  name: data.name.trim(),
  permissions: data.permissions
})

interface RolesState {
  roles: Role[]

  initialize: (roles: Role[]) => void
  getRole: (id: string) => Role | undefined
  addRole: (data: RoleFormData) => void
  updateRole: (id: string, data: RoleFormData) => void
  deleteRole: (id: string) => void
  setPermission: (roleId: string, resource: string, action: PermissionKey, value: boolean) => void
}

export const useRolesStore = create<RolesState>()((set, get) => ({
  roles: [],

  initialize: roles => {
    if (get().roles.length > 0) return
    set({ roles })
  },

  getRole: id => get().roles.find(role => role.id === id),

  addRole: data => set(state => ({ roles: [...state.roles, buildNewRole(data)] })),

  updateRole: (id, data) =>
    set(state => ({
      roles: state.roles.map(role =>
        role.id === id ? { ...role, name: data.name.trim(), permissions: data.permissions } : role
      )
    })),

  deleteRole: id => set(state => ({ roles: state.roles.filter(role => role.id !== id) })),

  setPermission: (roleId, resource, action, value) =>
    set(state => ({
      roles: state.roles.map(role =>
        role.id === roleId
          ? {
              ...role,
              permissions: role.permissions.map(permission =>
                permission.resource === resource ? { ...permission, [action]: value } : permission
              )
            }
          : role
      )
    }))
}))
