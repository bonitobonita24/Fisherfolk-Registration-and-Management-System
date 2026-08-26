// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { LockIcon } from 'lucide-react'

// Type Imports
import type { CreateWarehouseFormInput } from './create-warehouse-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Config Imports
import { WAREHOUSE_STATUS_FORM_OPTIONS, WAREHOUSE_TYPE_OPTIONS } from '@/views/warehouses/warehouse-badges'

// Data Imports
import { COUNTRY_OPTIONS, US_STATE_OPTIONS } from './create-warehouse-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

// Props
type WarehouseInformationSectionProps = {
  control: Control<CreateWarehouseFormInput>
  isEdit: boolean
}

const WarehouseInformationSection = ({ control, isEdit }: WarehouseInformationSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Information</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-6 sm:grid-cols-2'>
        <Controller
          name='name'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-name'>
                Warehouse name <RequiredMark />
              </FieldLabel>
              <Input
                id='wh-name'
                placeholder='West Coast Distribution Center'
                aria-invalid={fieldState.invalid}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='code'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-code'>
                Warehouse code <RequiredMark />
              </FieldLabel>
              {isEdit ? (
                <InputGroup>
                  <InputGroupInput id='wh-code' disabled aria-invalid={fieldState.invalid} {...field} />
                  <InputGroupAddon align='inline-end'>
                    <LockIcon />
                  </InputGroupAddon>
                </InputGroup>
              ) : (
                <Input id='wh-code' placeholder='WH-WC-01' aria-invalid={fieldState.invalid} {...field} />
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='type'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-type'>
                Warehouse type <RequiredMark />
              </FieldLabel>
              <Select
                items={WAREHOUSE_TYPE_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='wh-type' className='w-full'>
                  <SelectValue placeholder='Select a type' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {WAREHOUSE_TYPE_OPTIONS.map(item => (
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
          name='status'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-status'>
                Status <RequiredMark />
              </FieldLabel>
              <Select
                items={WAREHOUSE_STATUS_FORM_OPTIONS}
                value={field.value ?? ''}
                onValueChange={value => field.onChange(value)}
              >
                <SelectTrigger id='wh-status' className='w-full'>
                  <SelectValue placeholder='Select a status' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {WAREHOUSE_STATUS_FORM_OPTIONS.map(item => (
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

        <h3 className='text-sm font-semibold sm:col-span-2'>Address</h3>

        <Controller
          name='line1'
          control={control}
          render={({ field, fieldState }) => (
            <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-line1'>
                Address line 1 <RequiredMark />
              </FieldLabel>
              <Input id='wh-line1' placeholder='1200 Logistics Way' aria-invalid={fieldState.invalid} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='city'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-city'>
                City <RequiredMark />
              </FieldLabel>
              <Input id='wh-city' placeholder='Los Angeles' aria-invalid={fieldState.invalid} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name='state'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-state'>
                State <RequiredMark />
              </FieldLabel>
              <Select items={US_STATE_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='wh-state' className='w-full'>
                  <SelectValue placeholder='Select a state' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {US_STATE_OPTIONS.map(item => (
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
          name='country'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-country'>
                Country <RequiredMark />
              </FieldLabel>
              <Select items={COUNTRY_OPTIONS} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                <SelectTrigger id='wh-country' className='w-full'>
                  <SelectValue placeholder='Select a country' />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                >
                  <SelectGroup>
                    {COUNTRY_OPTIONS.map(item => (
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
          name='postalCode'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='gap-0' htmlFor='wh-postal'>
                Postal code <RequiredMark />
              </FieldLabel>
              <Input id='wh-postal' placeholder='90001' aria-invalid={fieldState.invalid} {...field} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default WarehouseInformationSection
