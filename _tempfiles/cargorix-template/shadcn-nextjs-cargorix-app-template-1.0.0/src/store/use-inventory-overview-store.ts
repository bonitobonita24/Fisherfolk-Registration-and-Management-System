// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type {
  InventoryDateRange,
  InventoryKpiSummary,
  InventoryOverviewData
} from '@/types/dashboards/inventory-overview-types'

const DEFAULT_RANGE: InventoryDateRange = '30d'

const EMPTY_KPI_SUMMARY: InventoryKpiSummary = {
  totalSkus: { value: 0, warehouseCount: 0, addedInPeriod: 0 },
  inventoryValue: { value: '$0.0k', changePercent: 0, trend: 'up', sparkline: [] },
  lowStock: { count: 0, urgentCount: 0, utilizationPercent: 0 },
  outOfStock: { count: 0, revenueAtRisk: '$0' }
}

const EMPTY_DATA: InventoryOverviewData = {
  kpiSummaryByRange: { '7d': EMPTY_KPI_SUMMARY, '30d': EMPTY_KPI_SUMMARY, '6m': EMPTY_KPI_SUMMARY },
  turnoverByPeriod: { '30d': [], '90d': [], '12m': [] },
  turnoverStats: {
    averageTurnover: 0,
    averageChange: 0,
    bestCategory: { name: '—', turnover: 0 },
    slowestCategory: { name: '—', turnover: 0 }
  }
}

interface InventoryOverviewState {
  data: InventoryOverviewData
  selectedRange: InventoryDateRange

  initialize: (data: InventoryOverviewData) => void
  setRange: (range: InventoryDateRange) => void
}

export const useInventoryOverviewStore = create<InventoryOverviewState>()(set => ({
  data: EMPTY_DATA,
  selectedRange: DEFAULT_RANGE,

  initialize: data => set({ data }),
  setRange: range => set({ selectedRange: range })
}))
