// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'

// Type Imports
import type { CreateShipmentFormInput } from './create-shipment-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { laterOf, todayDate } from '@/lib/date-bounds'

const SERVICE_LEVEL_OPTIONS = [
  { label: 'Regular service', value: 'regular' },
  { label: 'Express delivery', value: 'express' },
  { label: 'Same-day delivery', value: 'same_day' }
]

const ORIGIN_HUB_OPTIONS = [
  { label: 'Newark Hub', value: 'Newark Hub' },
  { label: 'Bronx DC', value: 'Bronx DC' },
  { label: 'Brooklyn Fulfillment', value: 'Brooklyn Fulfillment' },
  { label: 'Queens Cross-dock', value: 'Queens Cross-dock' },
  { label: 'Direct pickup — no hub', value: 'Direct pickup — no hub' }
]

const ROUTE_TYPE_OPTIONS = [
  { label: 'Fastest route', value: 'Fastest route' },
  { label: 'Low-toll route', value: 'Low-toll route' },
  { label: 'Custom route', value: 'Custom route' }
]

type ScheduleRouteSectionProps = {
  control: Control<CreateShipmentFormInput>
}

const ScheduleRouteSection = ({ control }: ScheduleRouteSectionProps) => {
  // Hooks
  const pickupWindowStart = useWatch({ control, name: 'pickupWindowStart' })
  const pickupWindowEnd = useWatch({ control, name: 'pickupWindowEnd' })

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='border-b p-4'>
        <CardTitle>Schedule & route</CardTitle>
        <p className='text-muted-foreground text-sm'>Service, hub and the windows this shipment must run inside</p>
      </CardHeader>
      <CardContent className='p-4'>
        <FieldGroup className='grid gap-4 sm:grid-cols-2'>
          <Controller
            name='serviceLevel'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='shipment-service-level'>
                  Service level <RequiredMark />
                </FieldLabel>
                <Select items={SERVICE_LEVEL_OPTIONS} value={field.value || 'regular'} onValueChange={field.onChange}>
                  <SelectTrigger id='shipment-service-level' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {SERVICE_LEVEL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name='originHub'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='origin-hub'>
                  Origin hub <RequiredMark />
                </FieldLabel>
                <Select items={ORIGIN_HUB_OPTIONS} value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id='origin-hub' className='w-full'>
                    <SelectValue placeholder='Select a hub' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {ORIGIN_HUB_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
            name='pickupWindowStart'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='pickup-window-start'>
                  Pickup window start <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='pickup-window-start'
                  value={field.value}
                  onChange={field.onChange}
                  min={todayDate()}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='pickupWindowEnd'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='pickup-window-end'>
                  Pickup window end <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='pickup-window-end'
                  value={field.value}
                  onChange={field.onChange}
                  min={laterOf(todayDate(), pickupWindowStart)}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='deliveryDeadline'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='delivery-deadline'>
                  Delivery deadline <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='delivery-deadline'
                  value={field.value}
                  onChange={field.onChange}
                  min={laterOf(todayDate(), pickupWindowStart, pickupWindowEnd)}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='routeType'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel className='gap-0' htmlFor='route-type'>
                  Operational route <RequiredMark />
                </FieldLabel>
                <Select
                  items={ROUTE_TYPE_OPTIONS}
                  value={field.value || 'Fastest route'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id='route-type' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {ROUTE_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default ScheduleRouteSection
