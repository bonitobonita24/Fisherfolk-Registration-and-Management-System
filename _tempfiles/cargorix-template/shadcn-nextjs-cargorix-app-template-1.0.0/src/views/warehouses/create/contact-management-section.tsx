// Third-party Imports
import { Controller, type Control, type UseFormSetValue } from 'react-hook-form'
import { ClockIcon } from 'lucide-react'

// Type Imports
import type { User } from '@/types/entities/user'
import type { CreateWarehouseFormInput } from './create-warehouse-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { TIMEZONE_OPTIONS } from './create-warehouse-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type ContactManagementSectionProps = {
  control: Control<CreateWarehouseFormInput>
  setValue: UseFormSetValue<CreateWarehouseFormInput>
  users: User[]
}

const ContactManagementSection = ({ control, setValue, users }: ContactManagementSectionProps) => {
  // Vars
  const activeUsers = users.filter(user => user.status === 'active')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact &amp; Management</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6 sm:grid-cols-2'>
        <Controller
          name='managerId'
          control={control}
          render={({ field, fieldState }) => {
            const assigned = users.find(user => user.id === field.value)

            const managerItems = (
              assigned && assigned.status !== 'active' ? [...activeUsers, assigned] : activeUsers
            ).map(user => ({ label: user.name, value: user.id }))

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='wh-manager'>
                  Manager <RequiredMark />
                </FieldLabel>
                <Select
                  items={managerItems}
                  value={field.value ?? ''}
                  onValueChange={value => {
                    field.onChange(value)

                    const picked = users.find(user => user.id === value)

                    if (picked) setValue('email', picked.email, { shouldDirty: true })
                  }}
                >
                  <SelectTrigger id='wh-manager' className='w-full'>
                    <SelectValue placeholder='Select a manager' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {managerItems.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )
          }}
        />

        <Controller
          name='email'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='wh-email'>Email</FieldLabel>
              <Input
                id='wh-email'
                type='email'
                placeholder='manager@cargorix.com'
                aria-invalid={fieldState.invalid}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='phone'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='wh-phone'>Phone</FieldLabel>
              <Input id='wh-phone' placeholder='+1 (555) 123-4567' {...field} />
            </Field>
          )}
        />

        <Controller
          name='timezone'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='wh-timezone'>Time zone</FieldLabel>
              <Select items={TIMEZONE_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='wh-timezone' className='w-full'>
                  <SelectValue placeholder='Select a time zone' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {TIMEZONE_OPTIONS.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name='operatingHours'
          control={control}
          render={({ field }) => (
            <Field className='sm:col-span-2'>
              <FieldLabel htmlFor='wh-hours'>Operating hours</FieldLabel>
              <InputGroup>
                <InputGroupAddon align='inline-start'>
                  <ClockIcon />
                </InputGroupAddon>
                <InputGroupInput id='wh-hours' placeholder='08:00 AM – 08:00 PM' {...field} />
              </InputGroup>
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default ContactManagementSection
