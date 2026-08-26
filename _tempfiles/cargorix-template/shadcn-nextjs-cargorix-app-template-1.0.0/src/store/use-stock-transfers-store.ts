// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { StockTransfer, StockTransferActivityEvent } from '@/types/entities/stock-transfer'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getInboundUnitsByWarehouse, nextTransferNumber } from '@/lib/selectors/stock-transfers-selectors'
import { checkWarehouseIntake } from '@/lib/selectors/warehouse-selectors'

const CURRENT_OPERATOR = 'You'

export type TransferFormPatch = Pick<
  StockTransfer,
  | 'sourceWarehouseId'
  | 'sourceWarehouseName'
  | 'destinationWarehouseId'
  | 'destinationWarehouseName'
  | 'requestedBy'
  | 'dispatchDate'
  | 'expectedArrival'
  | 'notes'
  | 'lines'
  | 'attachments'
>

const buildEmptyTransfer = (id: string): StockTransfer => ({
  isDraft: true,
  id,
  number: '',
  status: 'draft',
  sourceWarehouseId: '',
  sourceWarehouseName: '',
  destinationWarehouseId: '',
  destinationWarehouseName: '',
  requestedBy: '',
  dispatchDate: '',
  expectedArrival: '',
  notes: '',
  transferType: 'Inter-warehouse',
  priority: 'Normal',
  transporter: '',
  trackingNumber: '',
  reference: '',
  remarks: '',
  lines: [],
  attachments: [],
  activity: [
    {
      id: `act-${id}-created`,
      label: 'Transfer created',
      actor: CURRENT_OPERATOR,
      timestamp: new Date().toISOString(),
      icon: 'file-plus-2'
    }
  ],
  createdAt: new Date().toISOString(),
  createdBy: CURRENT_OPERATOR,
  dispatchedAt: null,
  completedAt: null
})

const prepend = (t: StockTransfer, e: StockTransferActivityEvent) => [e, ...t.activity]

const dispatchEvents = (t: StockTransfer, now: string): StockTransferActivityEvent[] => [
  {
    id: `act-${t.id}-transit-${now}`,
    label: 'In transit',
    actor: t.requestedBy || CURRENT_OPERATOR,
    timestamp: now,
    icon: 'truck'
  },
  {
    id: `act-${t.id}-dispatched-${now}`,
    label: 'Dispatched',
    actor: t.requestedBy || CURRENT_OPERATOR,
    timestamp: now,
    icon: 'package-check'
  },
  { id: `act-${t.id}-approved-${now}`, label: 'Approved', actor: 'System', timestamp: now, icon: 'check-circle-2' },
  ...t.activity
]

const unitsOf = (lines: StockTransfer['lines']) => lines.reduce((sum, l) => sum + l.quantitySent, 0)

export const checkTransferDestination = (
  values: Pick<StockTransfer, 'destinationWarehouseId' | 'lines'>,
  transferId: string,
  countInFlight: boolean
) => {
  const inFlight = countInFlight
    ? (getInboundUnitsByWarehouse(useStockTransfersStore.getState().transfers, transferId).get(
        values.destinationWarehouseId
      ) ?? 0)
    : 0

  return checkWarehouseIntake(
    useStockLedgerStore.getState().movements,
    useWarehousesStore.getState().warehouses,
    values.destinationWarehouseId,
    unitsOf(values.lines) + inFlight
  )
}

const isDispatchable = (
  values: Pick<StockTransfer, 'sourceWarehouseId' | 'destinationWarehouseId' | 'lines'>
): boolean =>
  Boolean(
    values.sourceWarehouseId &&
    values.destinationWarehouseId &&
    values.sourceWarehouseId !== values.destinationWarehouseId &&
    values.lines.length > 0 &&
    values.lines.every(l => l.quantitySent > 0)
  )

interface StockTransfersState {
  transfers: StockTransfer[]

  initialize: (transfers: StockTransfer[]) => void
  getTransfer: (id: string) => StockTransfer | undefined
  createDraftTransfer: (id: string) => void
  saveTransferDraft: (id: string, values: TransferFormPatch) => void
  dispatchTransfer: (id: string, values: TransferFormPatch) => boolean
  dispatchExistingDraft: (id: string) => boolean
  markReceived: (id: string) => boolean
  cancelTransfer: (id: string) => void
  duplicateTransfer: (id: string) => string
}

