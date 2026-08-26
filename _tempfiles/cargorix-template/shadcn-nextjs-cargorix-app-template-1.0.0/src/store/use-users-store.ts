// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { User, UserInviteInput, UserStatus } from '@/types/entities/user'

// Util Imports
import { getInitials } from '@/lib/get-initials'

const buildInvitedUser = (input: UserInviteInput): User => ({
  id: crypto.randomUUID(),
  name: input.name.trim(),
  initials: getInitials(input.name),
  email: input.email.trim().toLowerCase(),
  jobTitle: input.jobTitle.trim(),
  roleId: input.roleId,
  warehouseIds: input.warehouseIds,
  status: 'invited',
  lastLoginAt: null,
  invitedAt: new Date().toISOString(),
  joinedAt: null
})

interface UsersState {
  users: User[]

  initialize: (users: User[]) => void
  getUser: (id: string) => User | undefined
  inviteUser: (input: UserInviteInput) => void
  updateUser: (id: string, patch: Partial<Omit<User, 'id'>>) => void
  setUserStatus: (id: string, status: UserStatus) => void
  deleteUser: (id: string) => void
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: [],

  initialize: users => {
    if (get().users.length > 0) return
    set({ users })
  },

  getUser: id => get().users.find(user => user.id === id),

  inviteUser: input => set(state => ({ users: [buildInvitedUser(input), ...state.users] })),

  updateUser: (id, patch) =>
    set(state => ({ users: state.users.map(user => (user.id === id ? { ...user, ...patch } : user)) })),

  setUserStatus: (id, status) =>
    set(state => ({
      users: state.users.map(user =>
        user.id === id
          ? {
              ...user,
              status,
              joinedAt: status === 'active' && !user.joinedAt ? new Date().toISOString() : user.joinedAt
            }
          : user
      )
    })),

  deleteUser: id => set(state => ({ users: state.users.filter(user => user.id !== id) }))
}))
