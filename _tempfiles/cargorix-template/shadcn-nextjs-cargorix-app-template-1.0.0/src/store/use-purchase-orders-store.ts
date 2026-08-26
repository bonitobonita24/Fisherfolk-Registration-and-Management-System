// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { PurchaseOrder, PurchaseOrderActivityEvent, PurchaseOrderReceipt } from '@/types/entities/purchase-order'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { nextPurchaseOrderNumber } from '@/lib/selectors/purchase-orders-selectors'
import { checkWarehouseIntake } from '@/lib/selectors/warehouse-selectors'

const CURRENT_OPERATOR = 'You'

const buildEmptyPurchaseOrder = (id: string): PurchaseOrder => ({
  isDraft: true,
  id,
  number: '',
  status: 'draft',
  supplierId: '',
  supplier: { supplierId: '', name: '', contactPerson: '', email: '', phone: '', address: '' },
  warehouseId: '',
  warehouseName: '',
  deliveryAddress: '',
  currency: 'USD',
  paymentTerms: 'Net 30',
  buyer: CURRENT_OPERATOR,
  requestedDeliveryDate: '',
  expectedDeliveryDate: '',
  trackingCarrier: '',
  trackingNumber: '',
  lines: [],
  shippingCost: 0,
  notes: '',
  internalNotes: '',
  attachments: [],
  receipts: [],
  activity: [
    {
      id: `act-${id}-created`,
      label: 'Draft created',
      actor: CURRENT_OPERATOR,
      timestamp: new Date().toISOString(),
      icon: 'file-plus-2'
    }
  ],
  createdAt: new Date().toISOString(),
  createdBy: CURRENT_OPERATOR,
  confirmedAt: null
})

const prependActivity = (po: PurchaseOrder, event: PurchaseOrderActivityEvent): PurchaseOrderActivityEvent[] => [
  event,
  ...po.activity
]

const stampReceiptTime = (date: string) => {
  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const stamped = new Date(`${date.slice(0, 10)}T${clock}`)

  return Number.isNaN(stamped.getTime()) ? now.toISOString() : stamped.toISOString()
}

export type PurchaseOrderFormPatch = Pick<
  PurchaseOrder,
  | 'supplierId'
  | 'supplier'
  | 'warehouseId'
  | 'warehouseName'
  | 'deliveryAddress'
  | 'currency'
  | 'paymentTerms'
  | 'buyer'
  | 'expectedDeliveryDate'
  | 'lines'
  | 'shippingCost'
  | 'notes'
  | 'internalNotes'
  | 'attachments'
>

export type SoftEditPatch = Partial<
  Pick<
    PurchaseOrder,
    'expectedDeliveryDate' | 'internalNotes' | 'attachments' | 'buyer' | 'trackingCarrier' | 'trackingNumber'
  >
>

export interface ReceiveItemsInput {
  id: string
  date: string
  receivedBy: string
  note: string
  lines: { lineId: string; quantity: number }[]
}

export const receiptUnits = (po: PurchaseOrder, receipt: ReceiveItemsInput): number =>
  receipt.lines.reduce((sum, rl) => {
    const line = po.lines.find(l => l.id === rl.lineId)

    if (!line) return sum

    return sum + Math.max(0, Math.min(rl.quantity, line.quantityOrdered - line.receivedQty))
  }, 0)

export const checkPurchaseOrderIntake = (po: PurchaseOrder, receipt: ReceiveItemsInput) =>
  checkWarehouseIntake(
    useStockLedgerStore.getState().movements,
    useWarehousesStore.getState().warehouses,
    po.warehouseId,
    receiptUnits(po, receipt)
  )

interface PurchaseOrdersState {
  purchaseOrders: PurchaseOrder[]

  initialize: (pos: PurchaseOrder[]) => void
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined
  createDraftPurchaseOrder: (id: string, seedProductIds?: string[]) => void
  savePurchaseOrderDraft: (id: string, values: PurchaseOrderFormPatch) => void
  confirmPurchaseOrder: (id: string, values: PurchaseOrderFormPatch) => boolean
  confirmDraft: (id: string) => boolean
  updateActivePurchaseOrder: (id: string, patch: SoftEditPatch) => void
  markInTransit: (id: string) => void
  receivePurchaseOrderItems: (id: string, receipt: ReceiveItemsInput) => boolean
  cancelPurchaseOrder: (id: string) => void
  duplicatePurchaseOrder: (id: string) => string
}

