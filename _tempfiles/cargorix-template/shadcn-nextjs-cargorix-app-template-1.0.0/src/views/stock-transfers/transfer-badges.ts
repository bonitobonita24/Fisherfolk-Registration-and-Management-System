// Type Imports
import type { StockTransferStatus } from '@/types/entities/stock-transfer'
import { STOCK_TRANSFER_STATUS_LIST } from '@/types/entities/stock-transfer'

export const TRANSFER_STATUS_BADGE: Record<StockTransferStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  in_transit: { label: 'In Transit', className: 'bg-info-soft text-info' },
  completed: {
    label: 'Completed',
    className: 'bg-success-soft text-success'
  },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive' }
}

export const TRANSFER_STATUS_OPTIONS: { label: string; value: StockTransferStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...STOCK_TRANSFER_STATUS_LIST.map(status => ({ label: TRANSFER_STATUS_BADGE[status].label, value: status }))
]
