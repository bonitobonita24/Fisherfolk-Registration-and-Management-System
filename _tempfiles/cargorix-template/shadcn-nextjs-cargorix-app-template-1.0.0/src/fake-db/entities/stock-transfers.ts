// Type Imports
import type {
  StockTransfer,
  StockTransferActivityEvent,
  StockTransferLine,
  StockTransferStatus,
  TransferAttachment
} from '@/types/entities/stock-transfer'

// Data Imports
import { db as productsDb } from '@/fake-db/entities/products'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'
import { db as stockMovementsDb } from '@/fake-db/entities/stock-movements'
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

// Util Imports
import { getWarehouseBalances } from '@/lib/selectors/stock-ledger-selectors'

const ANCHOR = new Date('2026-07-18T09:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

const balances = getWarehouseBalances(stockMovementsDb)
const warehouseIds = warehousesDb.map(w => w.id)
const warehouseName = (id: string) => warehousesDb.find(w => w.id === id)?.name ?? id
const pad = (n: number, len = 5) => `${n}`.padStart(len, '0')

const dateAt = (offsetDays: number, hour = 9) => new Date(ANCHOR + offsetDays * DAY + hour * HOUR).toISOString()
const dateOnly = (offsetDays: number) => dateAt(offsetDays).slice(0, 10)

const stockByWarehouse = new Map<string, { productId: string; balance: number }[]>()

for (const [key, qty] of balances) {
  if (qty <= 0) continue

  const [productId, warehouseId] = key.split('::')
  const list = stockByWarehouse.get(warehouseId)

  if (list) list.push({ productId, balance: qty })
  else stockByWarehouse.set(warehouseId, [{ productId, balance: qty }])
}

const sourceWarehouses = warehouseIds.filter(id => (stockByWarehouse.get(id)?.length ?? 0) > 0)

const productById = new Map(productsDb.map(p => [p.id, p]))

const TRANSPORTERS = ['BlueDart Logistics', 'Swift Freight Co.', 'Regional Cross-dock Carriers', 'Prime Line Haulage']
const PRIORITIES = ['Normal', 'High']

type Plan = { status: StockTransferStatus; count: number }

const PLAN: Plan[] = [
  { status: 'draft', count: 4 },
  { status: 'in_transit', count: 6 },
  { status: 'completed', count: 9 },
  { status: 'cancelled', count: 2 }
]

const buildLines = (sourceId: string, index: number): StockTransferLine[] => {
  const stock = stockByWarehouse.get(sourceId) ?? []
  const lineCount = Math.min(stock.length, 1 + (index % 8))
  const lines: StockTransferLine[] = []

  for (let i = 0; i < lineCount; i++) {
    const { productId, balance } = stock[(index * 3 + i) % stock.length]

    if (lines.some(l => l.productId === productId)) continue

    const product = productById.get(productId)

    if (!product) continue

    const quantitySent = Math.max(1, Math.min(balance, 2 + ((index + i) % 6)))

    lines.push({
      id: `trfl-${pad(index + 1, 3)}-${pad(i + 1, 2)}`,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      unit: 'units',
      quantitySent,
      quantityReceived: 0
    })
  }

  return lines
}

const buildActivity = (
  index: number,
  status: StockTransferStatus,
  requestedBy: string,
  createdOffset: number,
  dispatchOffset: number,
  completeOffset: number
): StockTransferActivityEvent[] => {
  const events: StockTransferActivityEvent[] = []
  let seq = 0

  const push = (label: string, actor: string, timestamp: string, icon: string) => {
    events.push({ id: `act-${pad(index + 1, 3)}-${pad(++seq, 2)}`, label, actor, timestamp, icon })
  }

  if (status === 'cancelled') {
    push('Cancelled', requestedBy, dateAt(createdOffset + 1), 'ban')
    push('Transfer created', requestedBy, dateAt(createdOffset), 'file-plus-2')

    return events
  }

  if (status === 'completed') push('Received', 'System', dateAt(completeOffset), 'circle-check-big')
  if (status === 'in_transit' || status === 'completed')
    push('In transit', 'System', dateAt(dispatchOffset, 12), 'truck')
  if (status === 'in_transit' || status === 'completed')
    push('Dispatched', requestedBy, dateAt(dispatchOffset), 'package-check')
  if (status === 'in_transit' || status === 'completed')
    push('Approved', 'System', dateAt(createdOffset + 1), 'check-circle-2')
  push('Transfer created', requestedBy, dateAt(createdOffset), 'file-plus-2')

  return events
}

const buildAttachments = (index: number): TransferAttachment[] => {
  const count = index % 3 === 0 ? 2 : index % 4 === 0 ? 1 : 0

  return Array.from({ length: count }, (_, i) => ({
    id: `att-${pad(index + 1, 3)}-${pad(i + 1, 2)}`,
    name: i === 0 ? 'packing-list.pdf' : 'transfer-authorization.pdf',
    sizeLabel: `${180 + index * 7 + i * 40} KB`,
    type: 'application/pdf'
  }))
}

const buildTransfer = (index: number, status: StockTransferStatus): StockTransfer => {
  const sourceId = sourceWarehouses[index % sourceWarehouses.length]
  const destinationId = warehouseIds.filter(id => id !== sourceId)[index % (warehouseIds.length - 1)]
  const lines = buildLines(sourceId, index)
  const requestedBy = TEAM_MEMBERS[index % TEAM_MEMBERS.length]

  const createdOffset = index % 2
  const dispatchOffset = createdOffset + 1 + (index % 3)
  const arrivalOffset = dispatchOffset + 2 + (index % 3)
  const completeOffset = arrivalOffset

  const isRich = index % 2 === 0

  const finalizedLines = status === 'completed' ? lines.map(l => ({ ...l, quantityReceived: l.quantitySent })) : lines

  return {
    id: `trf-${pad(index + 1, 3)}`,
    number: `TRF-2026-${pad(index + 1)}`,
    status,

    sourceWarehouseId: sourceId,
    sourceWarehouseName: warehouseName(sourceId),
    destinationWarehouseId: destinationId,
    destinationWarehouseName: warehouseName(destinationId),

    requestedBy,
    dispatchDate: dateOnly(dispatchOffset),
    expectedArrival: dateOnly(arrivalOffset),
    notes: isRich ? 'Replenishment transfer per weekly stock balancing review.' : '',

    transferType: isRich ? 'Inter-warehouse' : '',
    priority: isRich ? PRIORITIES[index % PRIORITIES.length] : '',
    transporter: isRich ? TRANSPORTERS[index % TRANSPORTERS.length] : '',
    trackingNumber: isRich ? `TRK-${pad(100000 + index * 37, 6)}` : '',
    reference: isRich ? `REF-${pad(index + 1, 4)}` : '',
    remarks: isRich ? 'Handle with standard care; confirm receipt on arrival.' : '',

    lines: finalizedLines,
    attachments: buildAttachments(index),
    activity: buildActivity(index, status, requestedBy, createdOffset, dispatchOffset, completeOffset),

    createdAt: dateAt(createdOffset),
    createdBy: requestedBy,
    dispatchedAt: status === 'in_transit' || status === 'completed' ? dateAt(dispatchOffset) : null,
    completedAt: status === 'completed' ? dateAt(completeOffset) : null
  }
}

const buildTransfers = (): StockTransfer[] => {
  const transfers: StockTransfer[] = []
  let index = 0

  for (const { status, count } of PLAN) {
    for (let i = 0; i < count; i++) {
      transfers.push(buildTransfer(index, status))
      index++
    }
  }

  return transfers
}

export const db: StockTransfer[] = buildTransfers()
