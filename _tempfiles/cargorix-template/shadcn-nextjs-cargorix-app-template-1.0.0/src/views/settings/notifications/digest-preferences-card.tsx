'use client'

// Third-party Imports
import { ClockIcon, InfoIcon, MailIcon } from 'lucide-react'

// Type Imports
import type { DigestFrequency, NotificationSettings } from '@/types/pages/notification-settings'
import { DIGEST_FREQUENCY_OPTIONS, DIGEST_INCLUDE_OPTIONS } from '@/types/pages/notification-settings'

// Component Imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Store Imports
import { useNotificationSettingsStore } from '@/store/use-notification-settings-store'

// Props
type DigestPreferencesCardProps = {
  digest: NotificationSettings['digest']
}

const DigestPreferencesCard = ({ digest }: DigestPreferencesCardProps) => {
  // Hooks
  const setDigest = useNotificationSettingsStore(state => state.setDigest)

  return (
    <Card className='min-w-0'>
      <CardHeader>
        <div className='flex items-start gap-3'>
          <span className='bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <MailIcon className='size-4.5' />
          </span>
          <div className='min-w-0'>
            <CardTitle>Digest Preferences</CardTitle>
            <CardDescription>Manage how you receive summary and non-urgent notifications.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='digest-frequency'>Email Digest</FieldLabel>
            <Select
              items={DIGEST_FREQUENCY_OPTIONS}
              value={digest.frequency}
              onValueChange={value => setDigest({ frequency: value as DigestFrequency })}
            >
              <SelectTrigger id='digest-frequency' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {DIGEST_FREQUENCY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor='digest-send-at'>Send at</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id='digest-send-at'
                value={digest.sendAt}
                placeholder='08:00'
                onChange={event => setDigest({ sendAt: event.target.value })}
              />
              <InputGroupAddon align='inline-end'>
                <ClockIcon />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor='digest-include'>Include</FieldLabel>
          <Select
            items={DIGEST_INCLUDE_OPTIONS}
            value={digest.include}
            onValueChange={value => setDigest({ include: value as string })}
          >
            <SelectTrigger id='digest-include' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
            >
              <SelectGroup>
                {DIGEST_INCLUDE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <div className='text-muted-foreground flex items-start gap-2 text-xs'>
          <InfoIcon className='mt-px size-3.5 shrink-0' />
          <span>You will still receive high priority alerts instantly.</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default DigestPreferencesCard
