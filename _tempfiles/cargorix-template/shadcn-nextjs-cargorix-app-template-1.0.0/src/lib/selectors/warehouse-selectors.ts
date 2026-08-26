// Type Imports
import type { ExportTable } from '@/types'
import type { Product } from '@/types/entities/product'
import type { StockMovement, StockMovementRow } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { User } from '@/types/entities/user'
import type {
  DockScheduleRow,
  Warehouse,
  WarehouseCapacity,
  WarehouseCapacityStatus,
  WarehouseIntakeCheck,
  WarehouseInventory,
  WarehouseInventoryRow,
  WarehouseOverviewRow
} from '@/types/entities/warehouse'

// Util Imports
import { computeLedgerRows, getWarehouseBalances } from '@/lib/selectors/stock-ledger-selectors'
import { getReservedByWarehouse } from '@/lib/selectors/stock-transfers-selectors'
import { getUserName } from '@/lib/selectors/user-selectors'

export const getWarehouseUtilization = (unitsStored: number, maxCapacity: number): number =>
  maxCapacity > 0 ? Math.round((unitsStored / maxCapacity) * 100) : 0

export const getWarehouseFreeSpace = (unitsStored: number, maxCapacity: number): number =>
  Math.max(0, maxCapacity - unitsStored)

export const getWarehouseCapacityStatus = (utilization: number): WarehouseCapacityStatus =>
  utilization > 100 ? 'over' : utilization >= 100 ? 'full' : utilization >= 85 ? 'high' : 'ok'

export const getWarehouseUnitsStored = (movements: StockMovement[], warehouseId: string): number => {
  let total = 0

  for (const [key, qty] of getWarehouseBalances(movements)) {
    if (qty > 0 && key.split('::')[1] === warehouseId) total += qty
  }

  return total
}

export const getWarehouseCapacity = (
  movements: StockMovement[],
  warehouses: Warehouse[],
  warehouseId: string
): WarehouseCapacity => {
  const warehouse = warehouses.find(w => w.id === warehouseId)
  const maxCapacity = warehouse?.maxCapacity ?? 0
  const unitsStored = getWarehouseUnitsStored(movements, warehouseId)
  const utilization = getWarehouseUtilization(unitsStored, maxCapacity)

  return {
    warehouseId,
    warehouseName: warehouse?.name ?? 'Warehouse',
    unitsStored,
    maxCapacity,
    freeSpace: getWarehouseFreeSpace(unitsStored, maxCapacity),
    utilization,
    status: getWarehouseCapacityStatus(utilization)
  }
}

export const checkWarehouseIntake = (
  movements: StockMovement[],
  warehouses: Warehouse[],
  warehouseId: string,
  incomingUnits: number
): WarehouseIntakeCheck => {
  const capacity = getWarehouseCapacity(movements, warehouses, warehouseId)
  const known = warehouses.some(w => w.id === warehouseId)
  const overBy = Math.max(0, incomingUnits - capacity.freeSpace)

  return {
    ...capacity,
    incomingUnits,
    overBy,
    ok: !known || incomingUnits <= 0 || overBy === 0
  }
}

export const capacityBlockedMessage = (check: WarehouseIntakeCheck): string =>
  `${check.warehouseName} holds ${check.unitsStored.toLocaleString()} of ${check.maxCapacity.toLocaleString()} units and has room for ${check.freeSpace.toLocaleString()} more. This would add ${check.incomingUnits.toLocaleString()} — ${check.overBy.toLocaleString()} over capacity.`

export const buildWarehouseInventoryMap = (
  movements: StockMovement[],
  transfers: StockTransfer[],
  products: Product[]
): Map<string, WarehouseInventory> => {
  const balances = getWarehouseBalances(movements)
  const reserved = getReservedByWarehouse(transfers)
  const productById = new Map(products.map(p => [p.id, p]))

  const rowsByWarehouse = new Map<string, WarehouseInventoryRow[]>()

  for (const [key, qty] of balances) {
    if (qty <= 0) continue

    const [productId, warehouseId] = key.split('::')
    const product = productById.get(productId)

    if (!product) continue

    const reservedQty = Math.min(qty, reserved.get(key) ?? 0)
    const list = rowsByWarehouse.get(warehouseId) ?? []

    list.push({
      productId,
      sku: product.sku,
      name: product.name,
      primaryImage: product.primaryImage,
      onHand: qty,
      reserved: reservedQty,
      available: qty - reservedQty,
      reorderPoint: product.reorderPoint
    })

    rowsByWarehouse.set(warehouseId, list)
  }

  const result = new Map<string, WarehouseInventory>()

  for (const [warehouseId, rows] of rowsByWarehouse) {
    rows.sort((a, b) => b.onHand - a.onHand)

    const unitsStored = rows.reduce((sum, r) => sum + r.onHand, 0)
    const reservedTotal = rows.reduce((sum, r) => sum + r.reserved, 0)

    result.set(warehouseId, {
      warehouseId,
      unitsStored,
      skuCount: rows.length,
      reserved: reservedTotal,
      available: unitsStored - reservedTotal,
      rows
    })
  }

  return result
}

export const emptyWarehouseInventory = (warehouseId: string): WarehouseInventory => ({
  warehouseId,
  unitsStored: 0,
  skuCount: 0,
  reserved: 0,
  available: 0,
  rows: []
})

export const buildWarehouseOverviewRows = (
  warehouses: Warehouse[],
  inventoryMap: Map<string, WarehouseInventory>,
  users: User[]
): WarehouseOverviewRow[] =>
  warehouses.map(warehouse => {
    const inventory = inventoryMap.get(warehouse.id)
    const unitsStored = inventory?.unitsStored ?? 0

    return {
      ...warehouse,
      manager: getUserName(users, warehouse.managerId),
      unitsStored,
      skuCount: inventory?.skuCount ?? 0,
      utilizationPercent: getWarehouseUtilization(unitsStored, warehouse.maxCapacity)
    }
  })

export const getInboundOutboundToday = (warehouses: Warehouse[]): DockScheduleRow[] =>
  warehouses.flatMap(warehouse =>
    warehouse.dockSchedule.map(appointment => ({
      ...appointment,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name
    }))
  )

export const getWarehouseRecentMovements = (
  warehouseId: string,
  movements: StockMovement[],
  limit = 6
): StockMovementRow[] => computeLedgerRows(movements.filter(m => m.warehouseId === warehouseId)).slice(0, limit)

export const buildWarehousesExport = (list: WarehouseOverviewRow[]): ExportTable => {
  const headers = [
    'Warehouse',
    'Code',
    'Location',
    'Manager',
    'Units Stored',
    'SKUs',
    'Capacity',
    'Utilization',
    'Docks',
    'Status'
  ]

  const rows = list.map(row => [
    row.name,
    row.code,
    row.location,
    row.manager,
    `${row.unitsStored}`,
    `${row.skuCount}`,
    `${row.maxCapacity}`,
    `${row.utilizationPercent}%`,
    `${row.dockCount}`,
    row.status
  ])

  return { headers, rows }
}
