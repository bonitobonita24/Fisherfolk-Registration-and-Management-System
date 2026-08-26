'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'

// Type Imports
import type { Product } from '@/types/entities/product'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { buttonVariants } from '@/components/ui/button'
import CapacityCard from './capacity-card'
import TodayCard from './today-card'
import WarehouseDetailHeader from './warehouse-detail-header'
import WarehouseDetailsCard from './warehouse-details-card'
import WarehouseInventoryTabs from './warehouse-inventory-tabs'
import ZoneBinLayout from './zone-bin-layout'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useUsersStore } from '@/store/use-users-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { buildWarehouseInventoryMap, emptyWarehouseInventory } from '@/lib/selectors/warehouse-selectors'

type WarehouseDetailViewProps = {
  warehouseId: string
  warehouses: Warehouse[]
  products: Product[]
  movements: StockMovement[]
  transfers: StockTransfer[]
  users: User[]
}

const WarehouseDetailView = ({
  warehouseId,
  warehouses,
  products,
  movements,
  transfers,
  users
}: WarehouseDetailViewProps) => {
  // Hooks
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeUsers = useUsersStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeMovements = useStockLedgerStore(state => state.initialize)
  const initializeTransfers = useStockTransfersStore(state => state.initialize)

  const warehouse = useWarehousesStore(state => state.getWarehouse(warehouseId))
  const storeProducts = useProductsStore(state => state.products)
  const storeMovements = useStockLedgerStore(state => state.movements)
  const storeTransfers = useStockTransfersStore(state => state.transfers)
  const storeUsers = useUsersStore(state => state.users)

  const activeProducts = storeProducts.length > 0 ? storeProducts : products
  const activeMovements = storeMovements.length > 0 ? storeMovements : movements
  const activeTransfers = storeTransfers.length > 0 ? storeTransfers : transfers
  const activeUsers = storeUsers.length > 0 ? storeUsers : users

  const inventory = useMemo(
    () =>
      buildWarehouseInventoryMap(activeMovements, activeTransfers, activeProducts).get(warehouseId) ??
      emptyWarehouseInventory(warehouseId),
    [activeMovements, activeTransfers, activeProducts, warehouseId]
  )

  useEffect(() => {
    initializeWarehouses(warehouses)
    initializeProducts(products)
    initializeMovements(movements)
    initializeTransfers(transfers)
    initializeUsers(users)
  }, [
    initializeWarehouses,
    initializeProducts,
    initializeMovements,
    initializeTransfers,
    initializeUsers,
    warehouses,
    products,
    movements,
    transfers,
    users
  ])

  if (!warehouse) {
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Warehouse not found.</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This warehouse may have been created in a different browser session and isn&apos;t available after a reload.
        </p>
        <Link href='/warehouses' className={`${buttonVariants()} mt-4`}>
          Back to warehouses
        </Link>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <WarehouseDetailHeader warehouse={warehouse} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='min-w-0 space-y-6 lg:col-span-2'>
          <ZoneBinLayout zones={warehouse.zones} />
          <WarehouseInventoryTabs warehouse={warehouse} inventory={inventory} movements={activeMovements} />
        </div>
        <div className='grid grid-cols-1 gap-6 md:max-lg:grid-cols-2'>
          <WarehouseDetailsCard warehouse={warehouse} users={activeUsers} />
          <CapacityCard warehouse={warehouse} inventory={inventory} />
          <TodayCard today={warehouse.today} />
        </div>
      </div>
    </div>
  )
}

export default WarehouseDetailView
