export type ProductCategory = 'Electronics' | 'Clothing' | 'Sports' | 'Home & Garden' | 'Books' | 'Packaging Supplies'

export const PRODUCT_CATEGORY_LIST: ProductCategory[] = [
  'Electronics',
  'Clothing',
  'Sports',
  'Home & Garden',
  'Books',
  'Packaging Supplies'
]

export type ProductLifecycleStatus = 'active' | 'draft' | 'scheduled' | 'archived'

export type ProductVisibility = 'visible' | 'hidden'

export type ProductUnit = 'each' | 'kg' | 'box' | 'pallet'

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  onHand: number
  reserved: number
}

export interface ProductSpec {
  label: string
  value: string
}

export interface ProductSalesTrendPoint {
  date: string
  sold: number
  revenue: number
}

export interface Product {
  isDraft?: boolean
  id: string
  sku: string
  name: string
  slug: string
  category: ProductCategory
  categoryPath: string[]
  productType: string
  brand: string
  barcode: string
  shortDescription: string
  description: string
  tags: string[]
  status: ProductLifecycleStatus
  visibility: ProductVisibility
  featured: boolean

  warehouseId: string
  unitCost: number
  onHand: number
  reserved: number
  incoming: number
  outgoing: number
  reorderPoint: number
  reorderQuantity: number
  unit: ProductUnit
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  trackInventory: boolean

  price: number
  compareAtPrice: number | null
  currency: string
  taxClass: string

  primaryImage: string
  galleryImages: string[]
  videoUrl: string | null

  collections: string[]
  salesChannels: string[]
  variants: ProductVariant[]
  salesTrend: ProductSalesTrendPoint[]
  keySpecs: ProductSpec[]

  createdAt: string
  updatedAt: string
}

export type StockAlertSeverity = 'out' | 'low'

export interface ProductStockAlert {
  id: string
  productName: string
  sku: string
  warehouse: string
  stock: number
  reorderPoint: number
  severity: StockAlertSeverity
  stockLabel: string
  reorderQuantity: number
}

export type ProductStockStatus = 'active' | 'low_stock' | 'out_of_stock'
