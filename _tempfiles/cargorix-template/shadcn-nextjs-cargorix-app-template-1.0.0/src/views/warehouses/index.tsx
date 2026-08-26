'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Product } from '@/types/entities/product'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import WarehousesPageHeader from './page-header'
import InboundOutboundToday from './inbound-outbound-today'
import WarehousesTable from './table/warehouses-table'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useUsersStore } from '@/store/use-users-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type WarehousesViewProps = {
  warehouses: Warehouse[]
  products: Product[]
  movements: StockMovement[]
  transfers: StockTransfer[]
  users: User[]
}

const WarehousesView = ({ warehouses, products, movements, transfers, users }: WarehousesViewProps) => {
  // Hooks
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeMovements = useStockLedgerStore(state => state.initialize)
  const initializeTransfers = useStockTransfersStore(state => state.initialize)
  const initializeUsers = useUsersStore(state => state.initialize)

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

  return (
    <div className='space-y-6'>
      <WarehousesPageHeader />
      <WarehousesTable />
      <InboundOutboundToday />
    </div>
  )
}

export default WarehousesView
