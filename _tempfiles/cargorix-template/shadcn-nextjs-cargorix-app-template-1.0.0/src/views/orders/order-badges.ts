// Type Imports
import type { Order } from '@/types/entities/order'

export const ORDER_SOURCE_BADGE: Record<Order['source'], { label: string; className: string }> = {
  manual: { label: 'Manual', className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400' },
  api: { label: 'API', className: 'bg-info-soft text-info' },
  portal: { label: 'Portal', className: 'bg-success-soft text-success' },
  csv: { label: 'CSV', className: 'bg-cyan-600/10 text-cyan-600 dark:bg-cyan-400/10 dark:text-cyan-400' }
}

export const ORDER_STATUS_OPTIONS: { label: string; value: Order['status'] | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending review', value: 'pending_review' },
  { label: 'Order received', value: 'order_received' },
  { label: 'Ready for shipment', value: 'ready_for_shipment' },
  { label: 'In fulfilment', value: 'in_fulfilment' },
  { label: 'On hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

export const ORDER_STATUS_BADGE: Record<Order['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_review: {
    label: 'Pending review',
    className: 'bg-warning-soft text-warning'
  },
  order_received: {
    label: 'Order received',
    className: 'bg-info-soft text-info'
  },
  ready_for_shipment: {
    label: 'Ready for shipment',
    className: 'bg-primary text-primary-foreground'
  },
  in_fulfilment: {
    label: 'In fulfilment',
    className: 'bg-info-soft text-info'
  },
  on_hold: { label: 'On hold', className: 'bg-warning-soft text-warning' },
  completed: {
    label: 'Completed',
    className: 'bg-success-soft text-success'
  },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' }
}
