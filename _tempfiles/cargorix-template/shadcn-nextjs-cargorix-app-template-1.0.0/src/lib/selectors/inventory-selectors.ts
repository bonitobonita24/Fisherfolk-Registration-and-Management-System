// Type Imports
import type { Product, ProductStockStatus } from '@/types/entities/product'
import type { ProductStockAlert } from '@/types/entities/product'
import type { MovementType, StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse, WarehouseHealthStatus, WarehouseStockSummary } from '@/types/entities/warehouse'
import type {
  CategoryStockHealth,
  CategoryStockStatus,
  InventoryActivityItem
} from '@/types/dashboards/inventory-overview-types'
import { CATEGORY_ICON_MAP } from '@/types/dashboards/inventory-overview-types'

// Util Imports
import { getWarehouseBalances, ledgerNow } from '@/lib/selectors/stock-ledger-selectors'
import { getWarehouseUtilization } from '@/lib/selectors/warehouse-selectors'
import { excludeDrafts } from '@/lib/exclude-drafts'

const HOUR = 60 * 60 * 1000

const formatCurrency = (value: number) => `$${(value / 1000).toFixed(1)}k`

export const getLowStockProducts = (products: Product[]) =>
  excludeDrafts(products).filter(p => p.onHand > 0 && p.onHand <= p.reorderPoint)

export const getOutOfStockProducts = (products: Product[]) => excludeDrafts(products).filter(p => p.onHand === 0)

export const getProductStockStatus = (product: Product): ProductStockStatus => {
  if (product.onHand === 0) return 'out_of_stock'
  if (product.onHand <= product.reorderPoint) return 'low_stock'

  return 'active'
}

export const getReorderAlerts = (products: Product[], warehouses: Warehouse[], limit?: number): ProductStockAlert[] => {
  const warehouseNameById = new Map(warehouses.map(warehouse => [warehouse.id, warehouse.name]))

  const alerts = excludeDrafts(products)
    .filter(p => p.onHand <= p.reorderPoint)
    .sort((a, b) => a.onHand - b.onHand)
    .map(p => ({
      id: p.id,
      productName: p.name,
      sku: p.sku,
      warehouse: warehouseNameById.get(p.warehouseId) ?? 'Unknown',
      stock: p.onHand,
      reorderPoint: p.reorderPoint,
      severity: p.onHand === 0 ? ('out' as const) : ('low' as const),
      stockLabel: p.onHand === 0 ? 'Out' : `${p.onHand} left`,
      reorderQuantity: p.reorderPoint * 2 - p.onHand
    }))

  return typeof limit === 'number' ? alerts.slice(0, limit) : alerts
}

export const getRevenueAtRisk = (products: Product[]) =>
  getOutOfStockProducts(products).reduce((sum, p) => sum + p.reorderPoint * p.unitCost, 0)

export const getLowStockUtilizationPercent = (products: Product[]) => {
  const lowStock = getLowStockProducts(products)

  if (lowStock.length === 0) return 100

  const average = lowStock.reduce((sum, p) => sum + (p.onHand / p.reorderPoint) * 100, 0) / lowStock.length

  return Math.round(average)
}

export const getTotalInventoryValue = (products: Product[]) =>
  excludeDrafts(products).reduce((sum, p) => sum + p.onHand * p.unitCost, 0)

