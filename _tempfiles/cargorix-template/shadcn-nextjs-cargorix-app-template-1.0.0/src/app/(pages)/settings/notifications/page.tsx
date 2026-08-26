// Component Imports
import NotificationsView from '@/views/settings/notifications'

// Server Action Imports
import { getNotificationSettingsData } from '@/app/server/actions'

const NotificationsPage = async () => {
  const settings = await getNotificationSettingsData()

  return <NotificationsView settings={settings} />
}

export default NotificationsPage
