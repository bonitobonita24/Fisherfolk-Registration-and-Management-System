'use client'

// React Imports
import type { ComponentType } from 'react'

// Third-party Imports
import { BellIcon, MailIcon, MessageSquareIcon, MonitorIcon } from 'lucide-react'

// Type Imports
import type { NotificationChannel, NotificationSettings } from '@/types/pages/notification-settings'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

// Store Imports
import { useNotificationSettingsStore } from '@/store/use-notification-settings-store'

const CHANNELS: { key: NotificationChannel; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { key: 'inApp', label: 'In-App', Icon: MonitorIcon },
  { key: 'email', label: 'Email', Icon: MailIcon },
  { key: 'sms', label: 'SMS', Icon: MessageSquareIcon }
]

// Props
type NotificationChannelsCardProps = {
  channels: NotificationSettings['channels']
}

const NotificationChannelsCard = ({ channels }: NotificationChannelsCardProps) => {
  // Hooks
  const setChannel = useNotificationSettingsStore(state => state.setChannel)

  return (
    <div className='space-y-4'>
      <Card>
        <CardContent className='flex items-start gap-3'>
          <span className='bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg'>
            <BellIcon className='size-5' />
          </span>
          <div className='min-w-0'>
            <h2 className='text-base font-medium'>Notification Channels</h2>
            <p className='text-muted-foreground text-sm'>
              Select the channels you want to use for receiving notifications.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {CHANNELS.map(({ key, label, Icon }) => {
          const enabled = channels[key]

          return (
            <Card key={key} size='sm'>
              <CardContent className='flex min-w-0 items-center gap-3'>
                <span className='bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
                  <Icon className='size-4.5' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{label}</p>
                  <p className='text-muted-foreground text-xs'>{enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={value => setChannel(key, value)}
                  aria-label={`Toggle ${label} notifications`}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default NotificationChannelsCard
