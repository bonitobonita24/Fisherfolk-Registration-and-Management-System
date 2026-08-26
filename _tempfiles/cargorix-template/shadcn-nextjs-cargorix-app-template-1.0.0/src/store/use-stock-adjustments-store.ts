// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { StockAdjustment, StockAdjustmentActivityEvent } from '@/types/entities/stock-adjustment'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useProductsStore } from '@/store/use-products-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { nextAdjustmentNumber } from '@/lib/selectors/stock-adjustments-selectors'
import { checkWarehouseIntake } from '@/lib/selectors/warehouse-selectors'

const CURRENT_OPERATOR = 'You'

export type AdjustmentFormPatch = Pick<
  StockAdjustment,
  'warehouseId' | 'warehouseName' | 'reason' | 'requestedBy' | 'date' | 'notes' | 'lines' | 'attachments'
>

const buildEmptyAdjustment = (id: string): StockAdjustment => ({
  isDraft: true,
  id,
  number: '',
  status: 'draft',
  warehouseId: '',
  warehouseName: '',
  reason: 'cycle_count',
  requestedBy: '',
  date: '',
  notes: '',
  lines: [],
  attachments: [],
  activity: [
    {
      id: `act-${id}-created`,
      label: 'Adjustment created',
      actor: CURRENT_OPERATOR,
      timestamp: new Date().toISOString(),
      icon: 'file-plus-2'
    }
  ],
  createdAt: new Date().toISOString(),
  createdBy: CURRENT_OPERATOR,
  postedAt: null
})

const prepend = (a: StockAdjustment, e: StockAdjustmentActivityEvent) => [e, ...a.activity]

const isPostable = (values: Pick<StockAdjustment, 'warehouseId' | 'reason' | 'lines'>): boolean =>
  Boolean(
    values.warehouseId &&
    values.reason &&
    values.lines.length > 0 &&
    values.lines.every(l => l.adjustmentQty !== 0 && l.currentQty + l.adjustmentQty >= 0)
  )

export const checkAdjustmentIntake = (values: Pick<StockAdjustment, 'warehouseId' | 'lines'>) =>
  checkWarehouseIntake(
    useStockLedgerStore.getState().movements,
    useWarehousesStore.getState().warehouses,
    values.warehouseId,
    Math.max(
      0,
      values.lines.reduce((sum, l) => sum + l.adjustmentQty, 0)
    )
  )

const applyPost = (values: AdjustmentFormPatch, id: string, number: string, now: string) => {
  const ledger = useStockLedgerStore.getState()
  const products = useProductsStore.getState()

  ledger.appendAdjustment({
    adjustmentId: id,
    date: now,
    reference: number,
    warehouseId: values.warehouseId,
    warehouseName: values.warehouseName,
    lines: values.lines.map(l => ({
      lineId: l.id,
      productId: l.productId,
      sku: l.sku,
      name: l.name,
      primaryImage: l.primaryImage,
      quantity: l.adjustmentQty
    }))
  })

  for (const l of values.lines) products.adjustStock(l.productId, l.adjustmentQty)
}

interface StockAdjustmentsState {
  adjustments: StockAdjustment[]

  initialize: (adjustments: StockAdjustment[]) => void
  getAdjustment: (id: string) => StockAdjustment | undefined
  createDraftAdjustment: (id: string) => void
  saveAdjustmentDraft: (id: string, values: AdjustmentFormPatch) => void
  postAdjustment: (id: string, values: AdjustmentFormPatch) => boolean
  postExistingDraft: (id: string) => boolean
  cancelAdjustment: (id: string) => void
  duplicateAdjustment: (id: string) => string
}

