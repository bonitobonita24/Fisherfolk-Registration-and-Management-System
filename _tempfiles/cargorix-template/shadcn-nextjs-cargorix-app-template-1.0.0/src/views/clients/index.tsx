'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import ClientKpiCards from './kpi-cards'
import ClientsHeader from './page-header'
import ClientsTable from './table/clients-table'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

type ClientsViewProps = {
  clients: Client[]
  orders: Order[]
  shipments: Shipment[]
}

const ClientsView = ({ clients, orders, shipments }: ClientsViewProps) => {
  // Hooks
  const initializeClients = useClientsStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)

  useEffect(() => {
    initializeClients(clients)
  }, [initializeClients, clients])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  return (
    <div className='space-y-6'>
      <ClientsHeader />
      <ClientKpiCards />
      <ClientsTable />
    </div>
  )
}

export default ClientsView
