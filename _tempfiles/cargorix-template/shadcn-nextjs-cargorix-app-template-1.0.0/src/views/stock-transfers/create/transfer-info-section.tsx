'use client'

// Third-party Imports
import { Controller, useWatch, type Control } from 'react-hook-form'

// Type Imports
import type { CreateTransferFormInput } from './create-transfer-schema'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { Warehouse, WarehouseIntakeCheck } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { laterOf, todayDate } from '@/lib/date-bounds'

// Data Imports
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

const NOTES_MAX_LENGTH = 500

// Props
type TransferInfoSectionProps = {
  control: Control<CreateTransferFormInput>
  transfer?: StockTransfer
  warehouses: Warehouse[]
  destinationCheck?: WarehouseIntakeCheck
}

const TransferInfoSection = ({ control, transfer, warehouses, destinationCheck }: TransferInfoSectionProps) => {
  // Vars
  const warehouseItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
  const requestedByItems = TEAM_MEMBERS.map(member => ({ label: member, value: member }))

  // Hooks
  const dispatchDate = useWatch({ control, name: 'dispatchDate' })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer information</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='transfer-id'>Transfer ID</FieldLabel>
            <Input id='transfer-id' disabled value={transfer?.number || 'Auto-generated on save'} />
            <FieldDescription>Auto-generated</FieldDescription>
          </Field>

          <Controller
            name='requestedBy'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='transfer-requested-by'>
                  Requested by <RequiredMark />
                </FieldLabel>
                <Select
                  items={requestedByItems}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='transfer-requested-by' className='w-full'>
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
            name='sourceWarehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='transfer-source-warehouse'>
                  Source warehouse <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='transfer-source-warehouse' className='w-full'>
                    <SelectValue placeholder='Select a source warehouse' />
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
            name='destinationWarehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='transfer-destination-warehouse'>
                  Destination warehouse <RequiredMark />
                </FieldLabel>
                <Select items={warehouseItems} value={field.value ?? ''} onValueChange={value => field.onChange(value)}>
                  <SelectTrigger id='transfer-destination-warehouse' className='w-full'>
                    <SelectValue placeholder='Select a destination warehouse' />
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
                {destinationCheck && (
                  <FieldDescription className={destinationCheck.ok ? undefined : 'text-warning'}>
                    {destinationCheck.ok
                      ? `Room for ${destinationCheck.freeSpace.toLocaleString()} more units (${destinationCheck.unitsStored.toLocaleString()} / ${destinationCheck.maxCapacity.toLocaleString()} stored).`
                      : `Over capacity by ${destinationCheck.overBy.toLocaleString()} units — only ${destinationCheck.freeSpace.toLocaleString()} of ${destinationCheck.maxCapacity.toLocaleString()} units free.`}
                  </FieldDescription>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='dispatchDate'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='transfer-dispatch-date'>
                  Dispatch date <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='transfer-dispatch-date'
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
            name='expectedArrival'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='transfer-expected-arrival'>
                  Expected arrival <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='transfer-expected-arrival'
                  value={field.value}
                  onChange={field.onChange}
                  min={laterOf(todayDate(), dispatchDate)}
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
                <FieldLabel htmlFor='transfer-notes'>Notes</FieldLabel>
                <Textarea
                  id='transfer-notes'
                  rows={3}
                  maxLength={NOTES_MAX_LENGTH}
                  placeholder='Add any notes about this transfer'
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

export default TransferInfoSection