export const useStockTransfersStore = create<StockTransfersState>()((set, get) => ({
  transfers: [],

  initialize: transfers => {
    if (get().transfers.length > 0) return
    set({ transfers })
  },

  getTransfer: id => get().transfers.find(t => t.id === id),

  createDraftTransfer: id => {
    if (get().transfers.some(t => t.id === id)) return
    set(state => ({ transfers: [buildEmptyTransfer(id), ...state.transfers] }))
  },

  saveTransferDraft: (id, values) =>
    set(state => ({
      transfers: state.transfers.map(current =>
        current.id === id
          ? {
              ...current,
              ...values,
              isDraft: false,
              number: current.number || nextTransferNumber(state.transfers),
              status: 'draft'
            }
          : current
      )
    })),

  dispatchTransfer: (id, values) => {
    const t = get().getTransfer(id)

    if (!t) return false

    if (!isDispatchable(values)) return false

    if (!checkTransferDestination(values, id, true).ok) return false

    const now = new Date().toISOString()

    set(state => ({
      transfers: state.transfers.map(current =>
        current.id === id
          ? {
              ...current,
              ...values,
              isDraft: false,
              number: current.number || nextTransferNumber(state.transfers),
              status: 'in_transit',
              dispatchedAt: now,
              activity: dispatchEvents({ ...current, ...values }, now)
            }
          : current
      )
    }))

    return true
  },

  dispatchExistingDraft: id => {
    const t = get().getTransfer(id)

    if (!t || t.status !== 'draft') return false

    if (!isDispatchable(t)) return false

    if (!checkTransferDestination(t, id, true).ok) return false

    const now = new Date().toISOString()

    set(state => ({
      transfers: state.transfers.map(current =>
        current.id === id
          ? {
              ...current,
              number: current.number || nextTransferNumber(state.transfers),
              status: 'in_transit',
              dispatchedAt: now,
              activity: dispatchEvents(current, now)
            }
          : current
      )
    }))

    return true
  },

  markReceived: id => {
    const t = get().getTransfer(id)

    if (!t || t.status !== 'in_transit') return false

    if (!checkTransferDestination(t, id, false).ok) return false

    const now = new Date().toISOString()

    set(state => ({
      transfers: state.transfers.map(current =>
        current.id === id
          ? {
              ...current,
              status: 'completed',
              completedAt: now,
              lines: current.lines.map(l => ({ ...l, quantityReceived: l.quantitySent })),
              activity: prepend(current, {
                id: `act-${id}-received-${now}`,
                label: 'Received',
                actor: current.requestedBy || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'circle-check-big'
              })
            }
          : current
      )
    }))

    useStockLedgerStore.getState().appendTransfer({
      transferId: t.id,
      date: now,
      reference: t.number,
      sourceWarehouseId: t.sourceWarehouseId,
      sourceWarehouseName: t.sourceWarehouseName,
      destinationWarehouseId: t.destinationWarehouseId,
      destinationWarehouseName: t.destinationWarehouseName,
      lines: t.lines.map(l => ({
        lineId: l.id,
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        primaryImage: l.primaryImage,
        quantity: l.quantitySent
      }))
    })

    return true
  },

  cancelTransfer: id => {
    const t = get().getTransfer(id)

    if (!t || t.status !== 'draft') return

    const now = new Date().toISOString()

    set(state => ({
      transfers: state.transfers.map(current =>
        current.id === id
          ? {
              ...current,
              status: 'cancelled',
              activity: prepend(current, {
                id: `act-${id}-cancelled-${now}`,
                label: 'Cancelled',
                actor: current.requestedBy || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'ban'
              })
            }
          : current
      )
    }))
  },

  duplicateTransfer: id => {
    const source = get().getTransfer(id)

    if (!source) return ''

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const duplicate: StockTransfer = {
      ...source,
      isDraft: false,
      id: newId,
      number: '',
      status: 'draft',
      dispatchedAt: null,
      completedAt: null,
      lines: source.lines.map((line, index) => ({ ...line, id: `${newId}-l${index}`, quantityReceived: 0 })),
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

    set(state => ({ transfers: [duplicate, ...state.transfers] }))

    return newId
  }
}))
