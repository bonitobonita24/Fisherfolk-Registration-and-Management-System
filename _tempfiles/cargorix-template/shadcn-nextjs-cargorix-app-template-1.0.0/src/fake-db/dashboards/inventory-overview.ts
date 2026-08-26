// Type Imports
import type { InventoryKpiSummary, InventoryOverviewData } from '@/types/dashboards/inventory-overview-types'

// Data Imports
import { db as productsDb } from '@/fake-db/entities/products'
import { db as warehousesDb } from '@/fake-db/entities/warehouses'

// Util Imports
import {
  getLowStockProducts,
  getLowStockUtilizationPercent,
  getOutOfStockProducts,
  getRevenueAtRisk,
  getTotalInventoryValue
} from '@/lib/selectors/inventory-selectors'

const currentTotalSkus = productsDb.length
const currentWarehouseCount = warehousesDb.length
const currentLowStockCount = getLowStockProducts(productsDb).length
const currentOutOfStockCount = getOutOfStockProducts(productsDb).length
const currentInventoryValue = getTotalInventoryValue(productsDb)
const currentRevenueAtRisk = getRevenueAtRisk(productsDb)
const currentLowStockUtilization = getLowStockUtilizationPercent(productsDb)

const buildKpiSummary = (options: {
  addedInPeriod: number
  changePercent: number
  sparkline: number[]
  urgentCount: number
}): InventoryKpiSummary => ({
  totalSkus: {
    value: currentTotalSkus,
    warehouseCount: currentWarehouseCount,
    addedInPeriod: options.addedInPeriod
  },
  inventoryValue: {
    value: `$${(currentInventoryValue / 1000).toFixed(1)}k`,
    changePercent: options.changePercent,
    trend: 'up',
    sparkline: options.sparkline
  },
  lowStock: {
    count: currentLowStockCount,
    urgentCount: options.urgentCount,
    utilizationPercent: currentLowStockUtilization
  },
  outOfStock: {
    count: currentOutOfStockCount,
    revenueAtRisk: `$${currentRevenueAtRisk.toLocaleString()}`
  }
})

export const db: InventoryOverviewData = {
  kpiSummaryByRange: {
    '7d': buildKpiSummary({
      addedInPeriod: 1,
      changePercent: 2.7,
      sparkline: [24.9, 25.0, 25.1, 25.2, 25.3, 25.4, 25.6],
      urgentCount: 2
    }),
    '30d': buildKpiSummary({
      addedInPeriod: 3,
      changePercent: 15.7,
      sparkline: [22.1, 22.8, 23.4, 24.0, 24.6, 25.1, 25.6],
      urgentCount: 3
    }),
    '6m': buildKpiSummary({
      addedInPeriod: 6,
      changePercent: 47.0,
      sparkline: [17.4, 19.0, 20.5, 22.0, 23.2, 24.4, 25.6],
      urgentCount: 3
    })
  },
  turnoverByPeriod: {
    '30d': [
      { date: 'Jun 22', turnover: 4.1 },
      { date: 'Jun 27', turnover: 4.4 },
      { date: 'Jul 2', turnover: 4.9 },
      { date: 'Jul 7', turnover: 5.3 },
      { date: 'Jul 12', turnover: 5.6 },
      { date: 'Jul 17', turnover: 6.0 },
      { date: 'Today', turnover: 6.3 }
    ],
    '90d': [
      { date: 'Apr 22', turnover: 3.9 },
      { date: 'May 6', turnover: 4.3 },
      { date: 'May 20', turnover: 4.8 },
      { date: 'Jun 3', turnover: 5.1 },
      { date: 'Jun 17', turnover: 5.5 },
      { date: 'Today', turnover: 5.8 }
    ],
    '12m': [
      { date: 'Jan', turnover: 4.0 },
      { date: 'Feb', turnover: 4.2 },
      { date: 'Mar', turnover: 4.5 },
      { date: 'Apr', turnover: 4.3 },
      { date: 'May', turnover: 4.7 },
      { date: 'Jun', turnover: 5.0 },
      { date: 'Jul', turnover: 5.2 },
      { date: 'Aug', turnover: 5.4 },
      { date: 'Sep', turnover: 5.1 },
      { date: 'Oct', turnover: 5.6 },
      { date: 'Nov', turnover: 5.9 },
      { date: 'Dec', turnover: 6.1 }
    ]
  },
  turnoverStats: {
    averageTurnover: 5.8,
    averageChange: 0.7,
    bestCategory: { name: 'Electronics', turnover: 8.4 },
    slowestCategory: { name: 'Books', turnover: 2.3 }
  }
}