export const usePurchaseOrdersStore = create<PurchaseOrdersState>()((set, get) => ({
  purchaseOrders: [],

  initialize: pos => {
    if (get().purchaseOrders.length > 0) return
    set({ purchaseOrders: pos })
  },

  getPurchaseOrder: id => get().purchaseOrders.find(po => po.id === id),

  createDraftPurchaseOrder: (id, seedProductIds = []) => {
    if (get().purchaseOrders.some(po => po.id === id)) return

    const draft = buildEmptyPurchaseOrder(id)
    const storeProducts = useProductsStore.getState().products

    const seeded = seedProductIds
      .map(productId => storeProducts.find(product => product.id === productId))
      .filter(product => product !== undefined)

    if (seeded.length > 0) {
      draft.lines = seeded.map((product, index) => ({
        id: `${id}-l${index}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        primaryImage: product.primaryImage,
        quantityOrdered: 1,
        unitCost: product.unitCost,
        taxRatePercent: 0,
        discountPercent: 0,
        receivedQty: 0
      }))
      draft.warehouseId = seeded[0].warehouseId
    }

    set(state => ({ purchaseOrders: [draft, ...state.purchaseOrders] }))
  },

  savePurchaseOrderDraft: (id, values) =>
    set(state => ({
      purchaseOrders: state.purchaseOrders.map(po =>
        po.id === id
          ? {
              ...po,
              ...values,
              isDraft: false,
              number: po.number || nextPurchaseOrderNumber(state.purchaseOrders),
              status: 'draft'
            }
          : po
      )
    })),

  confirmPurchaseOrder: (id, values) => {
    const po = get().getPurchaseOrder(id)

    if (!po) return false

    const isValid = Boolean(values.supplierId && values.warehouseId && values.lines.length > 0)

    if (!isValid) return false

    const now = new Date().toISOString()

    set(state => ({
      purchaseOrders: state.purchaseOrders.map(current =>
        current.id === id
          ? {
              ...current,
              ...values,
              isDraft: false,
              number: current.number || nextPurchaseOrderNumber(state.purchaseOrders),
              status: 'confirmed',
              confirmedAt: now,
              requestedDeliveryDate: values.expectedDeliveryDate,
              activity: prependActivity(current, {
                id: `act-${id}-confirmed-${now}`,
                label: 'Confirmed',
                actor: current.buyer || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'check-circle-2'
              })
            }
          : current
      )
    }))

    return true
  },

  confirmDraft: id => {
    const po = get().getPurchaseOrder(id)

    if (!po || po.status !== 'draft') return false

    const isValid = Boolean(po.supplierId && po.warehouseId && po.lines.length > 0)

    if (!isValid) return false

    const now = new Date().toISOString()

    set(state => ({
      purchaseOrders: state.purchaseOrders.map(current =>
        current.id === id
          ? {
              ...current,
              number: current.number || nextPurchaseOrderNumber(state.purchaseOrders),
              status: 'confirmed',
              confirmedAt: now,
              requestedDeliveryDate: current.expectedDeliveryDate,
              activity: prependActivity(current, {
                id: `act-${id}-confirmed-${now}`,
                label: 'Confirmed',
                actor: current.buyer || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'check-circle-2'
              })
            }
          : current
      )
    }))

    return true
  },

  updateActivePurchaseOrder: (id, patch) =>
    set(state => ({
      purchaseOrders: state.purchaseOrders.map(po => (po.id === id ? { ...po, ...patch } : po))
    })),

  markInTransit: id => {
    const po = get().getPurchaseOrder(id)

    if (!po || po.status !== 'confirmed') return

    const now = new Date().toISOString()

    set(state => ({
      purchaseOrders: state.purchaseOrders.map(current =>
        current.id === id
          ? {
              ...current,
              status: 'in_transit',
              activity: prependActivity(current, {
                id: `act-${id}-transit-${now}`,
                label: 'Marked in transit',
                actor: current.buyer || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'truck'
              })
            }
          : current
      )
    }))
  },

  receivePurchaseOrderItems: (id, receipt) => {
    const po = get().getPurchaseOrder(id)

    if (!po) return false

    if (po.receipts.some(r => r.id === receipt.id)) return false

    const applied = receipt.lines
      .map(rl => {
        const line = po.lines.find(l => l.id === rl.lineId)

        if (!line) return null

        const remaining = line.quantityOrdered - line.receivedQty
        const quantity = Math.max(0, Math.min(rl.quantity, remaining))

        return quantity > 0 ? { line, quantity } : null
      })
      .filter((entry): entry is { line: (typeof po.lines)[number]; quantity: number } => entry !== null)

    if (applied.length === 0) return false

    if (!checkPurchaseOrderIntake(po, receipt).ok) return false

    const nextLines = po.lines.map(line => {
      const hit = applied.find(entry => entry.line.id === line.id)

      return hit ? { ...line, receivedQty: line.receivedQty + hit.quantity } : line
    })

    const fullyReceived = nextLines.every(line => line.receivedQty >= line.quantityOrdered)
    const totalUnits = applied.reduce((sum, entry) => sum + entry.quantity, 0)

    const receivedAt = stampReceiptTime(receipt.date)

    const receiptRecord: PurchaseOrderReceipt = {
      id: receipt.id,
      date: receivedAt,
      receivedBy: receipt.receivedBy,
      note: receipt.note,
      lines: applied.map(entry => ({ lineId: entry.line.id, quantity: entry.quantity }))
    }

    set(state => ({
      purchaseOrders: state.purchaseOrders.map(current =>
        current.id === id
          ? {
              ...current,
              lines: nextLines,
              status: fullyReceived ? 'received' : 'partially_received',
              receipts: [...current.receipts, receiptRecord],
              activity: prependActivity(current, {
                id: `act-${receipt.id}`,
                label: `Receipt logged — ${totalUnits} units`,
                actor: receipt.receivedBy,
                timestamp: receivedAt,
                icon: 'package-check'
              })
            }
          : current
      )
    }))

    const products = useProductsStore.getState()
    const ledger = useStockLedgerStore.getState()

    for (const entry of applied) {
      products.receiveStock(entry.line.productId, entry.quantity)
      ledger.appendReceipt({
        key: `${receipt.id}::${entry.line.id}::${po.warehouseId}`,
        date: receivedAt,
        productId: entry.line.productId,
        sku: entry.line.sku,
        name: entry.line.name,
        primaryImage: entry.line.primaryImage,
        warehouseId: po.warehouseId,
        warehouseName: po.warehouseName,
        quantity: entry.quantity,
        reference: po.number,
        note: `Receipt ${receipt.id}`
      })
    }

    return true
  },

  cancelPurchaseOrder: id => {
    const po = get().getPurchaseOrder(id)

    if (!po) return

    const hasReceived = po.lines.some(line => line.receivedQty > 0)

    if (!(po.status === 'draft' || po.status === 'confirmed') || hasReceived) return

    const now = new Date().toISOString()

    set(state => ({
      purchaseOrders: state.purchaseOrders.map(current =>
        current.id === id
          ? {
              ...current,
              status: 'cancelled',
              activity: prependActivity(current, {
                id: `act-${id}-cancelled-${now}`,
                label: 'Cancelled',
                actor: current.buyer || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'ban'
              })
            }
          : current
      )
    }))
  },

  duplicatePurchaseOrder: id => {
    const source = get().getPurchaseOrder(id)

    if (!source) return ''

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const duplicate: PurchaseOrder = {
      ...source,
      isDraft: false,
      id: newId,
      number: '',
      status: 'draft',
      confirmedAt: null,
      requestedDeliveryDate: '',
      lines: source.lines.map((line, index) => ({ ...line, id: `${newId}-l${index}`, receivedQty: 0 })),
      receipts: [],
      createdAt: now,
      activity: [
        {
          id: `act-${newId}-created`,
          label: `Duplicated from ${source.number || 'draft'}`,
          actor: CURRENT_OPERATOR,
          timestamp: now,
          icon: 'file-plus-2'
        }
      ]
    }

    set(state => ({ purchaseOrders: [duplicate, ...state.purchaseOrders] }))

    return newId
  }
}))
