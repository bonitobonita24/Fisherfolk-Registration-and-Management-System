// Component Imports
import PermissionsView from '@/views/settings/permissions'

// Server Action Imports
import { getRolesData, getUsersData } from '@/app/server/actions'

const PermissionsPage = async () => {
  const [roles, users] = await Promise.all([getRolesData(), getUsersData()])

  return <PermissionsView roles={roles} users={users} />
}

export default PermissionsPage
