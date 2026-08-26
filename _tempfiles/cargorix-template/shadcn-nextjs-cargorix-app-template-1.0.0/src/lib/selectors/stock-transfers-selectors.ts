// Type Imports
import type { ExportTable } from '@/types'
import type { StockTransfer, StockTransferStatus, StockTransferTotals } from '@/types/entities/stock-transfer'

// Util Imports
import { STOCK_TRANSFER_STATUS_LIST } from '@/types/entities/stock-transfer'
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

export const computeTransferTotals = (t: Pick<StockTransfer, 'lines'>): StockTransferTotals => {
  let totalUnitsSent = 0
  let totalReceived = 0

  for (const line of t.lines) {
    totalUnitsSent += line.quantitySent
    totalReceived += line.quantityReceived
  }

  return {
    totalLines: t.lines.length,
    totalUnitsSent,
    totalReceived,
    totalRemaining: Math.max(0, totalUnitsSent - totalReceived)
  }
}

export const getInboundUnitsByWarehouse = (
  transfers: StockTransfer[],
  excludeTransferId?: string
): Map<string, number> => {
  const inbound = new Map<string, number>()

  for (const t of transfers) {
    if (t.status !== 'in_transit' || t.id === excludeTransferId) continue

    const units = t.lines.reduce((sum, l) => sum + l.quantitySent, 0)

    inbound.set(t.destinationWarehouseId, (inbound.get(t.destinationWarehouseId) ?? 0) + units)
  }

  return inbound
}

export const getReservedByWarehouse = (transfers: StockTransfer[]): Map<string, number> => {
  const reserved = new Map<string, number>()

  for (const t of transfers) {
    if (t.status !== 'in_transit') continue

    for (const line of t.lines) {
      const key = `${line.productId}::${t.sourceWarehouseId}`

      reserved.set(key, (reserved.get(key) ?? 0) + line.quantitySent)
    }
  }

  return reserved
}

export const getAvailableAtSource = (
  balances: Map<string, number>,
  reserved: Map<string, number>,
  productId: string,
  warehouseId: string
): number => {
  const key = `${productId}::${warehouseId}`

  return Math.max(0, (balances.get(key) ?? 0) - (reserved.get(key) ?? 0))
}

const countByStatus = (transfers: StockTransfer[]): Record<StockTransferStatus, number> => {
  const counts = Object.fromEntries(STOCK_TRANSFER_STATUS_LIST.map(s => [s, 0])) as Record<StockTransferStatus, number>

  for (const t of transfers) counts[t.status] += 1

  return counts
}

export const getTransferKpis = (transfers: StockTransfer[]) => {
  const live = excludeUnsavedDrafts(transfers)
  const counts = countByStatus(live)

  return { total: live.length, draft: counts.draft, inTransit: counts.in_transit, completed: counts.completed }
}

export const getTransferSummary = (transfers: StockTransfer[]) => {
  let outgoing = 0
  let incoming = 0
  const products = new Set<string>()

  for (const t of excludeUnsavedDrafts(transfers)) {
    if (t.status === 'cancelled') continue

    for (const line of t.lines) {
      outgoing += line.quantitySent
      incoming += line.quantityReceived
      products.add(line.productId)
    }
  }

  return { totalQuantity: outgoing, outgoing, incoming, uniqueProducts: products.size }
}

export const nextTransferNumber = (transfers: StockTransfer[]): string => {
  let maxSeq = 0
  let year = 2026

  for (const t of transfers) {
    const match = /^TRF-(\d{4})-(\d+)$/.exec(t.number)

    if (!match) continue

    const seq = Number(match[2])

    if (seq > maxSeq) {
      maxSeq = seq
      year = Number(match[1])
    }
  }

  return `TRF-${year}-${`${maxSeq + 1}`.padStart(5, '0')}`
}

export const buildTransfersExport = (transfers: StockTransfer[]): ExportTable => {
  const headers = ['Transfer', 'From', 'To', 'Units', 'Requested by', 'Created', 'Status']

  const rows = transfers.map(t => [
    t.number,
    t.sourceWarehouseName,
    t.destinationWarehouseName,
    `${computeTransferTotals(t).totalUnitsSent}`,
    t.requestedBy,
    t.createdAt.slice(0, 10),
    t.status
  ])

  return { headers, rows }
}
