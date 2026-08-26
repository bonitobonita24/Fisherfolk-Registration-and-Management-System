// Component Imports
import ActivityLogView from '@/views/settings/activity'

// Server Action Imports
import { getActivityLogData } from '@/app/server/actions'

const ActivityLogPage = async () => {
  const events = await getActivityLogData()

  return <ActivityLogView events={events} />
}

export default ActivityLogPage
