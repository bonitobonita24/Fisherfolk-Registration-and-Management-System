export type UserStatus = 'active' | 'invited' | 'suspended'

export const USER_STATUS_LIST: UserStatus[] = ['active', 'invited', 'suspended']

export interface User {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  email: string
  jobTitle: string
  roleId: string
  warehouseIds: string[]
  status: UserStatus
  lastLoginAt: string | null
  invitedAt: string
  joinedAt: string | null
}

export interface UserInviteInput {
  name: string
  email: string
  jobTitle: string
  roleId: string
  warehouseIds: string[]
}

export interface UserSummary {
  total: number
  invited: number
  active: number
  suspended: number
}
