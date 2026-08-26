'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { MinusIcon, PlusIcon } from 'lucide-react'

// Type Imports
import type { Product } from '@/types/entities/product'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'

type StockAdjustmentDirection = 'add' | 'remove'

type AdjustStockDialogProps = {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_QUANTITY = 1

const AdjustStockDialog = ({ product, open, onOpenChange }: AdjustStockDialogProps) => {
  // States
  const [direction, setDirection] = useState<StockAdjustmentDirection>('add')
  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY)
  const [reason, setReason] = useState('')
  const [wasOpen, setWasOpen] = useState(open)

  // Hooks
  const adjustStock = useProductsStore(state => state.adjustStock)

  if (open && !wasOpen) {
    setWasOpen(true)
    setDirection('add')
    setQuantity(DEFAULT_QUANTITY)
    setReason('')
  } else if (!open && wasOpen) {
    setWasOpen(false)
  }

  const handleSubmit = () => {
    adjustStock(product.id, direction === 'add' ? quantity : -quantity)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Direction</FieldLabel>
            <div className='grid grid-cols-2 gap-3'>
              <Button
                type='button'
                variant={direction === 'add' ? 'default' : 'outline'}
                onClick={() => setDirection('add')}
              >
                <PlusIcon data-icon='inline-start' />
                Add stock
              </Button>
              <Button
                type='button'
                variant={direction === 'remove' ? 'default' : 'outline'}
                onClick={() => setDirection('remove')}
              >
                <MinusIcon data-icon='inline-start' />
                Remove stock
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor='adjust-stock-quantity'>Quantity</FieldLabel>
            <Input
              id='adjust-stock-quantity'
              type='number'
              min={1}
              value={quantity}
              onChange={event => setQuantity(Math.max(1, Number(event.target.value)))}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor='adjust-stock-reason'>Reason (optional)</FieldLabel>
            <Input
              id='adjust-stock-reason'
              placeholder='e.g. Cycle count correction'
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdjustStockDialog
