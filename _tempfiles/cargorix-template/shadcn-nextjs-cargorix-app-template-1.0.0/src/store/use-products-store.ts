// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Product } from '@/types/entities/product'

// Util Imports
import { generateDuplicateSku } from '@/lib/selectors/products-selectors'

const buildEmptyProduct = (id: string): Product => ({
  isDraft: true,
  id,
  sku: '',
  name: '',
  slug: '',
  category: 'Electronics',
  categoryPath: ['Electronics'],
  productType: 'Physical',
  brand: '',
  barcode: '',
  shortDescription: '',
  description: '',
  tags: [],
  status: 'draft',
  visibility: 'visible',
  featured: false,
  warehouseId: '',
  unitCost: 0,
  onHand: 0,
  reserved: 0,
  incoming: 0,
  outgoing: 0,
  reorderPoint: 0,
  reorderQuantity: 0,
  unit: 'each',
  weightKg: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  trackInventory: true,
  price: 0,
  compareAtPrice: null,
  currency: 'USD',
  taxClass: 'Standard Tax Rate',
  primaryImage: '',
  galleryImages: [],
  videoUrl: null,
  collections: [],
  salesChannels: ['Online Store'],
  variants: [],
  salesTrend: [],
  keySpecs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

interface ProductsState {
  products: Product[]

  initialize: (products: Product[]) => void
  createDraftProduct: (id: string) => void
  getProduct: (id: string) => Product | undefined
  updateProduct: (id: string, updates: Partial<Product>) => void
  commitProduct: (id: string, updates: Partial<Product>) => void
  duplicateProduct: (id: string) => string
  archiveProduct: (id: string) => void
  restoreProduct: (id: string) => void
  adjustStock: (id: string, delta: number) => void
  receiveStock: (productId: string, qty: number) => void
}

export const useProductsStore = create<ProductsState>()((set, get) => ({
  products: [],

  initialize: products => {
    if (get().products.length > 0) return
    set({ products })
  },

  createDraftProduct: id => {
    if (get().products.some(p => p.id === id)) return
    set(state => ({ products: [buildEmptyProduct(id), ...state.products] }))
  },

  getProduct: id => get().products.find(p => p.id === id),

  updateProduct: (id, updates) =>
    set(state => ({
      products: state.products.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    })),

  commitProduct: (id, updates) => get().updateProduct(id, { ...updates, isDraft: false }),

  duplicateProduct: id => {
    const source = get().getProduct(id)

    if (!source) return ''

    const newId = crypto.randomUUID()
    const existingSkus = get().products.map(p => p.sku)

    const duplicate: Product = {
      ...source,
      isDraft: false,
      id: newId,
      sku: generateDuplicateSku(source.sku, existingSkus),
      name: `${source.name} (Copy)`,
      status: 'draft',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    set(state => ({ products: [duplicate, ...state.products] }))

    return newId
  },

  archiveProduct: id => get().updateProduct(id, { status: 'archived' }),

  restoreProduct: id => get().updateProduct(id, { status: 'active' }),

  adjustStock: (id, delta) => {
    const product = get().getProduct(id)

    if (!product) return

    get().updateProduct(id, { onHand: Math.max(0, product.onHand + delta) })
  },

  receiveStock: (productId, qty) => {
    const product = get().getProduct(productId)

    if (!product || qty <= 0) return

    get().updateProduct(productId, { onHand: product.onHand + qty })
  }
}))
