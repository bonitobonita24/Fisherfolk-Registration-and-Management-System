'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { NotificationSettings } from '@/types/pages/notification-settings'

// Component Imports
import { Button } from '@/components/ui/button'
import AlertCategoriesTable from './alert-categories-table'
import DigestPreferencesCard from './digest-preferences-card'
import NotificationChannelsCard from './notification-channels-card'
import QuietHoursCard from './quiet-hours-card'

// Store Imports
import { useNotificationSettingsStore } from '@/store/use-notification-settings-store'

// Props
type NotificationsViewProps = {
  settings: NotificationSettings
}

const NotificationsView = ({ settings: initialSettings }: NotificationsViewProps) => {
  // Hooks
  const storedSettings = useNotificationSettingsStore(state => state.settings)
  const initialize = useNotificationSettingsStore(state => state.initialize)
  const saveSettings = useNotificationSettingsStore(state => state.saveSettings)

  // Vars
  const settings = storedSettings ?? initialSettings

  const handleSave = () => {
    saveSettings()
    toast.success('Notification preferences saved')
  }

  useEffect(() => {
    initialize(initialSettings)
  }, [initialize, initialSettings])

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Notifications</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Decide which alerts reach you, on which channel, and when they are allowed to interrupt.
          </p>
        </div>
        <Button onClick={handleSave}>Save preferences</Button>
      </div>

      <NotificationChannelsCard channels={settings.channels} />

      <AlertCategoriesTable categories={settings.categories} channels={settings.channels} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <QuietHoursCard quietHours={settings.quietHours} />
        <DigestPreferencesCard digest={settings.digest} />
      </div>
    </div>
  )
}

export default NotificationsView
