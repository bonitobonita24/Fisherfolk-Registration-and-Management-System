'use client'

// Third-party Imports
import { Controller, useFieldArray, useFormState, useWatch, type Control } from 'react-hook-form'
import { Trash2Icon } from 'lucide-react'

// Type Imports
import type { CreateTransferFormInput } from './create-transfer-schema'
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ProductSearchCombobox from './product-search-combobox'

// Props
type LineItemsSectionProps = {
  control: Control<CreateTransferFormInput>
  products: Product[]
  availableAt: (productId: string, warehouseId: string) => number
}

const LineItemsSection = ({ control, products, availableAt }: LineItemsSectionProps) => {
  // Hooks
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lines' })
  const { errors } = useFormState({ control, name: 'lines' })
  const watchedSource = useWatch({ control, name: 'sourceWarehouseId' })

  // Vars
  const existingProductIds = fields.map(field => field.productId)

  const handleAdd = (product: Product) => {
    append({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      unit: 'units',
      quantitySent: 0
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
          disabled={!watchedSource}
        />

        {fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Available at source</TableHead>
                <TableHead>Quantity to transfer</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((lineField, index) => {
                const available = watchedSource ? availableAt(lineField.productId, watchedSource) : 0
                const lowStock = watchedSource && available > 0 && available <= 5

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
                      <span className={available === 0 ? 'text-destructive font-medium' : undefined}>
                        {available} units
                      </span>
                      {lowStock && <p className='text-warning text-xs'>Low stock at source</p>}
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`lines.${index}.quantitySent`}
                        control={control}
                        render={({ field, fieldState }) => (
                          <div className='w-24'>
                            <Input
                              type='number'
                              min={0}
                              step={1}
                              aria-label={`Quantity to transfer for ${lineField.name}`}
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
                    </TableCell>
                    <TableCell className='text-muted-foreground'>units</TableCell>
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
