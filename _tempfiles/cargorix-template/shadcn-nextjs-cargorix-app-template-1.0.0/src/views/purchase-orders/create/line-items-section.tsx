'use client'

// Third-party Imports
import { Controller, useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

// Type Imports
import type { CreatePurchaseOrderFormInput } from './create-purchase-order-schema'
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProductSearchCombobox from './product-search-combobox'

// Util Imports
import { computeLineAmounts } from '@/lib/selectors/purchase-orders-selectors'

// Data Imports
import { PO_TAX_RATE_OPTIONS } from './po-reference-data'

// Props
type LineItemsSectionProps = {
  control: Control<CreatePurchaseOrderFormInput>
  products: Product[]
  locked: boolean
}

const LineItemsSection = ({ control, products, locked }: LineItemsSectionProps) => {
  // Hooks
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lines' })
  const { errors } = useFormState({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' }) ?? []

  // Vars
  const existingProductIds = fields.map(field => field.productId)

  const handleAdd = (product: Product) => {
    append({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      quantityOrdered: 1,
      unitCost: product.unitCost,
      taxRatePercent: 0,
      discountPercent: 0
    })
  }

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between'>
        <CardTitle>Line items</CardTitle>
        {!locked && fields.length > 0 && (
          <Button type='button' variant='outline' size='sm' onClick={() => replace([])}>
            Clear all items
          </Button>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        {!locked && (
          <ProductSearchCombobox
            products={products}
            existingProductIds={existingProductIds}
            onAdd={handleAdd}
            locked={locked}
          />
        )}

        {fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                {!locked && <TableHead className='text-right'>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((lineField, index) => {
                const watchedLine = watchedLines[index] ?? lineField
                const quantityOrdered = Number(watchedLine.quantityOrdered) || 0
                const unitCost = Number(watchedLine.unitCost) || 0
                const taxRatePercent = Number(watchedLine.taxRatePercent) || 0
                const discountPercent = Number(watchedLine.discountPercent) || 0
                const amounts = computeLineAmounts({ quantityOrdered, unitCost, taxRatePercent, discountPercent })

                return (
                  <TableRow key={lineField.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <div className='bg-muted size-8 shrink-0 overflow-hidden rounded-md'>
                          {lineField.primaryImage && (
                            <img src={lineField.primaryImage} alt={lineField.name} className='size-full object-cover' />
                          )}
                        </div>
                        <span className='max-w-40 truncate font-medium'>{lineField.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{lineField.sku}</TableCell>
                    <TableCell>
                      {locked ? (
                        quantityOrdered
                      ) : (
                        <Controller
                          name={`lines.${index}.quantityOrdered`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className='w-20'>
                              <Input
                                type='number'
                                min={1}
                                step={1}
                                aria-label={`Quantity for ${lineField.name}`}
                                aria-invalid={fieldState.invalid}
                                onKeyDown={event => {
                                  if (['.', ',', '-'].includes(event.key)) event.preventDefault()
                                }}
                                {...field}
                                value={field.value as number}
                                onChange={event => field.onChange(event.target.valueAsNumber)}
                              />
                            </div>
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        `$${unitCost.toFixed(2)}`
                      ) : (
                        <Controller
                          name={`lines.${index}.unitCost`}
                          control={control}
                          render={({ field, fieldState }) => (
                            <div className='w-24'>
                              <Input
                                type='number'
                                min={0}
                                step='0.01'
                                aria-label={`Unit cost for ${lineField.name}`}
                                aria-invalid={fieldState.invalid}
                                {...field}
                                value={field.value as number}
                                onChange={event => field.onChange(event.target.valueAsNumber)}
                              />
                            </div>
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        `${watchedLine.taxRatePercent}%`
                      ) : (
                        <Controller
                          name={`lines.${index}.taxRatePercent`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              items={PO_TAX_RATE_OPTIONS}
                              value={`${field.value}`}
                              onValueChange={value => field.onChange(Number(value))}
                            >
                              <SelectTrigger className='w-20' aria-label={`Tax rate for ${lineField.name}`}>
                                <SelectValue placeholder='Tax' />
                              </SelectTrigger>
                              <SelectContent
                                alignItemWithTrigger={false}
                                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                              >
                                <SelectGroup>
                                  {PO_TAX_RATE_OPTIONS.map(item => (
                                    <SelectItem key={item.value} value={item.value}>
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {locked ? (
                        <span>
                          {discountPercent}% (${amounts.discountAmount.toFixed(2)})
                        </span>
                      ) : (
                        <div className='flex items-center gap-1.5'>
                          <Controller
                            name={`lines.${index}.discountPercent`}
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className='w-16'>
                                <Input
                                  type='number'
                                  min={0}
                                  max={100}
                                  aria-label={`Discount percent for ${lineField.name}`}
                                  aria-invalid={fieldState.invalid}
                                  {...field}
                                  value={field.value as number}
                                  onChange={event => field.onChange(event.target.valueAsNumber)}
                                />
                              </div>
                            )}
                          />
                          <span className='text-muted-foreground text-xs'>%</span>
                          <span className='text-muted-foreground text-xs whitespace-nowrap'>
                            (${amounts.discountAmount.toFixed(2)})
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-medium tabular-nums'>${amounts.total.toFixed(2)}</TableCell>
                    {!locked && (
                      <TableCell className='text-right'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          aria-label='Remove line'
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon className='size-4' />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className='text-muted-foreground py-6 text-center text-sm'>No line items added yet.</p>
        )}

        {errors.lines?.message && <FieldError errors={[errors.lines]} />}

        <p className='text-muted-foreground text-sm'>
          {fields.length} item{fields.length === 1 ? '' : 's'}
        </p>
      </CardContent>
    </Card>
  )
}

export default LineItemsSection
