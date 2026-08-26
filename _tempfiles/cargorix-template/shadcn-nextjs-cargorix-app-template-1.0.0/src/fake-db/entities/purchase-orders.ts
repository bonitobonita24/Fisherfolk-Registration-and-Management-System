// Type Imports
import type {
  PurchaseOrder,
  PurchaseOrderActivityEvent,
  PurchaseOrderAttachment,
  PurchaseOrderLine,
  PurchaseOrderReceipt,
  PurchaseOrderStatus,
  SupplierSnapshot
} from '@/types/entities/purchase-order'

// Data Imports
import { db as productsDb } from '@/fake-db/entities/products'
import { db as suppliersDb } from '@/fake-db/entities/suppliers'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'

const ANCHOR = new Date('2026-07-20T09:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

const BUYERS = ['Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Daniel Lee']
const PAYMENT_TERMS = ['Net 30', 'Net 15', 'Net 60', 'Due on receipt']
const CARRIERS = ['FedEx Freight', 'UPS Freight', 'XPO Logistics', 'Old Dominion']
const TAX_RATES = [0, 5]
const DISCOUNTS = [0, 0, 0, 2, 5]

const pad = (n: number, len = 5) => `${n}`.padStart(len, '0')

const isoAt = (offsetDays: number, offsetHours = 0) =>
  new Date(ANCHOR + offsetDays * DAY + offsetHours * HOUR).toISOString()

const dateOnly = (offsetDays: number) => isoAt(offsetDays).slice(0, 10)

const warehouseById = (id: string) => warehousesDb.find(w => w.id === id)!

const supplierSnapshot = (supplierId: string): SupplierSnapshot => {
  const s = suppliersDb.find(sup => sup.id === supplierId)!

  return {
    supplierId: s.id,
    name: s.name,
    contactPerson: s.contactPerson,
    email: s.email,
    phone: s.phone,
    address: s.address
  }
}

const productsByWarehouse: Record<string, typeof productsDb> = {}

for (const p of productsDb) {
  productsByWarehouse[p.warehouseId] = productsByWarehouse[p.warehouseId] ?? []
  productsByWarehouse[p.warehouseId].push(p)
}

const warehouseIds = warehousesDb.map(w => w.id)
const supplierIds = suppliersDb.map(s => s.id)

interface POSpec {
  status: PurchaseOrderStatus
  seq: number
}

const buildStatusSpecs = (): POSpec[] => {
  const counts: Record<PurchaseOrderStatus, number> = {
    draft: 5,
    confirmed: 6,
    in_transit: 5,
    partially_received: 3,
    received: 7,
    cancelled: 2
  }

  const order: PurchaseOrderStatus[] = [
    'draft',
    'confirmed',
    'in_transit',
    'partially_received',
    'received',
    'cancelled'
  ]

  const specs: POSpec[] = []

  for (const status of order) {
    for (let seq = 0; seq < counts[status]; seq++) {
      specs.push({ status, seq })
    }
  }

  return specs
}

const buildLines = (poId: string, warehouseId: string, index: number): PurchaseOrderLine[] => {
  const pool = productsByWarehouse[warehouseId] ?? []
  const desiredCount = 1 + (index % 6)
  const lineCount = Math.min(desiredCount, pool.length)

  return Array.from({ length: lineCount }, (_, n) => {
    const product = pool[(index + n) % pool.length]
    const quantityOrdered = 10 + ((index * 7 + n * 13) % 90)

    return {
      id: `${poId}-l${n + 1}`,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      quantityOrdered,
      unitCost: product.unitCost,
      taxRatePercent: TAX_RATES[(index + n) % TAX_RATES.length],
      discountPercent: DISCOUNTS[(index + n * 3) % DISCOUNTS.length],
      receivedQty: 0
    }
  })
}

const buildReceivedReceipts = (
  poId: string,
  lines: PurchaseOrderLine[],
  receiptSeqStart: number,
  createdOffset: number
) => {
  const firstShare = lines.map(line => Math.max(1, Math.round(line.quantityOrdered * 0.6)))

  const receipts: PurchaseOrderReceipt[] = [
    {
      id: `RCPT-2026-${pad(receiptSeqStart)}`,
      date: isoAt(createdOffset + 5, 10),
      receivedBy: 'Warehouse Team',
      note: 'Partial delivery received',
      lines: lines.map((line, i) => ({ lineId: line.id, quantity: firstShare[i] }))
    },
    {
      id: `RCPT-2026-${pad(receiptSeqStart + 1)}`,
      date: isoAt(createdOffset + 9, 14),
      receivedBy: 'Warehouse Team',
      note: 'Final delivery received — order complete',
      lines: lines.map((line, i) => ({ lineId: line.id, quantity: line.quantityOrdered - firstShare[i] }))
    }
  ]

  for (const line of lines) line.receivedQty = line.quantityOrdered

  return receipts
}

const buildPartialReceipts = (
  poId: string,
  lines: PurchaseOrderLine[],
  receiptSeqStart: number,
  createdOffset: number
) => {
  const receivingLines = lines.slice(0, Math.max(1, Math.min(2, lines.length - 1)))

  const receipts: PurchaseOrderReceipt[] = [
    {
      id: `RCPT-2026-${pad(receiptSeqStart)}`,
      date: isoAt(createdOffset + 6, 11),
      receivedBy: 'Warehouse Team',
      note: 'Partial delivery received',
      lines: receivingLines.map(line => ({
        lineId: line.id,
        quantity: Math.max(1, Math.round(line.quantityOrdered * 0.4))
      }))
    }
  ]

  for (const line of receivingLines) {
    line.receivedQty = Math.max(1, Math.round(line.quantityOrdered * 0.4))
  }

  return receipts
}

const buildAttachments = (poId: string, index: number): PurchaseOrderAttachment[] => {
  const count = index % 3 === 0 ? 2 : index % 2 === 0 ? 1 : 0

  const options: PurchaseOrderAttachment[] = [
    { id: `${poId}-att1`, name: 'Supplier_Quote.pdf', sizeLabel: '156 KB', type: 'application/pdf' },
    { id: `${poId}-att2`, name: 'Packing_List.pdf', sizeLabel: '84 KB', type: 'application/pdf' }
  ]

  return options.slice(0, count)
}

const buildActivity = (
  status: PurchaseOrderStatus,
  buyer: string,
  createdOffset: number,
  receipts: PurchaseOrderReceipt[]
): PurchaseOrderActivityEvent[] => {
  const events: PurchaseOrderActivityEvent[] = []
  let seq = 1

  const push = (label: string, actor: string, offsetDays: number, offsetHours: number, icon: string) => {
    events.push({ id: `act-${seq++}`, label, actor, timestamp: isoAt(offsetDays, offsetHours), icon })
  }

  push('Draft created', buyer, createdOffset, 9, 'file-plus-2')

  if (status === 'cancelled') {
    push('Cancelled', buyer, createdOffset + 2, 10, 'ban')

    return events.reverse()
  }

  if (status === 'draft') {
    return events.reverse()
  }

  push('Confirmed', buyer, createdOffset + 1, 13, 'check-circle-2')

  if (status === 'confirmed') {
    return events.reverse()
  }

  push('Marked in transit', 'Warehouse Team', createdOffset + 3, 9, 'truck')

  if (status === 'in_transit') {
    return events.reverse()
  }

  receipts.forEach(receipt => {
    push(
      receipt.note.startsWith('Final') ? 'Final receipt recorded' : 'Receipt recorded',
      receipt.receivedBy,
      Math.round((new Date(receipt.date).getTime() - ANCHOR) / DAY),
      Math.round(((new Date(receipt.date).getTime() - ANCHOR) % DAY) / HOUR),
      'package-check'
    )
  })

  return events.reverse()
}

const buildPurchaseOrder = (spec: POSpec, index: number, receiptCounter: { value: number }): PurchaseOrder => {
  const poId = `po-${pad(index + 1)}`
  const number = `PO-2026-${pad(index + 1)}`
  const warehouseId = warehouseIds[index % warehouseIds.length]
  const warehouse = warehouseById(warehouseId)
  const supplierId = supplierIds[index % supplierIds.length]
  const supplier = supplierSnapshot(supplierId)
  const buyer = BUYERS[index % BUYERS.length]
  const paymentTerms = PAYMENT_TERMS[index % PAYMENT_TERMS.length]
  const shippingCost = (index * 17) % 151

  const createdOffset = -30 + ((index * 5) % 30)
  const createdAt = isoAt(createdOffset, 9)
  const createdBy = buyer

  const lines = buildLines(poId, warehouseId, index)

  const isDraft = spec.status === 'draft'
  const isCancelled = spec.status === 'cancelled'
  const isConfirmedPlus = !isDraft

  const confirmedAt = isConfirmedPlus ? isoAt(createdOffset + 1, 13) : null
  const requestedDeliveryDate = isConfirmedPlus ? dateOnly(createdOffset + 10) : ''
  const expectedDeliveryDate = dateOnly(createdOffset + (isCancelled ? 10 : 12))

  let receipts: PurchaseOrderReceipt[] = []

  if (spec.status === 'received') {
    receipts = buildReceivedReceipts(poId, lines, receiptCounter.value, createdOffset)
    receiptCounter.value += receipts.length
  } else if (spec.status === 'partially_received') {
    receipts = buildPartialReceipts(poId, lines, receiptCounter.value, createdOffset)
    receiptCounter.value += receipts.length
  }

  const trackingCarrier =
    spec.status === 'in_transit' || spec.status === 'partially_received' || spec.status === 'received'
      ? CARRIERS[index % CARRIERS.length]
      : ''

  const trackingNumber = trackingCarrier !== '' ? `TRK${pad(900000 + index * 37, 9)}` : ''

  const activity = buildActivity(spec.status, buyer, createdOffset, receipts)

  return {
    id: poId,
    number,
    status: spec.status,

    supplierId,
    supplier,

    warehouseId,
    warehouseName: warehouse.name,
    deliveryAddress: warehouse.address,

    currency: 'USD',
    paymentTerms,
    buyer,

    requestedDeliveryDate,
    expectedDeliveryDate,

    trackingCarrier,
    trackingNumber,

    lines,
    shippingCost,

    notes: isCancelled
      ? 'Order cancelled — see internal notes.'
      : 'Please deliver during warehouse receiving hours (8am-5pm).',
    internalNotes: isCancelled ? 'Cancelled per buyer request before shipment.' : '',
    attachments: buildAttachments(poId, index),
    receipts,
    activity,

    createdAt,
    createdBy,
    confirmedAt
  }
}

const buildPurchaseOrders = (): PurchaseOrder[] => {
  const specs = buildStatusSpecs()
  const receiptCounter = { value: 1 }

  return specs.map((spec, index) => buildPurchaseOrder(spec, index, receiptCounter))
}

export const db: PurchaseOrder[] = buildPurchaseOrders()
