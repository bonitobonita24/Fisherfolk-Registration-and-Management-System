'use client'

// React Imports
import { useState } from 'react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

// Shared Imports
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { todayDate } from '@/lib/date-bounds'

// Store Imports
import { checkPurchaseOrderIntake, usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { nextReceiptId } from '@/lib/selectors/purchase-orders-selectors'
import { checkWarehouseIntake } from '@/lib/selectors/warehouse-selectors'
import { warnIfOverCapacity } from '@/lib/capacity-toast'

type ReceiveItemsDialogProps = {
  po: PurchaseOrder
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CURRENT_OPERATOR = 'You'

const todayDateTime = () => {
  const now = new Date()

  return `${now.toISOString().slice(0, 10)}T09:00`
}

const ReceiveItemsDialog = ({ po, open, onOpenChange }: ReceiveItemsDialogProps) => {
  // Vars
  const receivableLines = po.lines.filter(line => line.quantityOrdered - line.receivedQty > 0)

  // States
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [receiptDate, setReceiptDate] = useState(todayDateTime())
  const [receivedBy, setReceivedBy] = useState(CURRENT_OPERATOR)
  const [note, setNote] = useState('')
  const [prevOpen, setPrevOpen] = useState(false)

  // Hooks
  const movements = useStockLedgerStore(state => state.movements)
  const warehouses = useWarehousesStore(state => state.warehouses)

  if (open !== prevOpen) {
    setPrevOpen(open)

    if (open) {
      setQuantities(Object.fromEntries(receivableLines.map(line => [line.id, 0])))
      setReceiptDate(todayDateTime())
      setReceivedBy(CURRENT_OPERATOR)
      setNote('')
    }
  }

  const remainingFor = (lineId: string) => {
    const line = receivableLines.find(l => l.id === lineId)

    return line ? line.quantityOrdered - line.receivedQty : 0
  }

  const handleQuantityChange = (lineId: string, value: number) => {
    const remaining = remainingFor(lineId)
    const clamped = Number.isNaN(value) ? 0 : Math.max(0, Math.min(value, remaining))

    setQuantities(prev => ({ ...prev, [lineId]: clamped }))
  }

  const handleReceiveAllRemaining = () => {
    setQuantities(Object.fromEntries(receivableLines.map(line => [line.id, line.quantityOrdered - line.receivedQty])))
  }

  const lineCount = Object.values(quantities).filter(quantity => quantity > 0).length
  const totalUnits = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0)
  const intake = checkWarehouseIntake(movements, warehouses, po.warehouseId, totalUnits)

  const handleSubmit = () => {
    if (totalUnits <= 0) return

    const input = {
      id: nextReceiptId(usePurchaseOrdersStore.getState().purchaseOrders),
      date: receiptDate,
      receivedBy: receivedBy || po.buyer,
      note,
      lines: Object.entries(quantities).map(([lineId, quantity]) => ({ lineId, quantity }))
    }

    if (!warnIfOverCapacity(checkPurchaseOrderIntake(po, input))) return

    usePurchaseOrdersStore.getState().receivePurchaseOrderItems(po.id, input)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>Receive items</DialogTitle>
        </DialogHeader>

        <div className='flex min-w-0 flex-col gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-muted-foreground text-sm'>
              {lineCount} of {receivableLines.length} lines · {totalUnits} units
            </p>
            <Button type='button' variant='outline' size='sm' onClick={handleReceiveAllRemaining}>
              Receive all remaining
            </Button>
          </div>

          <p className={`text-sm ${intake.ok ? 'text-muted-foreground' : 'text-warning'}`}>
            {intake.ok
              ? `${intake.warehouseName} has room for ${intake.freeSpace.toLocaleString()} more units (${intake.unitsStored.toLocaleString()} / ${intake.maxCapacity.toLocaleString()} stored).`
              : `${intake.warehouseName} only has room for ${intake.freeSpace.toLocaleString()} units — this receipt is ${intake.overBy.toLocaleString()} over capacity.`}
          </p>

          <div className='max-h-72 min-w-0 overflow-auto rounded-md border'>
            <Table className='min-w-160'>
              <TableHeader className='bg-card sticky top-0 z-10'>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Ordered</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Already received</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Remaining</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Receive now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivableLines.map(line => {
                  const remaining = line.quantityOrdered - line.receivedQty

                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{line.name}</span>
                          <span className='text-muted-foreground text-xs'>{line.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>{line.quantityOrdered}</TableCell>
                      <TableCell className='text-right'>{line.receivedQty}</TableCell>
                      <TableCell className='text-right'>{remaining}</TableCell>
                      <TableCell className='text-right'>
                        <Input
                          type='number'
                          min={0}
                          max={remaining}
                          step={1}
                          onKeyDown={event => {
                            if (['.', ',', '-'].includes(event.key)) event.preventDefault()
                          }}
                          className='ml-auto w-24 text-right'
                          value={quantities[line.id] ?? 0}
                          onChange={event => handleQuantityChange(line.id, event.target.valueAsNumber)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <FieldGroup>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='receive-items-date'>Receipt date</FieldLabel>
                <DatePicker id='receive-items-date' value={receiptDate} onChange={setReceiptDate} max={todayDate()} />
              </Field>
              <Field>
                <FieldLabel htmlFor='receive-items-received-by'>Received by</FieldLabel>
                <Input
                  id='receive-items-received-by'
                  value={receivedBy}
                  onChange={event => setReceivedBy(event.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor='receive-items-note'>Note</FieldLabel>
              <Textarea
                id='receive-items-note'
                placeholder='Add a note for this receipt'
                value={note}
                onChange={event => setNote(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={totalUnits <= 0} onClick={handleSubmit}>
            Receive items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiveItemsDialog
