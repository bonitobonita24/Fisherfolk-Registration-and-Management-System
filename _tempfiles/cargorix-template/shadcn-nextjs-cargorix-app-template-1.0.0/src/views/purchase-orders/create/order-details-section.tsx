// React Imports
import { useMemo } from 'react'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'

// Type Imports
import type { CreatePurchaseOrderFormInput } from './create-purchase-order-schema'
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'
import type { Warehouse } from '@/types/entities/warehouse'

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
import { todayDate } from '@/lib/date-bounds'

// Data Imports
import { PO_BUYERS, PO_CURRENCY_OPTIONS, PO_PAYMENT_TERMS_OPTIONS } from './po-reference-data'

// Props
type OrderDetailsSectionProps = {
  control: Control<CreatePurchaseOrderFormInput>
  po?: PurchaseOrder
  suppliers: Supplier[]
  warehouses: Warehouse[]
  locked: boolean
  isTerminal: boolean
}

const OrderDetailsSection = ({ control, po, suppliers, warehouses, locked, isTerminal }: OrderDetailsSectionProps) => {
  // Vars
  const liveSuppliers = useMemo(() => suppliers.filter(supplier => !supplier.isDraft), [suppliers])

  const supplierItems = liveSuppliers.map(supplier => ({ label: supplier.name, value: supplier.id }))
  const warehouseItems = warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
  const buyerItems = PO_BUYERS.map(buyer => ({ label: buyer, value: buyer }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order details</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className='grid gap-6 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='po-number'>PO number</FieldLabel>
            <Input id='po-number' disabled value={po?.number || 'Assigned on save'} />
            <FieldDescription>Auto-generated</FieldDescription>
          </Field>

          <Controller
            name='buyer'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-buyer'>
                  Buyer / Created by <RequiredMark />
                </FieldLabel>
                <Select
                  items={buyerItems}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                  disabled={isTerminal}
                >
                  <SelectTrigger id='po-buyer' className='w-full'>
                    <SelectValue placeholder='Select a buyer' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {buyerItems.map(item => (
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
            name='supplierId'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-supplier'>
                  Supplier <RequiredMark />
                </FieldLabel>
                <Select
                  items={supplierItems}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                  disabled={locked}
                >
                  <SelectTrigger id='po-supplier' className='w-full'>
                    <SelectValue placeholder='Select a supplier' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {supplierItems.map(item => (
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
                <FieldLabel className='gap-0' htmlFor='po-warehouse'>
                  Warehouse <RequiredMark />
                </FieldLabel>
                <Select
                  items={warehouseItems}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                  disabled={locked}
                >
                  <SelectTrigger id='po-warehouse' className='w-full'>
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
            name='expectedDeliveryDate'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-expected-delivery'>
                  Expected delivery date <RequiredMark />
                </FieldLabel>
                <DatePicker
                  id='po-expected-delivery'
                  value={field.value}
                  onChange={field.onChange}
                  min={todayDate()}
                  invalid={fieldState.invalid}
                  disabled={isTerminal}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name='currency'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-currency'>
                  Currency <RequiredMark />
                </FieldLabel>
                <Select
                  items={PO_CURRENCY_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                  disabled={locked}
                >
                  <SelectTrigger id='po-currency' className='w-full'>
                    <SelectValue placeholder='Select a currency' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {PO_CURRENCY_OPTIONS.map(item => (
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
            name='paymentTerms'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-payment-terms'>
                  Payment terms <RequiredMark />
                </FieldLabel>
                <Select
                  items={PO_PAYMENT_TERMS_OPTIONS}
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value)}
                  disabled={locked}
                >
                  <SelectTrigger id='po-payment-terms' className='w-full'>
                    <SelectValue placeholder='Select payment terms' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {PO_PAYMENT_TERMS_OPTIONS.map(item => (
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
            name='shippingCost'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='gap-0' htmlFor='po-shipping-cost'>
                  Shipping cost <RequiredMark />
                </FieldLabel>
                <Input
                  id='po-shipping-cost'
                  type='number'
                  min={0}
                  step='0.01'
                  disabled={locked}
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={field.value as number}
                  onChange={event => field.onChange(event.target.valueAsNumber)}
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
                <FieldLabel htmlFor='po-notes'>Notes (to supplier)</FieldLabel>
                <Textarea
                  id='po-notes'
                  rows={3}
                  placeholder='Add any notes for the supplier'
                  disabled={locked}
                  {...field}
                />
              </Field>
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsSection
