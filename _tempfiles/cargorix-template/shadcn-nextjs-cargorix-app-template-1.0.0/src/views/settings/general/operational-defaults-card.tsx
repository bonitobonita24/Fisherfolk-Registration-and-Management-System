// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { SlidersHorizontalIcon } from 'lucide-react'

// Type Imports
import type { Warehouse } from '@/types/entities/warehouse'
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Util Imports
import { cn } from '@/lib/utils'

// Data Imports
import { ORDER_STATUS_OPTIONS, REORDER_METHOD_OPTIONS } from './general-settings-schema'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

const STATUS_DOT_CLASS: Record<string, string> = {
  pending: 'bg-warning',
  processing: 'bg-info',
  ready_for_shipment: 'bg-success',
  on_hold: 'bg-destructive'
}

// Props
type OperationalDefaultsCardProps = {
  control: Control<GeneralSettingsFormInput>
  warehouses: Warehouse[]
}

const OperationalDefaultsCard = ({ control, warehouses }: OperationalDefaultsCardProps) => {
  // Vars
  const warehouseOptions = warehouses.map(warehouse => ({
    label: `${warehouse.name} (${warehouse.code})`,
    value: warehouse.id
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <SlidersHorizontalIcon className='size-4' />
          </span>
          Operational Defaults
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Controller
            name='defaultOrderStatus'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='gs-default-order-status'>
                  Default order status <RequiredMark />
                </FieldLabel>
                <Select
                  items={ORDER_STATUS_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='gs-default-order-status' className='w-full'>
                    <SelectValue placeholder='Select a status' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {ORDER_STATUS_OPTIONS.map(item => (
                        <SelectItem key={item.value} value={item.value}>
                          <span className='flex items-center gap-2'>
                            <span
                              className={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASS[item.value] ?? 'bg-muted')}
                            />
                            {item.label}
                          </span>
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
            name='defaultWarehouseId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='gs-default-warehouse'>
                  Default warehouse <RequiredMark />
                </FieldLabel>
                <Select
                  items={warehouseOptions}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                >
                  <SelectTrigger id='gs-default-warehouse' className='w-full'>
                    <SelectValue placeholder='Select a warehouse' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {warehouseOptions.map(item => (
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
            name='reorderMethod'
            control={control}
            render={({ field }) => (
              <Field className='min-w-0'>
                <FieldLabel className='gap-0' id='gs-reorder-method-label'>
                  Reorder threshold method <RequiredMark />
                </FieldLabel>
                <ScrollArea className='min-w-0'>
                  <div
                    role='group'
                    aria-labelledby='gs-reorder-method-label'
                    className='bg-muted/50 flex min-w-max gap-1 rounded-2xl p-1'
                  >
                    {REORDER_METHOD_OPTIONS.map(option => {
                      const isSelected = field.value === option.value

                      return (
                        <Button
                          key={option.value}
                          type='button'
                          variant='ghost'
                          size='sm'
                          aria-pressed={isSelected}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            'flex-1 px-1.5',
                            isSelected &&
                              'bg-background text-foreground hover:bg-background dark:hover:bg-background shadow-sm'
                          )}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>

                  <ScrollBar orientation='horizontal' className='data-horizontal:h-1.5' />
                </ScrollArea>
              </Field>
            )}
          />
        </div>

        <FieldDescription>
          These defaults help automate operations and can be overridden at the transaction level.
        </FieldDescription>
      </CardContent>
    </Card>
  )
}

export default OperationalDefaultsCard
