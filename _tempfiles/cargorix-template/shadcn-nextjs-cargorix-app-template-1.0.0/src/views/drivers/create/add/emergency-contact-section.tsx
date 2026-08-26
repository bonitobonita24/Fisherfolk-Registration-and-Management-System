'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { PhoneIcon } from 'lucide-react'

// Type Imports
import type { CreateDriverFormInput } from '../driver-form-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { RELATIONSHIP_OPTIONS } from '../driver-form-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type EmergencyContactSectionProps = {
  control: Control<CreateDriverFormInput>
}

const EmergencyContactSection = ({ control }: EmergencyContactSectionProps) => {
  return (
    <Card className='h-fit'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <PhoneIcon className='size-5' />
          Emergency Contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
          <Controller
            name='emergencyName'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-emergency-name'>
                  Contact Name <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-emergency-name'
                  placeholder='e.g. Sarah Wang'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='emergencyRelationship'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-emergency-relationship'>
                  Relationship <RequiredMark />
                </FieldLabel>
                <Select
                  items={RELATIONSHIP_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='driver-emergency-relationship' className='w-full'>
                    <SelectValue placeholder='Select a relationship' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {RELATIONSHIP_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='emergencyPhone'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='driver-emergency-phone'>
                  Phone <RequiredMark />
                </FieldLabel>
                <Input
                  id='driver-emergency-phone'
                  placeholder='e.g. +1 (202) 555-0142'
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value ?? ''}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='emergencyAltPhone'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='driver-emergency-alt-phone'>Alternate Phone</FieldLabel>
                <Input
                  id='driver-emergency-alt-phone'
                  placeholder='e.g. +1 (202) 555-0199'
                  {...field}
                  value={field.value ?? ''}
                />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default EmergencyContactSection
