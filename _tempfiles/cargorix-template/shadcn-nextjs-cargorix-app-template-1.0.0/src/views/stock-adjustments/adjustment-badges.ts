// Type Imports
import type { StockAdjustmentReason, StockAdjustmentStatus } from '@/types/entities/stock-adjustment'
import { STOCK_ADJUSTMENT_REASON_LIST, STOCK_ADJUSTMENT_STATUS_LIST } from '@/types/entities/stock-adjustment'

export const ADJUSTMENT_STATUS_BADGE: Record<StockAdjustmentStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  posted: {
    label: 'Posted',
    className: 'bg-success-soft text-success'
  },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' }
}

export const ADJUSTMENT_STATUS_OPTIONS: { label: string; value: StockAdjustmentStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...STOCK_ADJUSTMENT_STATUS_LIST.map(status => ({ label: ADJUSTMENT_STATUS_BADGE[status].label, value: status }))
]

export const ADJUSTMENT_REASON_LABEL: Record<StockAdjustmentReason, string> = {
  cycle_count: 'Cycle count',
  damage: 'Damage',
  write_off: 'Write-off',
  found: 'Found',
  return_to_stock: 'Return to stock',
  correction: 'Correction'
}

export const ADJUSTMENT_REASON_BADGE: Record<StockAdjustmentReason, { label: string; className: string }> = {
  cycle_count: {
    label: ADJUSTMENT_REASON_LABEL.cycle_count,
    className: 'bg-muted text-muted-foreground'
  },
  damage: {
    label: ADJUSTMENT_REASON_LABEL.damage,
    className: 'bg-destructive/10 text-destructive'
  },
  write_off: {
    label: ADJUSTMENT_REASON_LABEL.write_off,
    className: 'bg-warning-soft text-warning'
  },
  found: {
    label: ADJUSTMENT_REASON_LABEL.found,
    className: 'bg-teal-600/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400'
  },
  return_to_stock: {
    label: ADJUSTMENT_REASON_LABEL.return_to_stock,
    className: 'bg-success-soft text-success'
  },
  correction: {
    label: ADJUSTMENT_REASON_LABEL.correction,
    className: 'bg-slate-600/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400'
  }
}

export const ADJUSTMENT_REASON_OPTIONS: { label: string; value: StockAdjustmentReason | 'all' }[] = [
  { label: 'All reasons', value: 'all' },
  ...STOCK_ADJUSTMENT_REASON_LIST.map(reason => ({ label: ADJUSTMENT_REASON_LABEL[reason], value: reason }))
]
