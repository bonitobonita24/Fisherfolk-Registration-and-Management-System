// Type Imports
import type { Product, ProductLifecycleStatus, ProductStockStatus } from '@/types/entities/product'
import { PRODUCT_CATEGORY_LIST } from '@/types/entities/product'

import type { ProductDisplayStatus } from '@/lib/selectors/products-selectors'

export const PRODUCT_STOCK_STATUS_BADGE: Record<ProductStockStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success' },
  low_stock: { label: 'Low stock', className: 'bg-warning-soft text-warning' },
  out_of_stock: { label: 'Out of stock', className: 'bg-destructive/10 text-destructive' }
}

export const PRODUCT_LIFECYCLE_STATUS_BADGE: Record<ProductLifecycleStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-primary text-primary-foreground'
  },
  archived: { label: 'Archived', className: 'bg-destructive/10 text-destructive' }
}

export const PRODUCT_DISPLAY_STATUS_BADGE: Record<ProductDisplayStatus, { label: string; className: string }> = {
  ...PRODUCT_STOCK_STATUS_BADGE,
  draft: PRODUCT_LIFECYCLE_STATUS_BADGE.draft,
  scheduled: PRODUCT_LIFECYCLE_STATUS_BADGE.scheduled,
  archived: PRODUCT_LIFECYCLE_STATUS_BADGE.archived
}

export const PRODUCT_STOCK_STATUS_OPTIONS: { label: string; value: ProductDisplayStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Low stock', value: 'low_stock' },
  { label: 'Out of stock', value: 'out_of_stock' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Archived', value: 'archived' }
]

export const PRODUCT_CATEGORY_OPTIONS: { label: string; value: Product['category'] | 'all' }[] = [
  { label: 'All categories', value: 'all' },
  ...PRODUCT_CATEGORY_LIST.map(category => ({ label: category, value: category }))
]
