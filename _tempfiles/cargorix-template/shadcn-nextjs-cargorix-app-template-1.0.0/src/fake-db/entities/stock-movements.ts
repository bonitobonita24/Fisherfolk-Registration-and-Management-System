// Type Imports
import type { StockMovement } from '@/types/entities/stock-movement'

// Data Imports
import { db as productsDb } from '@/fake-db/entities/products'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'

const ANCHOR = new Date('2026-07-28T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

const SALES_SPAN_DAYS = 178
const SALES_WAVES = 36
const OPENING_LOT_OFFSET = 196

const CATEGORY_TURNOVER: Record<string, number> = {
  Electronics: 8.2,
  Clothing: 6.4,
  Sports: 5.1,
  'Home & Garden': 4.3,
  Books: 3.2,
  'Packaging Supplies': 2.8
}

const DEFAULT_TURNOVER = 4

const warehouseIds = warehousesDb.map(w => w.id)
const warehouseName = (id: string) => warehousesDb.find(w => w.id === id)?.name ?? id
const secondaryWarehouse = (homeId: string) => warehouseIds[(warehouseIds.indexOf(homeId) + 1) % warehouseIds.length]
const pad = (n: number, len = 4) => `${n}`.padStart(len, '0')

const buildMovements = (): StockMovement[] => {
  const movements: StockMovement[] = []
  const stockPlan = buildStockPlan()
  let seq = 1

  const push = (m: Omit<StockMovement, 'id'>) => {
    movements.push({ id: `mov-${pad(seq++, 5)}`, ...m })
  }

  productsDb.forEach((p, i) => {
    const home = p.warehouseId
    const homeRef = { warehouseId: home, warehouseName: warehouseName(home) }
    const snapshot = { productId: p.id, sku: p.sku, name: p.name, primaryImage: p.primaryImage }
    const hasTransfer = i % 4 === 0

    const isDeadStock = i % 9 === 4

    const rnd = (k: number) => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453

      return x - Math.floor(x)
    }

    const dateAt = (offsetDays: number) =>
      new Date(ANCHOR - offsetDays * DAY + ((i * 5 + Math.round(offsetDays * 7)) % 24) * HOUR).toISOString()

    let lot = 0

    warehouseIds.forEach(warehouseId => {
      const qty = stockPlan.get(`${p.id}::${warehouseId}`) ?? 0

      if (qty <= 0) return

      const isHome = warehouseId === home

      push({
        date: dateAt(isHome ? OPENING_LOT_OFFSET : OPENING_LOT_OFFSET - Math.round(2 + rnd(200 + lot) * 6)),
        type: 'receipt',
        ...snapshot,
        warehouseId,
        warehouseName: warehouseName(warehouseId),
        quantity: qty,
        reference: `PO-${pad(800 + i * 3 + lot)}`,
        note: 'Opening stock'
      })

      lot++
    })

    const homeQty = stockPlan.get(`${p.id}::${home}`) ?? 0

    const waves = 2 + (i % 2)

    for (let k = 0; k < waves; k++) {
      const q = 4 + ((i + k * 3) % 8)

      const a = Math.round(5 + rnd(k * 2 + 1) * 50)
      const b = Math.round(5 + rnd(k * 2 + 2) * 50)
      const inOffset = Math.max(a, b)
      const outOffset = Math.min(a, b) === inOffset ? Math.max(3, inOffset - 2) : Math.min(a, b)

      const isTransferWave = hasTransfer && k === waves - 1 && homeQty >= q

      if (isTransferWave) {
        const sec = secondaryWarehouse(home)

        push({
          date: dateAt(outOffset),
          type: 'transfer',
          ...snapshot,
          ...homeRef,
          quantity: -q,
          reference: `TRF-${pad(700 + i)}`,
          note: `To ${warehouseName(sec)}`
        })
        push({
          date: dateAt(outOffset),
          type: 'transfer',
          ...snapshot,
          warehouseId: sec,
          warehouseName: warehouseName(sec),
          quantity: q,
          reference: `TRF-${pad(700 + i)}`,
          note: `From ${warehouseName(home)}`
        })

        continue
      }

      const isReturn = (i + k) % 5 === 0

      push({
        date: dateAt(inOffset),
        type: isReturn ? 'return' : 'receipt',
        ...snapshot,
        ...homeRef,
        quantity: q,
        reference: isReturn ? `RMA-${pad(500 + i * 3 + k)}` : `PO-${pad(1000 + i * 3 + k)}`,
        note: isReturn ? 'Customer return — restocked' : ''
      })

      const isAdjustmentWave = isDeadStock || (i + k) % 4 === 1

      if (isAdjustmentWave) {
        push({
          date: dateAt(outOffset),
          type: 'adjustment',
          ...snapshot,
          ...homeRef,
          quantity: -q,
          reference: `ADJ-${pad(300 + i * 3 + k)}`,
          note: 'Cycle count — damaged units written off'
        })
      } else {
        push({
          date: dateAt(outOffset),
          type: 'sale',
          ...snapshot,
          ...homeRef,
          quantity: -q,
          reference: `ORD-${pad(9000 + i * 3 + k)}`,
          note: ''
        })
      }
    }

    if (!isDeadStock) {
      const basis = p.onHand > 0 ? p.onHand : Math.max(p.reorderPoint, 10)
      const target = (CATEGORY_TURNOVER[p.category] ?? DEFAULT_TURNOVER) * (0.75 + rnd(900) * 0.5)
      const unitsOverSpan = Math.round(basis * target * (SALES_SPAN_DAYS / 365))

      for (let w = 0; w < SALES_WAVES; w++) {
        const saleOffset = Math.round(4 + (w / (SALES_WAVES - 1)) * (SALES_SPAN_DAYS - 8))
        const swell = 0.7 + rnd(400 + w) * 0.6
        const qty = Math.max(1, Math.round((unitsOverSpan / SALES_WAVES) * swell))

        push({
          date: dateAt(saleOffset + 3),
          type: 'receipt',
          ...snapshot,
          ...homeRef,
          quantity: qty,
          reference: `PO-${pad(4000 + i * 20 + w, 5)}`,
          note: 'Replenishment'
        })
        push({
          date: dateAt(saleOffset),
          type: 'sale',
          ...snapshot,
          ...homeRef,
          quantity: -qty,
          reference: `SO-${pad(20000 + i * 20 + w, 5)}`,
          note: ''
        })
      }
    }
  })

  return movements
}

const WAREHOUSE_STOCK_SHARE: Record<string, Record<string, number>> = {
  'wh-bronx': {
    'prod-001': 173,
    'prod-002': 143,
    'prod-003': 222,
    'prod-004': 117,
    'prod-005': 182,
    'prod-006': 197,
    'prod-008': 132,
    'prod-009': 232,
    'prod-010': 107,
    'prod-011': 162,
    'prod-012': 117,
    'prod-013': 112,
    'prod-014': 162,
    'prod-015': 242,
    'prod-016': 127,
    'prod-017': 152,
    'prod-018': 212,
    'prod-019': 202,
    'prod-020': 262,
    'prod-022': 172,
    'prod-023': 137,
    'prod-024': 122,
    'prod-026': 142,
    'prod-027': 82
  },
  'wh-newark': {
    'prod-001': 120,
    'prod-002': 110,
    'prod-003': 130,
    'prod-005': 100,
    'prod-006': 190,
    'prod-009': 115,
    'prod-011': 150,
    'prod-012': 120,
    'prod-014': 105,
    'prod-015': 160,
    'prod-016': 115,
    'prod-018': 220,
    'prod-019': 135,
    'prod-020': 150,
    'prod-022': 124,
    'prod-023': 109,
    'prod-024': 89,
    'prod-025': 139,
    'prod-026': 179
  },
  'wh-brooklyn': {
    'prod-001': 105,
    'prod-002': 145,
    'prod-003': 185,
    'prod-004': 130,
    'prod-005': 135,
    'prod-006': 175,
    'prod-008': 155,
    'prod-009': 140,
    'prod-011': 150,
    'prod-012': 155,
    'prod-013': 120,
    'prod-014': 124,
    'prod-015': 164,
    'prod-016': 124,
    'prod-018': 194,
    'prod-019': 154,
    'prod-020': 234,
    'prod-021': 164,
    'prod-022': 164,
    'prod-024': 154,
    'prod-025': 114
  },
  'wh-queens': {
    'prod-001': 63,
    'prod-003': 103,
    'prod-004': 153,
    'prod-006': 123,
    'prod-009': 83,
    'prod-010': 73,
    'prod-011': 98,
    'prod-015': 88,
    'prod-018': 133,
    'prod-019': 93,
    'prod-020': 283,
    'prod-021': 93,
    'prod-022': 103,
    'prod-024': 112,
    'prod-025': 77,
    'prod-026': 122
  }
}

const buildStockPlan = (): Map<string, number> => {
  const plan = new Map<string, number>()

  for (const product of productsDb) {
    if (product.onHand <= 0) continue

    const shares = Object.keys(WAREHOUSE_STOCK_SHARE)
      .map(warehouseId => [warehouseId, WAREHOUSE_STOCK_SHARE[warehouseId][product.id] ?? 0] as const)
      .filter(([, weight]) => weight > 0)

    if (shares.length === 0) {
      plan.set(`${product.id}::${product.warehouseId}`, product.onHand)
      continue
    }

    const totalWeight = shares.reduce((sum, [, weight]) => sum + weight, 0)
    let assigned = 0

    shares.forEach(([warehouseId, weight], index) => {
      const qty =
        index === shares.length - 1 ? product.onHand - assigned : Math.floor((product.onHand * weight) / totalWeight)

      assigned += qty

      if (qty > 0) plan.set(`${product.id}::${warehouseId}`, qty)
    })
  }

  return plan
}

export const db: StockMovement[] = buildMovements()
