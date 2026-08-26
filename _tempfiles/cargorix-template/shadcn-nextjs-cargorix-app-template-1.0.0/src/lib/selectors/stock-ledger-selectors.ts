// Type Imports
import type { ExportTable } from '@/types'
import type { StockMovement, StockMovementRow } from '@/types/entities/stock-movement'
import type { DateRangeValue } from '@/views/stock-ledger/ledger-badges'

const DAY = 24 * 60 * 60 * 1000

export const computeLedgerRows = (movements: StockMovement[]): StockMovementRow[] => {
  const groups = new Map<string, StockMovement[]>()

  for (const m of movements) {
    const key = `${m.productId}::${m.warehouseId}`
    const list = groups.get(key)

    if (list) list.push(m)
    else groups.set(key, [m])
  }

  const rows: StockMovementRow[] = []

  for (const list of groups.values()) {
    const ascending = [...list].sort((a, b) => a.date.localeCompare(b.date))
    let balance = 0

    for (const m of ascending) {
      balance += m.quantity
      rows.push({ ...m, balance })
    }
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export const getLedgerKpis = (rows: StockMovementRow[]) => {
  let totalIn = 0
  let totalOut = 0

  for (const r of rows) {
    if (r.quantity > 0) totalIn += r.quantity
    else totalOut += -r.quantity
  }

  return { totalIn, totalOut, netChange: totalIn - totalOut, count: rows.length }
}

export const ledgerNow = (movements: StockMovement[]): number =>
  movements.reduce((max, m) => Math.max(max, new Date(m.date).getTime()), 0)

export const matchesDateRange = (dateIso: string, range: DateRangeValue, now: number): boolean => {
  if (range === 'all') return true

  const windowDays = range === '7d' ? 7 : range === '30d' ? 30 : 90

  return new Date(dateIso).getTime() >= now - windowDays * DAY
}

export const buildLedgerExport = (list: StockMovementRow[]): ExportTable => {
  const headers = ['Date', 'Product', 'SKU', 'Warehouse', 'Type', 'Reference', 'In', 'Out', 'Balance', 'Note']

  const rows = list.map(r => [
    new Date(r.date).toISOString(),
    r.name,
    r.sku,
    r.warehouseName,
    r.type,
    r.reference,
    r.quantity > 0 ? `${r.quantity}` : '',
    r.quantity < 0 ? `${-r.quantity}` : '',
    `${r.balance}`,
    r.note
  ])

  return { headers, rows }
}

export const getWarehouseBalances = (movements: StockMovement[]): Map<string, number> => {
  const balances = new Map<string, number>()

  for (const m of movements) {
    const key = `${m.productId}::${m.warehouseId}`

    balances.set(key, (balances.get(key) ?? 0) + m.quantity)
  }

  return balances
}
