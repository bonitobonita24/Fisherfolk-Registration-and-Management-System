'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreateAdjustmentFormInput } from './create-adjustment-schema'
import type { StockAdjustment } from '@/types/entities/stock-adjustment'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { todayDate } from '@/lib/date-bounds'

// Data Imports
import { ADJUSTMENT_REASON_OPTIONS } from '../adjustment-badges'
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

const NOTES_MAX_LENGTH = 500

// Props
type AdjustmentInfoSectionProps = {
  control: Control<CreateAdjustmentFormInput>
  adjustment?: StockAdjustment
  warehouses: Warehouse[]
}

const AdjustmentInfoSection = ({ control, adjustment, warehouses }: AdjustmentInfoSectionProps) => {
  // Vars
  const warehouseItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
  const reasonItems = ADJUSTMENT_REASON_OPTIONS.filter(option => option.value !== 'all')
  const requestedByItems = TEAM_MEMBERS.map(member => ({ label: member, value: member }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adjustment information</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='adjustment-id'>Adjustment ID</FieldLabel>
            <Input id='adjustment-id' disabled value={adjustment?.number || 'Auto-generated on save'} />
            <FieldDescription>Auto-generated on save</FieldDescription>
          </Field>

          <Controller
            name='requestedBy'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='adjustment-requested-by'>
                  Requested by <RequiredMark />
                </FieldLabel>
                <Select
                  items={requestedByItems}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='adjustment-requested-by' className='w-full'>
                    <SelectValue placeholder='Select a team member' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {requestedByItems.map(item => (
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
            name='warehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='adjustment-warehouse'>
                  Warehouse <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='adjustment-warehouse' className='w-full'>
                    <SelectValue placeholder='Select a warehouse' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {warehouseItems.map(item => (
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
            name='reason'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='adjustment-reason'>
                  Reason <RequiredMark />
                </FieldLabel>
                <Select items={reasonItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='adjustment-reason' className='w-full'>
                    <SelectValue placeholder='Select a reason' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {reasonItems.map(item => (
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
            name='date'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='adjustment-date'>
                  Date <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='adjustment-date'
                  value={field.value}
                  onChange={field.onChange}
                  max={todayDate()}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='notes'
            control={control}
            render={({ field }) => (
              <Field className='sm:col-span-2'>
                <FieldLabel htmlFor='adjustment-notes'>Notes</FieldLabel>
                <Textarea
                  id='adjustment-notes'
                  rows={3}
                  maxLength={NOTES_MAX_LENGTH}
                  placeholder='Add any notes about this adjustment'
                  {...field}
                />
                <p className='text-muted-foreground text-right text-xs tabular-nums'>
                  {(field.value ?? '').length} / {NOTES_MAX_LENGTH}
                </p>
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default AdjustmentInfoSection
