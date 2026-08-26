// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateWarehouseFormInput } from './create-warehouse-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type CapacityOperationsSectionProps = {
  control: Control<CreateWarehouseFormInput>
  unitsStored?: number
}

const CapacityOperationsSection = ({ control, unitsStored = 0 }: CapacityOperationsSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity &amp; Operations</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-6 sm:grid-cols-3'>
          <Controller
            name='maxCapacity'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='wh-capacity'>
                  Maximum capacity (units) <RequiredMark />
                </FieldLabel>
                <Input
                  id='wh-capacity'
                  type='number'
                  min={0}
                  placeholder='50000'
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
                {unitsStored > 0 && (
                  <FieldDescription>
                    Currently holding {unitsStored.toLocaleString()} units — capacity cannot go below this.
                  </FieldDescription>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='dockCount'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='wh-docks'>
                  Number of docks <RequiredMark />
                </FieldLabel>
                <Input
                  id='wh-docks'
                  type='number'
                  min={0}
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='zoneCount'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='wh-zones'>
                  Number of zones <RequiredMark />
                </FieldLabel>
                <Input
                  id='wh-zones'
                  type='number'
                  min={0}
                  aria-invalid={fieldState.invalid}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value == null ? '' : String(field.value)}
                  onChange={event => field.onChange(event.target.value)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className='space-y-3'>
          <Controller
            name='allowInbound'
            control={control}
            render={({ field }) => (
              <FieldLabel htmlFor='wh-allow-inbound' className='font-normal'>
                <Field orientation='horizontal'>
                  <Checkbox
                    id='wh-allow-inbound'
                    checked={field.value}
                    onCheckedChange={checked => field.onChange(checked === true)}
                  />
                  Allow inbound receiving
                </Field>
              </FieldLabel>
            )}
          />

          <Controller
            name='allowOutbound'
            control={control}
            render={({ field }) => (
              <FieldLabel htmlFor='wh-allow-outbound' className='font-normal'>
                <Field orientation='horizontal'>
                  <Checkbox
                    id='wh-allow-outbound'
                    checked={field.value}
                    onCheckedChange={checked => field.onChange(checked === true)}
                  />
                  Allow outbound fulfillment
                </Field>
              </FieldLabel>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default CapacityOperationsSection
