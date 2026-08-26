// Type Imports
import type { MovementType } from '@/types/entities/stock-movement'
import { MOVEMENT_TYPE_LIST } from '@/types/entities/stock-movement'

export const MOVEMENT_TYPE_BADGE: Record<MovementType, { label: string; className: string }> = {
  receipt: { label: 'Receipt', className: 'bg-success-soft text-success' },
  sale: { label: 'Sale', className: 'bg-destructive/10 text-destructive' },
  adjustment: { label: 'Adjustment', className: 'bg-warning-soft text-warning' },
  transfer: { label: 'Transfer', className: 'bg-info-soft text-info' },
  return: { label: 'Return', className: 'bg-teal-600/10 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400' }
}

export const MOVEMENT_TYPE_OPTIONS: { label: string; value: MovementType | 'all' }[] = [
  { label: 'All types', value: 'all' },
  ...MOVEMENT_TYPE_LIST.map(type => ({ label: MOVEMENT_TYPE_BADGE[type].label, value: type }))
]

export type DateRangeValue = 'all' | '7d' | '30d' | 'quarter'

export const DATE_RANGE_OPTIONS: { label: string; value: DateRangeValue }[] = [
  { label: 'All time', value: 'all' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This quarter', value: 'quarter' }
]
