'use client'

// Third-party Imports
import { Controller } from 'react-hook-form'
import { ArrowLeftIcon, ArrowRightIcon, BoxesIcon, TrendingUpIcon } from 'lucide-react'

// Type Imports
import type { UseFormReturn } from 'react-hook-form'

import type { CreateProductFormInput, CreateProductFormValues } from './create-product-schema'

import type { Warehouse } from '@/types/entities/warehouse'
import type { ProductStockStatus } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import WizardSideCard from './wizard-side-card'

// Util Imports
import { computeAvailableStock, computeMargin, computeMarginPercent } from '@/lib/selectors/products-selectors'

// Data Imports
import { PRODUCT_STOCK_STATUS_BADGE } from '../product-badges'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'

type InventoryPricingStepProps = {
  form: UseFormReturn<CreateProductFormInput, unknown, CreateProductFormValues>
  onNext: () => void
  onPrev: () => void
  reserved: number
  warehouses: Warehouse[]
}

const TAX_CLASS_OPTIONS = [
  { label: 'Standard Tax Rate', value: 'Standard Tax Rate' },
  { label: 'Reduced Rate', value: 'Reduced Rate' },
  { label: 'Zero Rate', value: 'Zero Rate' },
  { label: 'Tax Exempt', value: 'Tax Exempt' }
]

const CURRENCY_OPTIONS = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' }
]

const WEIGHT_UNIT_OPTIONS = [
  { label: 'kg', value: 'kg' },
  { label: 'lb', value: 'lb' }
]

const DIMENSION_UNIT_OPTIONS = [
  { label: 'cm', value: 'cm' },
  { label: 'in', value: 'in' }
]

const UNIT_OPTIONS = [
  { label: 'Each', value: 'each' },
  { label: 'Kg', value: 'kg' },
  { label: 'Box', value: 'box' },
  { label: 'Pallet', value: 'pallet' }
]

const getFormStockStatus = (onHand: number, reorderPoint: number): ProductStockStatus => {
  if (onHand === 0) return 'out_of_stock'
  if (onHand <= reorderPoint) return 'low_stock'

  return 'active'
}

