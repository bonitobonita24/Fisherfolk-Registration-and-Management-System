// Type Imports
import type { OrderKpiTrends } from '@/types/pages/orders-types'

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']

const toTrend = (values: number[]) => values.map((value, index) => ({ period: WEEKS[index], value }))

export const orderKpiTrends: OrderKpiTrends = {
  pendingReview: toTrend([3, 4, 3, 5, 4, 6, 5, 4, 6, 5, 3, 2]),
  readyForShipment: toTrend([1, 2, 2, 3, 2, 4, 3, 5, 4, 3, 3, 2]),
  inFulfilment: toTrend([2, 3, 4, 3, 5, 4, 6, 5, 4, 5, 4, 3]),
  completed: toTrend([4, 3, 5, 6, 5, 7, 6, 8, 7, 6, 4, 2])
}
