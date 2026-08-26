'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Columns3Icon, ListIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { OrderKpiTrends } from '@/types/pages/orders-types'

// Component Imports
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OrdersKanban from './kanban'
import OrdersKpiCards from './kpi-cards'
import OrdersPageHeader from './page-header'
import OrdersTable from './table/orders-table'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

const viewParser = parseAsStringLiteral(['table', 'kanban']).withDefault('table')

type OrdersViewProps = {
  orders: Order[]
  shipments: Shipment[]
  clients: Client[]
  kpiTrends: OrderKpiTrends
}

const OrdersView = ({ orders, shipments, clients, kpiTrends }: OrdersViewProps) => {
  // States
  const [view, setView] = useQueryState('view', viewParser)

  // Vars
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <OrdersPageHeader />
      <OrdersKpiCards trends={kpiTrends} />

      <Tabs value={view} onValueChange={value => setView(value as 'table' | 'kanban')}>
        <TabsList className='bg-black/10'>
          <TabsTrigger value='table'>
            <ListIcon data-icon='inline-start' />
            Table
          </TabsTrigger>
          <TabsTrigger value='kanban'>
            <Columns3Icon data-icon='inline-start' />
            Kanban
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'table' ? (
        <>
          <OrdersTable clients={clients} />
        </>
      ) : (
        <OrdersKanban clients={clients} />
      )}
    </div>
  )
}

export default OrdersView
