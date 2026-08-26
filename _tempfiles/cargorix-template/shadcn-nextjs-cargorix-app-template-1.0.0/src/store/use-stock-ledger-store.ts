// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type {
  AdjustmentMovementInput,
  ReceiptMovementInput,
  StockMovement,
  TransferMovementInput
} from '@/types/entities/stock-movement'

interface StockLedgerState {
  movements: StockMovement[]

  initialize: (movements: StockMovement[]) => void
  appendReceipt: (input: ReceiptMovementInput) => void
  appendTransfer: (input: TransferMovementInput) => void
  appendAdjustment: (input: AdjustmentMovementInput) => void
}

export const useStockLedgerStore = create<StockLedgerState>()((set, get) => ({
  movements: [],

  initialize: movements => {
    if (get().movements.length > 0) return
    set({ movements })
  },

  appendReceipt: input => {
    const id = `mov-${input.key}`

    if (get().movements.some(m => m.id === id)) return

    const movement: StockMovement = {
      id,
      date: input.date,
      type: 'receipt',
      productId: input.productId,
      sku: input.sku,
      name: input.name,
      primaryImage: input.primaryImage,
      warehouseId: input.warehouseId,
      warehouseName: input.warehouseName,
      quantity: input.quantity,
      reference: input.reference,
      note: input.note
    }

    set(state => ({ movements: [...state.movements, movement] }))
  },

  appendTransfer: input => {
    const additions: StockMovement[] = []

    for (const line of input.lines) {
      const outId = `mov-${input.transferId}::${line.lineId}::${input.sourceWarehouseId}::out`
      const inId = `mov-${input.transferId}::${line.lineId}::${input.destinationWarehouseId}::in`

      const base = {
        date: input.date,
        type: 'transfer' as const,
        productId: line.productId,
        sku: line.sku,
        name: line.name,
        primaryImage: line.primaryImage,
        reference: input.reference
      }

      if (!get().movements.some(m => m.id === outId)) {
        additions.push({
          ...base,
          id: outId,
          warehouseId: input.sourceWarehouseId,
          warehouseName: input.sourceWarehouseName,
          quantity: -Math.abs(line.quantity),
          note: `To ${input.destinationWarehouseName}`
        })
      }

      if (!get().movements.some(m => m.id === inId)) {
        additions.push({
          ...base,
          id: inId,
          warehouseId: input.destinationWarehouseId,
          warehouseName: input.destinationWarehouseName,
          quantity: Math.abs(line.quantity),
          note: `From ${input.sourceWarehouseName}`
        })
      }
    }

    if (additions.length > 0) set(state => ({ movements: [...state.movements, ...additions] }))
  },

  appendAdjustment: input => {
    const additions: StockMovement[] = []

    for (const line of input.lines) {
      const id = `mov-${input.adjustmentId}::${line.lineId}::${input.warehouseId}`

      if (line.quantity === 0 || get().movements.some(m => m.id === id)) continue

      additions.push({
        id,
        date: input.date,
        type: 'adjustment',
        productId: line.productId,
        sku: line.sku,
        name: line.name,
        primaryImage: line.primaryImage,
        warehouseId: input.warehouseId,
        warehouseName: input.warehouseName,
        quantity: line.quantity,
        reference: input.reference,
        note: ''
      })
    }

    if (additions.length > 0) set(state => ({ movements: [...state.movements, ...additions] }))
  }
}))
