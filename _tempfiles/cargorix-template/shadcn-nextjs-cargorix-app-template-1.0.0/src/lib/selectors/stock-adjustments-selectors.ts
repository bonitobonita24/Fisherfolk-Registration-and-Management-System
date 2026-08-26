// Type Imports
import type { ExportTable } from '@/types'
import type { StockAdjustment, StockAdjustmentStatus, StockAdjustmentTotals } from '@/types/entities/stock-adjustment'

// Util Imports
import { STOCK_ADJUSTMENT_STATUS_LIST } from '@/types/entities/stock-adjustment'
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

export const computeAdjustmentTotals = (a: Pick<StockAdjustment, 'lines'>): StockAdjustmentTotals => {
  let totalAdded = 0
  let totalRemoved = 0

  for (const line of a.lines) {
    if (line.adjustmentQty > 0) totalAdded += line.adjustmentQty
    else totalRemoved += -line.adjustmentQty
  }

  return { lineCount: a.lines.length, totalAdded, totalRemoved, netChange: totalAdded - totalRemoved }
}

const countByStatus = (list: StockAdjustment[]): Record<StockAdjustmentStatus, number> => {
  const counts = Object.fromEntries(STOCK_ADJUSTMENT_STATUS_LIST.map(s => [s, 0])) as Record<
    StockAdjustmentStatus,
    number
  >

  for (const a of list) counts[a.status] += 1

  return counts
}

export const getAdjustmentKpis = (list: StockAdjustment[]) => {
  const live = excludeUnsavedDrafts(list)
  const counts = countByStatus(live)
  let netUnits = 0

  for (const a of live) if (a.status === 'posted') netUnits += computeAdjustmentTotals(a).netChange

  return { total: live.length, draft: counts.draft, posted: counts.posted, netUnits }
}

export const nextAdjustmentNumber = (list: StockAdjustment[]): string => {
  let maxSeq = 0
  let year = 2026

  for (const a of list) {
    const match = /^ADJ-(\d{4})-(\d+)$/.exec(a.number)

    if (!match) continue

    const seq = Number(match[2])

    if (seq > maxSeq) {
      maxSeq = seq
      year = Number(match[1])
    }
  }

  return `ADJ-${year}-${`${maxSeq + 1}`.padStart(5, '0')}`
}

export const buildAdjustmentsExport = (list: StockAdjustment[]): ExportTable => {
  const headers = ['Adjustment', 'Warehouse', 'Reason', 'Lines', 'Net change', 'Requested by', 'Created', 'Status']

  const rows = list.map(a => {
    const totals = computeAdjustmentTotals(a)

    return [
      a.number,
      a.warehouseName,
      a.reason,
      `${totals.lineCount}`,
      `${totals.netChange}`,
      a.requestedBy,
      a.createdAt.slice(0, 10),
      a.status
    ]
  })

  return { headers, rows }
}
