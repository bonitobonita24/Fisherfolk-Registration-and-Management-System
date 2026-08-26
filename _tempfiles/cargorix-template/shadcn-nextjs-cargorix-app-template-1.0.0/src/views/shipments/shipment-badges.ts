// Type Imports
import type { Shipment } from '@/types/entities/shipment'

export const SHIPMENT_STATUS_OPTIONS: { label: string; value: Shipment['status'] | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In transit', value: 'in_transit' },
  { label: 'Out for delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Returned', value: 'returned' }
]

export const SHIPMENT_STATUS_BADGE: Record<Shipment['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', className: 'bg-primary text-primary-foreground' },
  in_transit: { label: 'In transit', className: 'bg-primary text-primary-foreground' },
  out_for_delivery: { label: 'Out for delivery', className: 'bg-primary text-primary-foreground' },
  delivered: {
    label: 'Delivered',
    className: 'bg-success-soft text-success'
  },
  returned: { label: 'Returned', className: 'bg-muted text-muted-foreground' }
}
