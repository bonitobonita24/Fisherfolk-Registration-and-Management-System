// Type Imports
import type { ExportTable } from '@/types'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Util Imports
import { computePurchaseOrderTotals } from '@/lib/selectors/purchase-orders-selectors'

export interface SupplierRollup {
  openPOs: number
  poCount: number
  totalPurchased: number
}

export interface SuppliersSummary {
  totalSuppliers: number
  activeSuppliers: number
  openPOs: number
  totalPurchased: number
}

export interface SupplierReadinessItem {
  label: string
  caption: string
  passed: boolean
}

const OPEN_PO_STATUSES: PurchaseOrderStatus[] = ['confirmed', 'in_transit', 'partially_received']

export const getSupplierPurchaseOrders = (pos: PurchaseOrder[], supplierId: string): PurchaseOrder[] =>
  pos
    .filter(po => po.supplierId === supplierId)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.number.localeCompare(a.number))

export const getSupplierRollup = (supplier: Supplier, pos: PurchaseOrder[]): SupplierRollup => {
  const supplierPos = getSupplierPurchaseOrders(pos, supplier.id)
  const billable = supplierPos.filter(po => po.status !== 'cancelled' && po.status !== 'draft')

  return {
    openPOs: supplierPos.filter(po => OPEN_PO_STATUSES.includes(po.status)).length,
    poCount: (supplier.historicalPOs ?? 0) + billable.length,
    totalPurchased:
      (supplier.historicalSpend ?? 0) + billable.reduce((sum, po) => sum + computePurchaseOrderTotals(po).grandTotal, 0)
  }
}

export const getSuppliersSummary = (suppliers: Supplier[], pos: PurchaseOrder[]): SuppliersSummary => {
  const live = suppliers.filter(supplier => !supplier.isDraft)

  return {
    totalSuppliers: live.length,
    activeSuppliers: live.filter(supplier => supplier.status === 'active').length,
    openPOs: live.reduce((sum, supplier) => sum + getSupplierRollup(supplier, pos).openPOs, 0),
    totalPurchased: live.reduce((sum, supplier) => sum + getSupplierRollup(supplier, pos).totalPurchased, 0)
  }
}

export const buildSuppliersExport = (suppliers: Supplier[], pos: PurchaseOrder[]): ExportTable => {
  const headers = [
    'Supplier',
    'Code',
    'Contact',
    'Email',
    'Phone',
    'Location',
    'Country',
    'Status',
    'Open POs',
    'Products supplied',
    'Lead time (days)',
    'Total purchased',
    'Category'
  ]

  const rows = suppliers.map(supplier => {
    const rollup = getSupplierRollup(supplier, pos)

    return [
      supplier.name,
      supplier.supplierCode ?? '',
      supplier.contactPerson,
      supplier.email,
      supplier.phone,
      [supplier.city, supplier.state].filter(Boolean).join(', '),
      supplier.country ?? '',
      supplier.status ?? 'inactive',
      `${rollup.openPOs}`,
      (supplier.productsSupplied ?? []).join(', '),
      supplier.leadTimeDays != null ? `${supplier.leadTimeDays}` : '',
      rollup.totalPurchased.toFixed(2),
      supplier.category ?? ''
    ]
  })

  return { headers, rows }
}

export const getSupplierReadiness = (
  draft: Partial<Supplier>,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mode: 'add' | 'edit'
): SupplierReadinessItem[] => [
  {
    label: 'Supplier Information',
    caption: 'Add basic supplier details and status',
    passed: Boolean(draft.name && draft.supplierCode && draft.category && draft.status)
  },
  {
    label: 'Primary Contact',
    caption: 'Provide primary contact person details',
    passed: Boolean(draft.contactPerson && draft.email && draft.phone)
  },
  {
    label: 'Address',
    caption: 'Add complete business address',
    passed: Boolean(draft.addressLine1 && draft.city && draft.postalCode && draft.country)
  },
  {
    label: 'Procurement & Terms',
    caption: 'Define procurement terms and conditions',

    passed:
      Boolean(draft.paymentTerms && draft.currency) && draft.leadTimeDays != null && draft.minimumOrderValue != null
  },
  {
    label: 'Additional Information',
    caption: 'Add products supplied and notes',
    passed: Boolean(draft.productsSupplied?.length)
  },
  {
    label: 'Supporting Documents',
    caption: 'Upload required supporting documents',
    passed: Boolean(draft.documents?.length)
  }
]
