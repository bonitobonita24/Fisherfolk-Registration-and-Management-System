// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { RulerIcon } from 'lucide-react'

// Type Imports
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Data Imports
import { DIMENSION_UNIT_OPTIONS, DISTANCE_UNIT_OPTIONS, WEIGHT_UNIT_OPTIONS } from './general-settings-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type UnitsMeasurementCardProps = {
  control: Control<GeneralSettingsFormInput>
}

const UnitsMeasurementCard = ({ control }: UnitsMeasurementCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <RulerIcon className='size-4' />
          </span>
          Units &amp; Measurement
        </CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <Controller
          name='weightUnit'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-weight-unit'>
                Weight unit <RequiredMark />
              </FieldLabel>
              <Select
                items={WEIGHT_UNIT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='gs-weight-unit' className='w-full'>
                  <SelectValue placeholder='Select a weight unit' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {WEIGHT_UNIT_OPTIONS.map(item => (
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
          name='distanceUnit'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-distance-unit'>
                Distance unit <RequiredMark />
              </FieldLabel>
              <Select
                items={DISTANCE_UNIT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='gs-distance-unit' className='w-full'>
                  <SelectValue placeholder='Select a distance unit' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {DISTANCE_UNIT_OPTIONS.map(item => (
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
          name='dimensionUnit'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='gs-dimension-unit'>
                Dimension unit <RequiredMark />
              </FieldLabel>
              <Select
                items={DIMENSION_UNIT_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='gs-dimension-unit' className='w-full'>
                  <SelectValue placeholder='Select a dimension unit' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {DIMENSION_UNIT_OPTIONS.map(item => (
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

        <FieldDescription>These units will be used across the system for calculations and display.</FieldDescription>
      </CardContent>
    </Card>
  )
}

export default UnitsMeasurementCard