export const useStockAdjustmentsStore = create<StockAdjustmentsState>()((set, get) => ({
  adjustments: [],

  initialize: adjustments => {
    if (get().adjustments.length > 0) return
    set({ adjustments })
  },

  getAdjustment: id => get().adjustments.find(a => a.id === id),

  createDraftAdjustment: id => {
    if (get().adjustments.some(a => a.id === id)) return
    set(state => ({ adjustments: [buildEmptyAdjustment(id), ...state.adjustments] }))
  },

  saveAdjustmentDraft: (id, values) =>
    set(state => ({
      adjustments: state.adjustments.map(current =>
        current.id === id
          ? {
              ...current,
              ...values,
              isDraft: false,
              number: current.number || nextAdjustmentNumber(state.adjustments),
              status: 'draft'
            }
          : current
      )
    })),

  postAdjustment: (id, values) => {
    const a = get().getAdjustment(id)

    if (!a) return false

    const valid = Boolean(
      values.warehouseId &&
      values.reason &&
      values.lines.length > 0 &&
      values.lines.every(l => l.adjustmentQty !== 0 && l.currentQty + l.adjustmentQty >= 0)
    )

    if (!valid) return false

    if (!checkAdjustmentIntake(values).ok) return false

    const now = new Date().toISOString()
    const number = a.number || nextAdjustmentNumber(get().adjustments)

    set(state => ({
      adjustments: state.adjustments.map(current =>
        current.id === id
          ? {
              ...current,
              ...values,
              isDraft: false,
              number,
              status: 'posted',
              postedAt: now,
              activity: [
                {
                  id: `act-${id}-posted-${now}`,
                  label: 'Posted',
                  actor: current.requestedBy || 'You',
                  timestamp: now,
                  icon: 'circle-check-big'
                },
                ...current.activity
              ]
            }
          : current
      )
    }))

    const ledger = useStockLedgerStore.getState()
    const products = useProductsStore.getState()

    ledger.appendAdjustment({
      adjustmentId: id,
      date: now,
      reference: number,
      warehouseId: values.warehouseId,
      warehouseName: values.warehouseName,
      lines: values.lines.map(l => ({
        lineId: l.id,
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        primaryImage: l.primaryImage,
        quantity: l.adjustmentQty
      }))
    })

    for (const l of values.lines) products.adjustStock(l.productId, l.adjustmentQty)

    return true
  },

  postExistingDraft: id => {
    const a = get().getAdjustment(id)

    if (!a || a.status !== 'draft') return false

    if (!isPostable(a)) return false

    if (!checkAdjustmentIntake(a).ok) return false

    const now = new Date().toISOString()
    const number = a.number || nextAdjustmentNumber(get().adjustments)

    set(state => ({
      adjustments: state.adjustments.map(current =>
        current.id === id
          ? {
              ...current,
              number,
              status: 'posted',
              postedAt: now,
              activity: prepend(current, {
                id: `act-${id}-posted-${now}`,
                label: 'Posted',
                actor: current.requestedBy || CURRENT_OPERATOR,
                timestamp: now,
                icon: 'circle-check-big'
              })
            }
          : current
      )
    }))

    applyPost(
      {
        warehouseId: a.warehouseId,
        warehouseName: a.warehouseName,
        reason: a.reason,
        requestedBy: a.requestedBy,
        date: a.date,
        notes: a.notes,
        lines: a.lines,
        attachments: a.attachments
      },
      id,
      number,
      now
    )

    return true
  },

  cancelAdjustment: id => {
    const a = get().getAdjustment(id)

    if (!a || a.status !== 'draft') return

    const now = new Date().toISOString()

    set(state => ({
      adjustments: state.adjustments.map(current =>
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

  duplicateAdjustment: id => {
    const source = get().getAdjustment(id)

    if (!source) return ''

    const newId = crypto.randomUUID()
    const now = new Date().toISOString()

    const duplicate: StockAdjustment = {
      ...source,
      isDraft: false,
      id: newId,
      number: '',
      status: 'draft',
      postedAt: null,
      lines: source.lines.map((line, index) => ({ ...line, id: `${newId}-l${index}` })),
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

    set(state => ({ adjustments: [duplicate, ...state.adjustments] }))

    return newId
  }
}))
