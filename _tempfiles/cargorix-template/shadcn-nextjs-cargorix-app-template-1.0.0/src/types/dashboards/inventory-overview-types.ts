// Type Imports
import type { ProductCategory } from '@/types/entities/product'

export type InventoryDateRange = '7d' | '30d' | '6m'

export const INVENTORY_DATE_RANGE_LIST: InventoryDateRange[] = ['7d', '30d', '6m']

export const INVENTORY_DATE_RANGE_LABELS: Record<InventoryDateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '6m': 'Last 6 months'
}

export const INVENTORY_COMPARISON_LABELS: Record<InventoryDateRange, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '6m': '6 months'
}

export type TurnoverPeriod = '30d' | '90d' | '12m'

export const TURNOVER_PERIOD_LIST: TurnoverPeriod[] = ['30d', '90d', '12m']

export const TURNOVER_PERIOD_LABELS: Record<TurnoverPeriod, string> = {
  '30d': '30D',
  '90d': '90D',
  '12m': '12M'
}

export type CategoryStockStatus = 'healthy' | 'stable' | 'watch' | 'low' | 'critical'

export const CATEGORY_STATUS_CONFIG: Record<CategoryStockStatus, { label: string; textClassName: string }> = {
  healthy: {
    label: 'Healthy',
    textClassName: 'text-success bg-success-soft'
  },
  stable: {
    label: 'Stable',
    textClassName: 'text-slate-600 bg-slate-600/10 dark:text-slate-400 dark:bg-slate-400/10'
  },
  watch: {
    label: 'Watch',
    textClassName: 'text-warning bg-warning-soft'
  },
  low: {
    label: 'Low',
    textClassName: 'text-warning bg-warning-soft'
  },
  critical: {
    label: 'Critical',
    textClassName: 'text-destructive bg-destructive/10'
  }
}

export interface InventoryKpiSummary {
  totalSkus: {
    value: number
    warehouseCount: number
    addedInPeriod: number
  }
  inventoryValue: {
    value: string
    changePercent: number
    trend: 'up' | 'down'
    sparkline: number[]
  }
  lowStock: {
    count: number
    urgentCount: number
    utilizationPercent: number
  }
  outOfStock: {
    count: number
    revenueAtRisk: string
  }
}

export interface InventoryTurnoverPoint {
  date: string
  turnover: number
}

export interface TurnoverStats {
  averageTurnover: number
  averageChange: number
  bestCategory: {
    name: string
    turnover: number
  }
  slowestCategory: {
    name: string
    turnover: number
  }
}

export type CategoryIconName = 'laptop' | 'shirt' | 'dumbbell' | 'sprout' | 'book-open' | 'package'

export const CATEGORY_ICON_MAP: Record<ProductCategory, CategoryIconName> = {
  Electronics: 'laptop',
  Clothing: 'shirt',
  Sports: 'dumbbell',
  'Home & Garden': 'sprout',
  Books: 'book-open',
  'Packaging Supplies': 'package'
}

export interface CategoryStockHealth {
  id: string
  name: string
  icon: CategoryIconName
  skuCount: number
  value: string
  utilizationPercent: number
  status: CategoryStockStatus
}

export type InventoryActivityKind = 'receipt' | 'transfer' | 'adjustment' | 'reorder'

export const INVENTORY_ACTIVITY_CONFIG: Record<InventoryActivityKind, { label: string; iconClassName: string }> = {
  receipt: {
    label: 'Receipt',
    iconClassName: 'text-success bg-success-soft'
  },
  transfer: {
    label: 'Transfer',
    iconClassName: 'text-info bg-info-soft'
  },
  adjustment: {
    label: 'Adjustment',
    iconClassName: 'text-warning bg-warning-soft'
  },
  reorder: {
    label: 'Reorder alert',
    iconClassName: 'text-destructive bg-destructive/10'
  }
}

export interface InventoryActivityItem {
  id: string
  kind: InventoryActivityKind
  title: string
  description: string
  warehouse: string
  timeAgo: string
}

export interface InventoryOverviewData {
  kpiSummaryByRange: Record<InventoryDateRange, InventoryKpiSummary>
  turnoverByPeriod: Record<TurnoverPeriod, InventoryTurnoverPoint[]>
  turnoverStats: TurnoverStats
}
