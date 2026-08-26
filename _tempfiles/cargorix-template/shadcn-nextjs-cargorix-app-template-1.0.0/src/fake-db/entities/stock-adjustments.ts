// Type Imports
import type {
  AdjustmentAttachment,
  StockAdjustment,
  StockAdjustmentActivityEvent,
  StockAdjustmentLine,
  StockAdjustmentReason,
  StockAdjustmentStatus
} from '@/types/entities/stock-adjustment'

// Data Imports
import { db as productsDb } from '@/fake-db/entities/products'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'
import { db as stockMovementsDb } from '@/fake-db/entities/stock-movements'
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'

// Util Imports
import { getWarehouseBalances } from '@/lib/selectors/stock-ledger-selectors'

const ANCHOR = new Date('2026-07-15T09:00:00Z').getTime()
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

const stockedWarehouses = warehouseIds.filter(id => (stockByWarehouse.get(id)?.length ?? 0) > 0)

const productById = new Map(productsDb.map(p => [p.id, p]))

const REASONS: StockAdjustmentReason[] = [
  'cycle_count',
  'damage',
  'write_off',
  'found',
  'return_to_stock',
  'correction'
]

const reasonSign = (reason: StockAdjustmentReason, index: number): 1 | -1 => {
  if (reason === 'damage' || reason === 'write_off') return -1
  if (reason === 'found' || reason === 'return_to_stock') return 1

  return index % 2 === 0 ? 1 : -1
}

type Plan = { status: StockAdjustmentStatus; count: number }

const PLAN: Plan[] = [
  { status: 'draft', count: 4 },
  { status: 'posted', count: 10 },
  { status: 'cancelled', count: 2 }
]

const buildLines = (warehouseId: string, reason: StockAdjustmentReason, index: number): StockAdjustmentLine[] => {
  const stock = stockByWarehouse.get(warehouseId) ?? []
  const lineCount = Math.min(stock.length, 1 + (index % 6))
  const sign = reasonSign(reason, index)
  const lines: StockAdjustmentLine[] = []

  for (let i = 0; i < lineCount; i++) {
    const { productId } = stock[(index * 2 + i) % stock.length]

    if (lines.some(l => l.productId === productId)) continue

    const product = productById.get(productId)

    if (!product) continue

    const currentQty = balances.get(`${productId}::${warehouseId}`) ?? 0
    const rawDelta = 1 + ((index + i) % 5)
    const magnitude = sign < 0 ? Math.min(rawDelta, currentQty) : rawDelta
    const adjustmentQty = sign * Math.max(1, magnitude)

    if (currentQty + adjustmentQty < 0) continue

    lines.push({
      id: `adjl-${pad(index + 1, 3)}-${pad(i + 1, 2)}`,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      primaryImage: product.primaryImage,
      unit: product.unit ?? 'units',
      currentQty,
      adjustmentQty
    })
  }

  return lines
}

const buildActivity = (
  index: number,
  status: StockAdjustmentStatus,
  requestedBy: string,
  createdOffset: number,
  postedOffset: number
): StockAdjustmentActivityEvent[] => {
  const events: StockAdjustmentActivityEvent[] = []
  let seq = 0

  const push = (label: string, actor: string, timestamp: string, icon: string) => {
    events.push({ id: `adjact-${pad(index + 1, 3)}-${pad(++seq, 2)}`, label, actor, timestamp, icon })
  }

  if (status === 'posted') push('Posted', 'System', dateAt(postedOffset), 'circle-check-big')
  if (status === 'cancelled') push('Cancelled', requestedBy, dateAt(createdOffset + 1), 'ban')
  push('Adjustment created', requestedBy, dateAt(createdOffset), 'file-plus-2')

  return events
}

const buildAttachments = (index: number): AdjustmentAttachment[] => {
  const count = index % 3 === 0 ? 2 : index % 4 === 0 ? 1 : 0

  return Array.from({ length: count }, (_, i) => ({
    id: `adjatt-${pad(index + 1, 3)}-${pad(i + 1, 2)}`,
    name: i === 0 ? 'cycle-count-sheet.pdf' : 'adjustment-authorization.pdf',
    sizeLabel: `${140 + index * 9 + i * 35} KB`,
    type: 'application/pdf'
  }))
}

const buildAdjustment = (index: number, status: StockAdjustmentStatus): StockAdjustment => {
  const warehouseId = stockedWarehouses[index % stockedWarehouses.length]
  const reason = REASONS[index % REASONS.length]
  const requestedBy = TEAM_MEMBERS[index % TEAM_MEMBERS.length]
  const lines = buildLines(warehouseId, reason, index)

  const createdOffset = index % 3
  const postedOffset = createdOffset + 1 + (index % 2)

  const isRich = index % 2 === 0

  return {
    id: `adj-${pad(index + 1, 3)}`,
    number: `ADJ-2026-${pad(index + 1)}`,
    status,

    warehouseId,
    warehouseName: warehouseName(warehouseId),
    reason,

    requestedBy,
    date: dateOnly(createdOffset),
    notes: isRich ? 'Adjustment raised from weekly cycle-count reconciliation.' : '',

    lines,
    attachments: buildAttachments(index),
    activity: buildActivity(index, status, requestedBy, createdOffset, postedOffset),

    createdAt: dateAt(createdOffset),
    createdBy: requestedBy,
    postedAt: status === 'posted' ? dateAt(postedOffset) : null
  }
}

const buildAdjustments = (): StockAdjustment[] => {
  const adjustments: StockAdjustment[] = []
  let index = 0

  for (const { status, count } of PLAN) {
    for (let i = 0; i < count; i++) {
      adjustments.push(buildAdjustment(index, status))
      index++
    }
  }

  return adjustments
}

export const db: StockAdjustment[] = buildAdjustments()
