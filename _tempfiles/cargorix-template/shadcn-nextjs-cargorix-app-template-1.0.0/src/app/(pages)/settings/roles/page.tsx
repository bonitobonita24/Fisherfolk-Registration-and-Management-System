// Component Imports
import RolesView from '@/views/settings/roles'

// Server Action Imports
import { getRolesData, getUsersData, getWarehousesData } from '@/app/server/actions'

const RolesPage = async () => {
  const [roles, users, warehouses] = await Promise.all([getRolesData(), getUsersData(), getWarehousesData()])

  return <RolesView roles={roles} users={users} warehouses={warehouses} />
}

export default RolesPage