export const getCategoryHealth = (products: Product[]): CategoryStockHealth[] => {
  const categories = new Map<string, Product[]>()

  for (const product of excludeDrafts(products)) {
    const existing = categories.get(product.category) ?? []

    categories.set(product.category, [...existing, product])
  }

  return Array.from(categories.entries()).map(([category, items]) => {
    const outOfStockCount = getOutOfStockProducts(items).length
    const lowStockCount = getLowStockProducts(items).length
    const healthyCount = items.length - lowStockCount - outOfStockCount
    const utilizationPercent = Math.round((healthyCount / items.length) * 100)

    const status: CategoryStockStatus =
      outOfStockCount > 0
        ? 'critical'
        : lowStockCount / items.length > 0.5
          ? 'low'
          : lowStockCount / items.length > 0.25
            ? 'watch'
            : lowStockCount > 0
              ? 'stable'
              : 'healthy'

    return {
      id: `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: category,
      icon: CATEGORY_ICON_MAP[category as keyof typeof CATEGORY_ICON_MAP],
      skuCount: items.length,
      value: formatCurrency(getTotalInventoryValue(items)),
      utilizationPercent,
      status
    }
  })
}

export const getWarehouseStockSummaries = (
  products: Product[],
  warehouses: Warehouse[],
  movements: StockMovement[]
): WarehouseStockSummary[] => {
  const stored = new Map<string, { units: number; skus: number }>()

  for (const [key, quantity] of getWarehouseBalances(movements)) {
    if (quantity <= 0) continue

    const warehouseId = key.split('::')[1]
    const entry = stored.get(warehouseId) ?? { units: 0, skus: 0 }

    stored.set(warehouseId, { units: entry.units + quantity, skus: entry.skus + 1 })
  }

  return warehouses.map(warehouse => {
    const items = excludeDrafts(products).filter(p => p.warehouseId === warehouse.id)
    const outOfStockCount = getOutOfStockProducts(items).length
    const lowStockCount = getLowStockProducts(items).length
    const entry = stored.get(warehouse.id) ?? { units: 0, skus: 0 }

    const status: WarehouseHealthStatus = outOfStockCount > 0 ? 'attention' : lowStockCount > 0 ? 'stable' : 'healthy'

    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      status,
      capacityUsedPercent: getWarehouseUtilization(entry.units, warehouse.maxCapacity),
      maxCapacity: warehouse.maxCapacity,
      skuCount: entry.skus,
      unitCount: entry.units,
      value: formatCurrency(getTotalInventoryValue(items)),
      lowStockCount,
      outOfStockCount
    }
  })
}

const formatTimeAgo = (dateIso: string, now: number) => {
  const hours = Math.round(Math.max(0, now - new Date(dateIso).getTime()) / HOUR)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}

export const getRecentInventoryActivity = (
  movements: StockMovement[],
  products: Product[],
  warehouses: Warehouse[]
): InventoryActivityItem[] => {
  const now = ledgerNow(movements)

  const latest = (type: MovementType, inboundOnly = false) =>
    movements.reduce<StockMovement | null>((best, movement) => {
      if (movement.type !== type) return best
      if (inboundOnly && movement.quantity <= 0) return best

      return !best || movement.date > best.date ? movement : best
    }, null)

  const items: InventoryActivityItem[] = []
  const receipt = latest('receipt')
  const transfer = latest('transfer', true)
  const adjustment = latest('adjustment')
  const alert = getReorderAlerts(products, warehouses, 1)[0]

  if (receipt) {
    items.push({
      id: receipt.id,
      kind: 'receipt',
      title: 'Shipment received',
      description: `${receipt.quantity} units of ${receipt.name}`,
      warehouse: receipt.warehouseName,
      timeAgo: formatTimeAgo(receipt.date, now)
    })
  }

  if (transfer) {
    items.push({
      id: transfer.id,
      kind: 'transfer',
      title: 'Stock transferred',
      description: `${transfer.quantity} units to ${transfer.warehouseName}`,
      warehouse: transfer.note.replace(/^From /, '') || transfer.warehouseName,
      timeAgo: formatTimeAgo(transfer.date, now)
    })
  }

  if (adjustment) {
    items.push({
      id: adjustment.id,
      kind: 'adjustment',
      title: 'Inventory adjusted',
      description: `Count variance: ${adjustment.quantity > 0 ? '+' : ''}${adjustment.quantity} units`,
      warehouse: adjustment.warehouseName,
      timeAgo: formatTimeAgo(adjustment.date, now)
    })
  }

  if (alert) {
    const lastTouched = movements.reduce<StockMovement | null>(
      (best, movement) => (movement.productId === alert.id && (!best || movement.date > best.date) ? movement : best),
      null
    )

    items.push({
      id: `activity-${alert.id}`,
      kind: 'reorder',
      title: 'Reorder point reached',
      description: `${alert.productName} (${alert.sku})`,
      warehouse: alert.warehouse,
      timeAgo: lastTouched ? formatTimeAgo(lastTouched.date, now) : 'Today'
    })
  }

  return items
}
