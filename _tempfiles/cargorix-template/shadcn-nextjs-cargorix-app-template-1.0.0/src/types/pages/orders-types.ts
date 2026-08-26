export type OrderKpiKey = 'pendingReview' | 'readyForShipment' | 'inFulfilment' | 'completed'

export interface OrderKpiTrendPoint {
  period: string
  value: number
}

export type OrderKpiTrends = Record<OrderKpiKey, OrderKpiTrendPoint[]>