const InventoryPricingStep = ({ form, onNext, onPrev, reserved, warehouses }: InventoryPricingStepProps) => {
  // Vars
  const watchedPrice = form.watch('price')
  const watchedUnitCost = form.watch('unitCost')
  const watchedOnHand = form.watch('onHand')
  const watchedReorderPoint = form.watch('reorderPoint')

  const price = Number(watchedPrice) || 0
  const unitCost = Number(watchedUnitCost) || 0
  const onHand = Number(watchedOnHand) || 0
  const reorderPoint = Number(watchedReorderPoint) || 0

  const available = computeAvailableStock(onHand, reserved)
  const grossProfit = computeMargin(price, unitCost)
  const grossMarginPercent = computeMarginPercent(price, unitCost)
  const stockStatus = getFormStockStatus(onHand, reorderPoint)
  const stockStatusBadge = PRODUCT_STOCK_STATUS_BADGE[stockStatus]

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <Card>
          <CardContent className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <Controller
              name='price'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-price'>
                    Base Price <RequiredMark />
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupInput
                      id='product-price'
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                      value={field.value as string | number}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='compareAtPrice'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-compare-at-price'>Compare-at Price</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupInput
                      id='product-compare-at-price'
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                      value={field.value as string | number}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='unitCost'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-unit-cost'>Cost per Item</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupInput
                      id='product-unit-cost'
                      type='number'
                      step='0.01'
                      placeholder='0.00'
                      {...field}
                      value={field.value as string | number}
                    />
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='taxClass'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-tax-class'>Tax Class</FieldLabel>
                  <Select items={TAX_CLASS_OPTIONS} value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id='product-tax-class' className='w-full'>
                      <SelectValue placeholder='Select a tax class' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {TAX_CLASS_OPTIONS.map(option => (
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
              name='currency'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-currency'>Currency</FieldLabel>
                  <Select items={CURRENCY_OPTIONS} value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id='product-currency' className='w-full'>
                      <SelectValue placeholder='Select a currency' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {CURRENCY_OPTIONS.map(option => (
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
              name='trackInventory'
              control={form.control}
              render={({ field }) => (
                <Field orientation='horizontal' className='rounded-md border p-4 sm:col-span-2'>
                  <div className='flex-1 space-y-1'>
                    <FieldLabel htmlFor='product-track-inventory'>Track Inventory</FieldLabel>
                    <FieldDescription>Enable inventory tracking for this product.</FieldDescription>
                  </div>
                  <Switch
                    id='product-track-inventory'
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              name='onHand'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-on-hand'>On Hand Quantity</FieldLabel>
                  <Input
                    id='product-on-hand'
                    type='number'
                    placeholder='0'
                    {...field}
                    value={field.value as string | number}
                  />
                  <FieldDescription>Total stock available in your warehouse.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor='product-reserved'>Reserved</FieldLabel>
              <Input id='product-reserved' value={reserved} disabled readOnly />
              <FieldDescription>Quantity allocated to open orders.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor='product-available'>Available (Calculated)</FieldLabel>
              <Input id='product-available' value={available} disabled readOnly />
              <FieldDescription>On hand minus reserved.</FieldDescription>
            </Field>

            <Controller
              name='reorderPoint'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-reorder-point'>Low Stock Threshold</FieldLabel>
                  <Input
                    id='product-reorder-point'
                    type='number'
                    placeholder='0'
                    {...field}
                    value={field.value as string | number}
                  />
                  <FieldDescription>Get notified when stock falls below this level.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='barcode'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-barcode'>Barcode / UPC</FieldLabel>
                  <Input id='product-barcode' placeholder='e.g. 012345678905' {...field} />
                  <FieldDescription>Scan code for POS and inventory systems.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='warehouseId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-warehouse'>Warehouse</FieldLabel>
                  <Select
                    items={warehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))}
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id='product-warehouse' className='w-full'>
                      <SelectValue placeholder='Select a warehouse' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {warehouses.map(warehouse => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor='product-weight'>Weight</FieldLabel>
              <div className='flex gap-2'>
                <Controller
                  name='weightKg'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id='product-weight'
                        type='number'
                        step='0.01'
                        placeholder='0.00'
                        {...field}
                        value={field.value as string | number}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
                <Select items={WEIGHT_UNIT_OPTIONS} value='kg' onValueChange={() => {}}>
                  <SelectTrigger className='w-24 shrink-0'>
                    <SelectValue placeholder='kg' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {WEIGHT_UNIT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Field className='sm:col-span-2'>
              <FieldLabel>Dimensions (L × W × H)</FieldLabel>
              <div className='flex gap-2'>
                <Controller
                  name='lengthCm'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='Length'
                        aria-label='Length'
                        {...field}
                        value={field.value as string | number}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
                <Controller
                  name='widthCm'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='Width'
                        aria-label='Width'
                        {...field}
                        value={field.value as string | number}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
                <Controller
                  name='heightCm'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='Height'
                        aria-label='Height'
                        {...field}
                        value={field.value as string | number}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
                <Select items={DIMENSION_UNIT_OPTIONS} value='cm' onValueChange={() => {}}>
                  <SelectTrigger className='w-24 shrink-0'>
                    <SelectValue placeholder='cm' />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                  >
                    <SelectGroup>
                      {DIMENSION_UNIT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Controller
              name='unit'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-unit'>
                    Unit <RequiredMark />
                  </FieldLabel>
                  <Select items={UNIT_OPTIONS} value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id='product-unit' className='w-full'>
                      <SelectValue placeholder='Select a unit' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {UNIT_OPTIONS.map(option => (
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
          </CardContent>
        </Card>

        <div className='grid h-fit grid-cols-1 gap-4 md:max-xl:grid-cols-2'>
          <WizardSideCard title='Stock Summary' icon={BoxesIcon}>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>On Hand</span>
                <span className='font-medium'>{onHand}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Reserved</span>
                <span className='font-medium'>{reserved}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Available</span>
                <span className='font-medium'>{available}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Low Stock Threshold</span>
                <span className='font-medium'>{reorderPoint}</span>
              </div>
              <div className='flex items-center justify-between pt-2'>
                <span className='text-muted-foreground'>Stock Status</span>
                <Badge className={stockStatusBadge.className}>{stockStatusBadge.label}</Badge>
              </div>
            </div>
          </WizardSideCard>

          <WizardSideCard title='Margin Preview' icon={TrendingUpIcon}>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Base Price</span>
                <span className='font-medium'>${price.toFixed(2)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Cost per Item</span>
                <span className='font-medium'>${unitCost.toFixed(2)}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>Gross Profit</span>
                <span className='font-medium'>${grossProfit.toFixed(2)}</span>
              </div>
              <div className='flex items-center justify-between pt-2'>
                <span className='text-muted-foreground'>Gross Margin</span>
                <Badge variant='secondary'>{grossMarginPercent}%</Badge>
              </div>
              <p className='text-muted-foreground pt-2 text-xs'>
                Margin is calculated before taxes, discounts, and shipping.
              </p>
            </div>
          </WizardSideCard>
        </div>
      </div>

      <div className='flex justify-between'>
        <Button type='button' variant='outline' onClick={onPrev}>
          <ArrowLeftIcon className='size-4' />
          Previous
        </Button>
        <Button type='button' onClick={onNext}>
          Next
          <ArrowRightIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}

export default InventoryPricingStep
