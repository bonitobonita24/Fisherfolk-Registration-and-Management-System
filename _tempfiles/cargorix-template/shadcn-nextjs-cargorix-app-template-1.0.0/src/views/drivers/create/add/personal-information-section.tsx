'use client'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'
import { UserIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AvatarField from './avatar-field'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import ChipInput from '@/components/shared/chip-input'
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { DOB_MIN_DATE, dobMaxDate } from '@/lib/date-bounds'

// Data Imports
import { GENDER_OPTIONS } from '../driver-form-schema'

// Props
type PersonalInformationSectionProps = {
  control: Control<CreateDriverFormInput>
  isEdit?: boolean
}

const PersonalInformationSection = ({ control, isEdit }: PersonalInformationSectionProps) => {
  // Hooks
  const [firstName, lastName] = useWatch({ control, name: ['firstName', 'lastName'] })

  // Vars
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserIcon className='size-5' />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Controller
          name='avatarUrl'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Driver Photo</FieldLabel>
              <AvatarField value={field.value} onChange={field.onChange} fallback={initials} />
            </Field>
          )}
        />

        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='driverId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-id'>
                  Driver ID {!isEdit && <RequiredMark />}
                </FieldLabel>
                <Input
                  id='driver-id'
                  placeholder='e.g. DRV-021'
                  disabled={isEdit}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='firstName'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-first-name'>
                  First Name <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-first-name'
                  placeholder='e.g. Eddie'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='lastName'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-last-name'>
                  Last Name <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-last-name'
                  placeholder='e.g. Wang'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='dob'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-dob'>
                  Date of Birth <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='driver-dob'
                  value={field.value}
                  onChange={field.onChange}
                  min={DOB_MIN_DATE}
                  max={dobMaxDate()}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='gender'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-gender'>Gender</FieldLabel>
                <Select items={GENDER_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='driver-gender' className='w-full'>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {GENDER_OPTIONS.map(item => (
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
            name='nationality'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-nationality'>Nationality</FieldLabel>
                <Input id='driver-nationality' placeholder='e.g. American' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='languages'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-languages'>Languages</FieldLabel>
                <ChipInput
                  id='driver-languages'
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder='Add a language'
                />
              </Field>
            )}
          />

          <Controller
            name='hireDate'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-hire-date'>Hire Date</FieldLabel>
                <DatePicker id='driver-hire-date' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default PersonalInformationSection
