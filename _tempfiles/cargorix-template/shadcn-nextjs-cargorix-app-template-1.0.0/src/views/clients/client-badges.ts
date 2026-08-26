// Type Imports
import type { ClientAccountType, ClientStatus, PaymentTerms } from '@/types/entities/client'
import { CLIENT_STATUS_LIST } from '@/types/entities/client'

export const CLIENT_STATUS_BADGE: Record<ClientStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success', dot: 'bg-success' },
  on_hold: { label: 'On Hold', className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
}

export const CLIENT_STATUS_OPTIONS: { label: string; value: ClientStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...CLIENT_STATUS_LIST.map(status => ({ label: CLIENT_STATUS_BADGE[status].label, value: status }))
]

export const PAYMENT_TERMS_LABEL: Record<PaymentTerms, string> = {
  prepaid: 'Prepaid',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60'
}

export const ACCOUNT_TYPE_LABEL: Record<ClientAccountType, string> = {
  standard: 'Standard',
  key: 'Key Account',
  enterprise: 'Enterprise'
}

export const INDUSTRY_OPTIONS = [
  'Apparel',
  'Automotive',
  'Beauty',
  'Beverages',
  'Cosmetics',
  'Electronics',
  'Fashion',
  'Florist',
  'Food',
  'Food Distribution',
  'Furniture',
  'Grocery',
  'Hardware',
  'Home Decor',
  'Industrial',
  'Jewelry',
  'Paper Goods',
  'Pharmaceuticals',
  'Publishing',
  'Retail',
  'Sporting Goods',
  'Textiles',
  'Toys',
  'Wholesale'
]

export const PREFERRED_SERVICES = [
  'Freight Shipping',
  'Warehousing',
  'Distribution',
  'Customs Brokerage',
  'Order Fulfillment',
  'Returns Management',
  'Consulting'
]
