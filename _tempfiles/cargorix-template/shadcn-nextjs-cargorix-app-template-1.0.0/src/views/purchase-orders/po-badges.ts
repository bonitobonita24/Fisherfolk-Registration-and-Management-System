// Type Imports
import type { PurchaseOrderStatus } from '@/types/entities/purchase-order'
import { PURCHASE_ORDER_STATUS_LIST } from '@/types/entities/purchase-order'

export const PO_STATUS_BADGE: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-accent text-accent-foreground' },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary text-primary-foreground'
  },
  in_transit: { label: 'In Transit', className: 'bg-info-soft text-info' },
  partially_received: {
    label: 'Partially Received',
    className: 'bg-warning-soft text-warning'
  },
  received: {
    label: 'Received',
    className: 'bg-success-soft text-success'
  },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' }
}

export const PO_STATUS_OPTIONS: { label: string; value: PurchaseOrderStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...PURCHASE_ORDER_STATUS_LIST.map(status => ({ label: PO_STATUS_BADGE[status].label, value: status }))
]
