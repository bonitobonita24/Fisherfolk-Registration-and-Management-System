// Type Imports
import type { OperationsOverviewData } from '@/types/dashboards/operations-overview-types'

export const db: OperationsOverviewData = {
  ordersTrend: [
    { date: 'Mon', orders: 142, delivered: 128 },
    { date: 'Tue', orders: 168, delivered: 151 },
    { date: 'Wed', orders: 155, delivered: 149 },
    { date: 'Thu', orders: 189, delivered: 162 },
    { date: 'Fri', orders: 204, delivered: 180 },
    { date: 'Sat', orders: 176, delivered: 171 },
    { date: 'Sun', orders: 132, delivered: 129 }
  ],
  deliveredChangePercent: 6.4,
  performanceChangePercent: -2.8
}
