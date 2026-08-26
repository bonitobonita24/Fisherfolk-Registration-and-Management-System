// Type Imports
import type { ExportTable } from '@/types'
import type { Product, ProductLifecycleStatus, ProductStockStatus } from '@/types/entities/product'
import type { StockMovement, StockMovementRow } from '@/types/entities/stock-movement'

// Util Imports
import { getProductStockStatus } from './inventory-selectors'
import { computeLedgerRows } from './stock-ledger-selectors'

export type ProductDisplayStatus = ProductStockStatus | Exclude<ProductLifecycleStatus, 'active'>

export const getProductDisplayStatus = (product: Product): ProductDisplayStatus =>
  product.status === 'active' ? getProductStockStatus(product) : product.status

export const computeAvailableStock = (onHand: number, reserved: number) => Math.max(0, onHand - reserved)

export const computeProductAvailable = (product: Product) => computeAvailableStock(product.onHand, product.reserved)

export const computeMargin = (price: number, cost: number) => price - cost

export const computeMarginPercent = (price: number, cost: number) => {
  if (price === 0) return 0

  return Math.round(((price - cost) / price) * 1000) / 10
}

export const getProductActivity = (productId: string, movements: StockMovement[], limit = 5): StockMovementRow[] =>
  computeLedgerRows(movements.filter(m => m.productId === productId)).slice(0, limit)

export interface ProductWarehouseInventory {
  warehouseId: string
  warehouseName: string
  onHand: number
  reserved: number
  available: number
  reorderPoint: number
}

export const getProductWarehouseInventory = (
  product: Product,
  movements: StockMovement[]
): ProductWarehouseInventory[] => {
  const balances = new Map<string, { name: string; onHand: number }>()

  for (const m of movements) {
    if (m.productId !== product.id) continue
    const entry = balances.get(m.warehouseId) ?? { name: m.warehouseName, onHand: 0 }

    entry.onHand += m.quantity
    balances.set(m.warehouseId, entry)
  }

  const rows = [...balances.entries()]
    .map(([warehouseId, entry]) => ({ warehouseId, warehouseName: entry.name, onHand: entry.onHand }))
    .filter(row => row.onHand > 0)
    .sort((a, b) => b.onHand - a.onHand)

  if (rows.length === 0) return []

  const totalOnHand = rows.reduce((sum, row) => sum + row.onHand, 0)
  const reserved = rows.map(row => Math.round((product.reserved * row.onHand) / totalOnHand))

  reserved[0] += product.reserved - reserved.reduce((sum, value) => sum + value, 0)

  return rows.map((row, index) => ({
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName,
    onHand: row.onHand,
    reserved: reserved[index],
    available: Math.max(0, row.onHand - reserved[index]),
    reorderPoint: product.reorderPoint
  }))
}

export const generateDuplicateSku = (sku: string, existingSkus: string[]) => {
  let attempt = `${sku}-COPY`
  let suffix = 2

  while (existingSkus.includes(attempt)) {
    attempt = `${sku}-COPY-${suffix}`
    suffix += 1
  }

  return attempt
}

const PRODUCTS_CSV_HEADER = ['SKU', 'Product', 'Category', 'On hand', 'Reserved', 'Available', 'Price', 'Status']

export const buildProductsExport = (products: Product[], getStatusLabel: (product: Product) => string): ExportTable => {
  const rows = products.map(product => [
    product.sku,
    product.name,
    product.category,
    String(product.onHand),
    String(product.reserved),
    String(computeProductAvailable(product)),
    product.price.toFixed(2),
    getStatusLabel(product)
  ])

  return { headers: [...PRODUCTS_CSV_HEADER], rows }
}
