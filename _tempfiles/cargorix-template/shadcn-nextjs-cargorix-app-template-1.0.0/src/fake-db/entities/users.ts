// Type Imports
import type { User } from '@/types/entities/user'

// Util Imports
import { getInitials } from '@/lib/get-initials'

// Data Imports
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

const ANCHOR = new Date('2026-08-05T00:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

const at = (offsetDays: number, hour = 9) => new Date(ANCHOR - offsetDays * DAY + hour * HOUR).toISOString()

const toEmail = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .split(' ')
    .join('.')}@cargorix.com`

type UserSeed = {
  name: string
  jobTitle: string
  roleId: string
  warehouseIds: string[]
  status: User['status']
  lastLoginDays: number | null
  joinedDays: number | null
  invitedDays: number
}

const SEEDS: UserSeed[] = [
  {
    name: TEAM_MEMBERS[0],
    jobTitle: 'Warehouse Manager',
    roleId: 'role-004',
    warehouseIds: ['wh-bronx'],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 640,
    invitedDays: 645
  },
  {
    name: TEAM_MEMBERS[1],
    jobTitle: 'IT Administrator',
    roleId: 'role-001',
    warehouseIds: [],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 720,
    invitedDays: 726
  },
  {
    name: TEAM_MEMBERS[2],
    jobTitle: 'Operations Manager',
    roleId: 'role-002',
    warehouseIds: [],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 612,
    invitedDays: 618
  },
  {
    name: TEAM_MEMBERS[3],
    jobTitle: 'Senior Dispatcher',
    roleId: 'role-003',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 545,
    invitedDays: 551
  },
  {
    name: TEAM_MEMBERS[4],
    jobTitle: 'Warehouse Supervisor',
    roleId: 'role-004',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 2,
    joinedDays: 498,
    invitedDays: 504
  },
  {
    name: TEAM_MEMBERS[5],
    jobTitle: 'Finance Analyst',
    roleId: 'role-005',
    warehouseIds: ['wh-bronx', 'wh-newark'],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 466,
    invitedDays: 472
  },
  {
    name: TEAM_MEMBERS[6],
    jobTitle: 'Dispatcher',
    roleId: 'role-003',
    warehouseIds: ['wh-brooklyn'],
    status: 'active',
    lastLoginDays: 3,
    joinedDays: 430,
    invitedDays: 436
  },
  {
    name: TEAM_MEMBERS[7],
    jobTitle: 'Account Coordinator',
    roleId: 'role-006',
    warehouseIds: ['wh-queens'],
    status: 'active',
    lastLoginDays: 5,
    joinedDays: 402,
    invitedDays: 409
  },
  {
    name: 'Ryan Matthews',
    jobTitle: 'Administrator',
    roleId: 'role-001',
    warehouseIds: [],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 388,
    invitedDays: 394
  },
  {
    name: 'Sarah Brennan',
    jobTitle: 'Operations Manager',
    roleId: 'role-002',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 356,
    invitedDays: 362
  },
  {
    name: 'James Diaz',
    jobTitle: 'Dispatcher',
    roleId: 'role-003',
    warehouseIds: ['wh-bronx'],
    status: 'active',
    lastLoginDays: 2,
    joinedDays: 331,
    invitedDays: 337
  },
  {
    name: 'Aisha Lee',
    jobTitle: 'Warehouse Manager',
    roleId: 'role-004',
    warehouseIds: ['wh-brooklyn'],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 305,
    invitedDays: 311
  },
  {
    name: 'Marcus Kim',
    jobTitle: 'Regional Operations Manager',
    roleId: 'role-002',
    warehouseIds: ['wh-brooklyn', 'wh-queens'],
    status: 'active',
    lastLoginDays: 4,
    joinedDays: 278,
    invitedDays: 285
  },
  {
    name: 'Marissa Vasquez',
    jobTitle: 'Controller',
    roleId: 'role-005',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 254,
    invitedDays: 260
  },
  {
    name: 'Tom Cooper',
    jobTitle: 'Dispatcher',
    roleId: 'role-003',
    warehouseIds: ['wh-queens'],
    status: 'active',
    lastLoginDays: 6,
    joinedDays: 221,
    invitedDays: 227
  },
  {
    name: 'Bridget White',
    jobTitle: 'Analyst',
    roleId: 'role-006',
    warehouseIds: ['wh-bronx'],
    status: 'active',
    lastLoginDays: 2,
    joinedDays: 197,
    invitedDays: 203
  },
  {
    name: 'Owen Brady',
    jobTitle: 'Warehouse Supervisor',
    roleId: 'role-004',
    warehouseIds: ['wh-queens'],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 168,
    invitedDays: 174
  },
  {
    name: 'Lucia Moreno',
    jobTitle: 'Account Coordinator',
    roleId: 'role-006',
    warehouseIds: ['wh-newark'],
    status: 'invited',
    lastLoginDays: null,
    joinedDays: null,
    invitedDays: 4
  },
  {
    name: 'Ethan Ross',
    jobTitle: 'Dispatcher',
    roleId: 'role-003',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 0,
    joinedDays: 132,
    invitedDays: 138
  },
  {
    name: 'Hannah Cole',
    jobTitle: 'IT Administrator',
    roleId: 'role-001',
    warehouseIds: [],
    status: 'active',
    lastLoginDays: 3,
    joinedDays: 110,
    invitedDays: 116
  },
  {
    name: 'Victor Ortiz',
    jobTitle: 'Warehouse Supervisor',
    roleId: 'role-004',
    warehouseIds: ['wh-newark'],
    status: 'active',
    lastLoginDays: 1,
    joinedDays: 86,
    invitedDays: 92
  },
  {
    name: 'Grace Sullivan',
    jobTitle: 'Finance Analyst',
    roleId: 'role-005',
    warehouseIds: ['wh-queens'],
    status: 'suspended',
    lastLoginDays: 47,
    joinedDays: 63,
    invitedDays: 69
  },
  {
    name: 'Andre Boateng',
    jobTitle: 'Operations Manager',
    roleId: 'role-002',
    warehouseIds: ['wh-bronx'],
    status: 'suspended',
    lastLoginDays: 58,
    joinedDays: 512,
    invitedDays: 518
  },
  {
    name: 'Chloe Nakamura',
    jobTitle: 'Analyst',
    roleId: 'role-006',
    warehouseIds: ['wh-brooklyn'],
    status: 'invited',
    lastLoginDays: null,
    joinedDays: null,
    invitedDays: 9
  }
]

const AVATAR_BY_NAME: Record<string, number> = {
  'Sarah Johnson': 2,
  'Michael Chen': 1,
  'Emily Davis': 4,
  'Daniel Lee': 3,
  'Jason Miller': 5,
  'Rachel Adams': 6,
  'Marcus Bennett': 7,
  'Sofia Alvarez': 8,
  'Ryan Matthews': 9,
  'Sarah Brennan': 10,
  'James Diaz': 11,
  'Aisha Lee': 12,
  'Marcus Kim': 13,
  'Marissa Vasquez': 15,
  'Tom Cooper': 14,
  'Bridget White': 16,
  'Owen Brady': 17,
  'Ethan Ross': 19,
  'Hannah Cole': 18,
  'Victor Ortiz': 1,
  'Grace Sullivan': 20,
  'Andre Boateng': 5
}

export const db: User[] = SEEDS.map((seed, index) => ({
  id: `usr-${String(index + 1).padStart(3, '0')}`,
  name: seed.name,
  initials: getInitials(seed.name),
  avatarUrl: AVATAR_BY_NAME[seed.name] ? `/images/avatars/avatar-${AVATAR_BY_NAME[seed.name]}.webp` : undefined,
  email: toEmail(seed.name),
  jobTitle: seed.jobTitle,
  roleId: seed.roleId,
  warehouseIds: seed.warehouseIds,
  status: seed.status,
  lastLoginAt: seed.lastLoginDays === null ? null : at(seed.lastLoginDays, 9 + (index % 9)),
  invitedAt: at(seed.invitedDays),
  joinedAt: seed.joinedDays === null ? null : at(seed.joinedDays)
}))
