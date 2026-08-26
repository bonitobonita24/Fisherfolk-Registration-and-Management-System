// Type Imports
import type { ExportTable } from '@/types'
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderLineAmounts,
  PurchaseOrderReceivingProgress,
  PurchaseOrderStatus,
  PurchaseOrderTotals
} from '@/types/entities/purchase-order'

// Util Imports
import { PURCHASE_ORDER_STATUS_LIST } from '@/types/entities/purchase-order'
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export type LineMoneyInput = Pick<
  PurchaseOrderLine,
  'quantityOrdered' | 'unitCost' | 'taxRatePercent' | 'discountPercent'
>

export const computeLineAmounts = (line: LineMoneyInput): PurchaseOrderLineAmounts => {
  const gross = round2(line.quantityOrdered * line.unitCost)
  const discountAmount = round2((gross * line.discountPercent) / 100)
  const net = round2(gross - discountAmount)
  const tax = round2((net * line.taxRatePercent) / 100)
  const total = round2(net + tax)

  return { gross, discountAmount, net, tax, total }
}

export const computePurchaseOrderTotals = (po: {
  lines: LineMoneyInput[]
  shippingCost: number
}): PurchaseOrderTotals => {
  let subtotal = 0
  let discount = 0
  let tax = 0
  let totalQuantity = 0

  for (const line of po.lines) {
    const amounts = computeLineAmounts(line)

    subtotal += amounts.gross
    discount += amounts.discountAmount
    tax += amounts.tax
    totalQuantity += line.quantityOrdered
  }

  subtotal = round2(subtotal)
  discount = round2(discount)
  tax = round2(tax)

  const shipping = round2(po.shippingCost)
  const grandTotal = round2(subtotal - discount + tax + shipping)

  return { subtotal, discount, tax, shipping, grandTotal, itemCount: po.lines.length, totalQuantity }
}

export const computeReceivingProgress = (po: Pick<PurchaseOrder, 'lines'>): PurchaseOrderReceivingProgress => {
  let totalOrdered = 0
  let totalReceived = 0

  for (const line of po.lines) {
    totalOrdered += line.quantityOrdered
    totalReceived += line.receivedQty
  }

  const totalRemaining = Math.max(0, totalOrdered - totalReceived)
  const receivedPercent = totalOrdered === 0 ? 0 : Math.round((totalReceived / totalOrdered) * 1000) / 10

  return { totalOrdered, totalReceived, totalRemaining, receivedPercent }
}

export const getPurchaseOrderKpis = (pos: PurchaseOrder[]) => {
  const live = excludeUnsavedDrafts(pos)
  const counts = getStatusCounts(live)

  const totalValue = round2(
    live.filter(po => po.status !== 'cancelled').reduce((sum, po) => sum + computePurchaseOrderTotals(po).grandTotal, 0)
  )

  return {
    total: live.length,
    draft: counts.draft,
    inTransit: counts.in_transit,
    received: counts.received,
    totalValue
  }
}

export const getStatusCounts = (pos: PurchaseOrder[]): Record<PurchaseOrderStatus, number> => {
  const counts = Object.fromEntries(PURCHASE_ORDER_STATUS_LIST.map(status => [status, 0])) as Record<
    PurchaseOrderStatus,
    number
  >

  for (const po of pos) counts[po.status] += 1

  return counts
}

export const nextPurchaseOrderNumber = (pos: PurchaseOrder[]): string => {
  let maxSeq = 0
  let year = 2026

  for (const po of pos) {
    const match = /^PO-(\d{4})-(\d+)$/.exec(po.number)

    if (!match) continue

    const seq = Number(match[2])

    if (seq > maxSeq) {
      maxSeq = seq
      year = Number(match[1])
    }
  }

  return `PO-${year}-${`${maxSeq + 1}`.padStart(5, '0')}`
}

export const nextReceiptId = (pos: PurchaseOrder[]): string => {
  let maxSeq = 0
  let year = 2026

  for (const po of pos) {
    for (const receipt of po.receipts) {
      const match = /^RCPT-(\d{4})-(\d+)$/.exec(receipt.id)

      if (!match) continue

      const seq = Number(match[2])

      if (seq > maxSeq) {
        maxSeq = seq
        year = Number(match[1])
      }
    }
  }

  return `RCPT-${year}-${`${maxSeq + 1}`.padStart(5, '0')}`
}

export const buildPurchaseOrdersExport = (pos: PurchaseOrder[]): ExportTable => {
  const headers = ['PO', 'Supplier', 'Warehouse', 'Line items', 'Total value', 'Expected', 'Created by', 'Status']

  const rows = pos.map(po => {
    const { grandTotal } = computePurchaseOrderTotals(po)

    return [
      po.number,
      po.supplier.name,
      po.warehouseName,
      `${po.lines.length}`,
      grandTotal.toFixed(2),
      po.expectedDeliveryDate,
      po.buyer,
      po.status
    ]
  })

  return { headers, rows }
}
