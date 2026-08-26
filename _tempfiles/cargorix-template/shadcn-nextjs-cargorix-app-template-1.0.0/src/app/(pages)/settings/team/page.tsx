// Component Imports
import TeamView from '@/views/settings/team'

// Server Action Imports
import { getRolesData, getUsersData, getWarehousesData } from '@/app/server/actions'

const TeamPage = async () => {
  const [users, roles, warehouses] = await Promise.all([getUsersData(), getRolesData(), getWarehousesData()])

  return <TeamView users={users} roles={roles} warehouses={warehouses} />
}

export default TeamPage
