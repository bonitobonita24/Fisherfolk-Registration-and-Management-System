'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { OperationsOverviewData } from '@/types/dashboards/operations-overview-types'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import ActiveShipmentsCard from './active-shipments-card'
import DeliveriesTrendCard from './deliveries-trend-card'
import DeliveryPerformanceCard from './delivery-performance-card'
import FleetConditionCard from './fleet-condition-card'
import FleetStatusCard from './fleet-status-card'
import FulfilmentPipelineCard from './fulfilment-pipeline-card'
import OperationsOverviewHeader from './page-header'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'

type OperationsOverviewViewProps = {
  data: OperationsOverviewData
  vehicles: Vehicle[]
  orders: Order[]
  shipments: Shipment[]
}

const OperationsOverviewView = ({ data, vehicles, orders, shipments }: OperationsOverviewViewProps) => {
  // Hooks
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  return (
    <div className='flex flex-col gap-6'>
      <OperationsOverviewHeader />

      <div className='grid grid-cols-6 gap-6'>
        <FleetStatusCard className='col-span-full xl:col-span-3' />

        <FulfilmentPipelineCard className='col-span-full md:col-span-3' />

        <DeliveryPerformanceCard data={data} className='col-span-full md:col-span-3 xl:col-span-2' />

        <FleetConditionCard className='col-span-full md:col-span-3 xl:col-span-2' />

        <DeliveriesTrendCard data={data} className='col-span-full md:col-span-3 xl:col-span-2' />

        <ActiveShipmentsCard className='col-span-full' />
      </div>
    </div>
  )
}

export default OperationsOverviewView
