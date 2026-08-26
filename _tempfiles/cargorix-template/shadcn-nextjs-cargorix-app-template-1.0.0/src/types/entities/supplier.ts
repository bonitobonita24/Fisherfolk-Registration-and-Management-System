export type SupplierStatus = 'active' | 'limited' | 'inactive'
export const SUPPLIER_STATUS_LIST: SupplierStatus[] = ['active', 'limited', 'inactive']

export type SupplierCategory =
  | 'Electronics & Accessories'
  | 'Packaging & Labels'
  | 'Raw Materials'
  | 'Industrial Equipment'
  | 'Apparel & Textiles'
  | 'Logistics Services'
  | 'Office Supplies'
  | 'Chemicals'

export const SUPPLIER_CATEGORY_LIST: SupplierCategory[] = [
  'Electronics & Accessories',
  'Packaging & Labels',
  'Raw Materials',
  'Industrial Equipment',
  'Apparel & Textiles',
  'Logistics Services',
  'Office Supplies',
  'Chemicals'
]

export type SupplierIncoterms = 'EXW' | 'FOB' | 'CIF' | 'DDP' | 'DAP'
export const SUPPLIER_INCOTERMS_LIST: SupplierIncoterms[] = ['EXW', 'FOB', 'CIF', 'DDP', 'DAP']

export type SupplierDocType = 'pdf' | 'png' | 'jpg'

export interface SupplierDocument {
  id: string
  name: string
  type: SupplierDocType
  sizeLabel: string
  uploadedAt: string
  uploadedBy: string
}

export interface SupplierActivityEntry {
  id: string
  label: string
  at: string
  actor: string
  icon: 'file-text' | 'truck' | 'plus-square' | 'user'
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string

  isDraft?: boolean
  supplierCode?: string
  category?: SupplierCategory
  status?: SupplierStatus
  accountOwner?: string
  description?: string
  onboardedAt?: string
  lastUpdatedAt?: string
  lastUpdatedBy?: string

  contactJobTitle?: string

  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string

  paymentTerms?: string
  currency?: string
  leadTimeDays?: number
  minimumOrderValue?: number
  incoterms?: SupplierIncoterms
  priceValidityDays?: number

  productsSupplied?: string[]
  notes?: string
  documents?: SupplierDocument[]
  activity?: SupplierActivityEntry[]

  historicalPOs?: number
  historicalSpend?: number
}
