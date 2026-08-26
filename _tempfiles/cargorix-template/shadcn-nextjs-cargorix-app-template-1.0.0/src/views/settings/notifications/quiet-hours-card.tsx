'use client'

// Third-party Imports
import { ClockIcon, MoonIcon } from 'lucide-react'

// Type Imports
import type { NotificationSettings } from '@/types/pages/notification-settings'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

// Store Imports
import { useNotificationSettingsStore } from '@/store/use-notification-settings-store'

// Props
type QuietHoursCardProps = {
  quietHours: NotificationSettings['quietHours']
}

const QuietHoursCard = ({ quietHours }: QuietHoursCardProps) => {
  // Hooks
  const setQuietHours = useNotificationSettingsStore(state => state.setQuietHours)

  return (
    <Card className='min-w-0'>
      <CardHeader>
        <div className='flex items-start gap-3'>
          <span className='bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <MoonIcon className='size-4.5' />
          </span>
          <div className='min-w-0'>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>Pause non-critical notifications during these hours.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='quiet-hours-from'>From</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id='quiet-hours-from'
                value={quietHours.from}
                placeholder='22:00'
                onChange={event => setQuietHours({ from: event.target.value })}
              />
              <InputGroupAddon align='inline-end'>
                <ClockIcon />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor='quiet-hours-to'>To</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id='quiet-hours-to'
                value={quietHours.to}
                placeholder='07:00'
                onChange={event => setQuietHours({ to: event.target.value })}
              />
              <InputGroupAddon align='inline-end'>
                <ClockIcon />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>

        <Field orientation='horizontal' className='items-center gap-2'>
          <Checkbox
            id='quiet-hours-allow-high-priority'
            checked={quietHours.allowHighPriority}
            onCheckedChange={checked => setQuietHours({ allowHighPriority: checked === true })}
          />
          <FieldLabel htmlFor='quiet-hours-allow-high-priority' className='font-normal'>
            Allow high priority notifications during quiet hours
          </FieldLabel>
        </Field>
      </CardContent>
    </Card>
  )
}

export default QuietHoursCard
