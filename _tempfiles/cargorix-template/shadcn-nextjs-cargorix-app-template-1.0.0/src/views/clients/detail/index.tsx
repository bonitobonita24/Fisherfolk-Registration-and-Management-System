'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { notFound } from 'next/navigation'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import ActiveShipmentsCard from './active-shipments-card'
import AddressesCard from './addresses-card'
import BillingTermsCard from './billing-terms-card'
import ClientDetailHeader from './client-detail-header'
import ClientInfoCard from './client-info-card'
import DocumentsCard from './documents-card'
import NotesCard from './notes-card'
import PrimaryContactCard from './primary-contact-card'
import RecentActivityCard from './recent-activity-card'
import RecentOrdersCard from './recent-orders-card'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

type ClientDetailViewProps = {
  clientId: string
  clients: Client[]
  orders: Order[]
  shipments: Shipment[]
}

const ClientDetailView = ({ clientId, clients, orders, shipments }: ClientDetailViewProps) => {
  // Hooks
  const initializeClients = useClientsStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const storedClient = useClientsStore(state => state.clients.find(c => c.id === clientId && !c.isDraft))
  const storedOrders = useOrdersStore(state => state.orders)
  const storedShipments = useShipmentsStore(state => state.shipments)

  const client = storedClient ?? clients.find(c => c.id === clientId && !c.isDraft)
  const orderList = storedOrders.length > 0 ? storedOrders : orders
  const shipmentList = storedShipments.length > 0 ? storedShipments : shipments

  useEffect(() => {
    initializeClients(clients)
  }, [initializeClients, clients])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  if (!client) notFound()

  return (
    <div className='relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
      <div className='min-w-0 space-y-6'>
        <ClientDetailHeader client={client} orders={orderList} shipments={shipmentList} />
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <ClientInfoCard client={client} />
          <PrimaryContactCard client={client} />
          <BillingTermsCard client={client} />
        </div>
        <RecentOrdersCard client={client} orders={orderList} />
        <ActiveShipmentsCard client={client} orders={orderList} shipments={shipmentList} />
        <RecentActivityCard client={client} />
      </div>
      <aside className='grid grid-cols-1 gap-6 self-start md:max-lg:grid-cols-2 lg:max-xl:grid-cols-3 xl:sticky xl:top-18'>
        <AddressesCard client={client} />
        <NotesCard client={client} />
        <DocumentsCard client={client} />
      </aside>
    </div>
  )
}

export default ClientDetailView
