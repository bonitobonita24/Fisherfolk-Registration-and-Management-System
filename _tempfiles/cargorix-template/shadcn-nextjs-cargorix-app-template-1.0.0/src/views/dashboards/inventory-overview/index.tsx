'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { InventoryOverviewData } from '@/types/dashboards/inventory-overview-types'
import type { Product } from '@/types/entities/product'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import CategoryStockHealthCard from './category-stock-health-card'
import InventoryKpiCards from './kpi-cards'
import InventoryTurnoverCard from './inventory-turnover-card'
import InventoryOverviewHeader from './page-header'
import RecentActivitySection from './recent-activity-section'
import ReorderAlertsCard from './reorder-alerts-card'
import WarehouseStockSection from './warehouse-stock-section'

// Store Imports
import { useInventoryOverviewStore } from '@/store/use-inventory-overview-store'
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type InventoryOverviewViewProps = {
  data: InventoryOverviewData
  products: Product[]
  warehouses: Warehouse[]
  movements: StockMovement[]
}

const InventoryOverviewView = ({ data, products, warehouses, movements }: InventoryOverviewViewProps) => {
  const initialize = useInventoryOverviewStore(state => state.initialize)

  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeMovements = useStockLedgerStore(state => state.initialize)

  useEffect(() => {
    initialize(data)
  }, [initialize, data])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    initializeMovements(movements)
  }, [initializeMovements, movements])

  return (
    <div className='flex flex-col gap-6'>
      <InventoryOverviewHeader />
      <InventoryKpiCards />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <InventoryTurnoverCard />
        <ReorderAlertsCard />
      </div>

      <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-2'>
        <CategoryStockHealthCard />
        <WarehouseStockSection />
      </div>

      <RecentActivitySection />
    </div>
  )
}

export default InventoryOverviewView
