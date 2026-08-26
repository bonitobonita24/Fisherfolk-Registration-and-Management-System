// Type Imports
import type { SupplierCategory, SupplierIncoterms, SupplierStatus } from '@/types/entities/supplier'
import { SUPPLIER_CATEGORY_LIST, SUPPLIER_STATUS_LIST } from '@/types/entities/supplier'

export const SUPPLIER_STATUS_BADGE: Record<SupplierStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Active', className: 'bg-success-soft text-success', dot: 'bg-success' },
  limited: { label: 'Limited', className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' }
}

export const SUPPLIER_STATUS_OPTIONS: { label: string; value: SupplierStatus | 'all' }[] = [
  { label: 'All statuses', value: 'all' },
  ...SUPPLIER_STATUS_LIST.map(status => ({ label: SUPPLIER_STATUS_BADGE[status].label, value: status }))
]

export const CATEGORY_OPTIONS: { label: string; value: SupplierCategory | 'all' }[] = [
  { label: 'All categories', value: 'all' },
  ...SUPPLIER_CATEGORY_LIST.map(category => ({ label: category, value: category }))
]

export const INCOTERMS_LABEL: Record<SupplierIncoterms, string> = {
  EXW: 'EXW — Ex Works',
  FOB: 'FOB — Free On Board',
  CIF: 'CIF — Cost, Insurance & Freight',
  DDP: 'DDP — Delivered Duty Paid',
  DAP: 'DAP — Delivered At Place'
}
