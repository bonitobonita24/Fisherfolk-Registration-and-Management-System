'use client'

// Third-party Imports
import { Controller, useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

// Type Imports
import type { CreateAdjustmentFormInput } from './create-adjustment-schema'
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProductSearchCombobox from './product-search-combobox'

// Util Imports
import { cn } from '@/lib/utils'

// Props
type LineItemsSectionProps = {
  control: Control<CreateAdjustmentFormInput>
  products: Product[]
  balanceFor: (productId: string, warehouseId: string) => number
  setAdjustmentQty: (index: number, value: number) => void
}

const LineItemsSection = ({ control, products, balanceFor, setAdjustmentQty }: LineItemsSectionProps) => {
  // Hooks
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lines' })
  const { errors } = useFormState({ control, name: 'lines' })
  const watchedLines = useWatch({ control, name: 'lines' }) ?? []
  const watchedWarehouse = useWatch({ control, name: 'warehouseId' })
  const watchedReason = useWatch({ control, name: 'reason' })

  // Vars
  const existingProductIds = fields.map(field => field.productId)
  const isCycleCount = watchedReason === 'cycle_count'

  const handleAdd = (product: Product) => {
    const currentQty = watchedWarehouse ? (balanceFor(product.id, watchedWarehouse) ?? 0) : 0

    append({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      unit: product.unit,
      currentQty,
      adjustmentQty: 0
    })
  }

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between'>
        <CardTitle>Line items</CardTitle>
        {fields.length > 0 && (
          <Button type='button' variant='outline' size='sm' onClick={() => replace([])}>
            Clear all
          </Button>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        <ProductSearchCombobox
          products={products}
          existingProductIds={existingProductIds}
          onAdd={handleAdd}
          disabled={!watchedWarehouse}
        />

        {fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Current qty</TableHead>
                {isCycleCount && <TableHead>Counted</TableHead>}
                <TableHead>Adjustment</TableHead>
                <TableHead>New qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((lineField, index) => {
                const watchedLine = watchedLines[index] ?? lineField
                const currentQty = Number(watchedLine.currentQty) || 0
                const adjustmentQty = Number(watchedLine.adjustmentQty) || 0
                const newQty = currentQty + adjustmentQty
                const negativeRow = newQty < 0

                const handleCounted = (counted: number) => {
                  setAdjustmentQty(index, counted - currentQty)
                }

                return (
                  <TableRow
                    key={lineField.id}
                    className={cn(negativeRow && 'bg-destructive/10 hover:bg-destructive/15')}
                  >
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
                    <TableCell className='tabular-nums'>{currentQty}</TableCell>
                    {isCycleCount && (
                      <TableCell>
                        <div className='w-24'>
                          <Input
                            type='number'
                            min={0}
                            step={1}
                            aria-label={`Counted quantity for ${lineField.name}`}
                            onKeyDown={event => {
                              if (['.', ',', '-'].includes(event.key)) event.preventDefault()
                            }}
                            value={currentQty + adjustmentQty}
                            onChange={event => handleCounted(event.target.valueAsNumber || 0)}
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Controller
                        name={`lines.${index}.adjustmentQty`}
                        control={control}
                        render={({ field }) => (
                          <div className='w-32'>
                            <Input
                              type='number'
                              step={1}
                              aria-label={`Adjustment for ${lineField.name}`}
                              aria-invalid={negativeRow}
                              onKeyDown={event => {
                                if (['.', ','].includes(event.key)) event.preventDefault()
                              }}
                              {...field}
                              value={field.value as number}
                              onChange={event => field.onChange(event.target.valueAsNumber)}
                            />
                            {negativeRow && <p className='text-destructive mt-1 text-xs'>Would drive stock negative</p>}
                          </div>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-medium tabular-nums', newQty < 0 && 'text-destructive')}>{newQty}</span>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{lineField.unit}</TableCell>
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
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className='text-muted-foreground py-6 text-center text-sm'>Add products to see line item totals.</p>
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
