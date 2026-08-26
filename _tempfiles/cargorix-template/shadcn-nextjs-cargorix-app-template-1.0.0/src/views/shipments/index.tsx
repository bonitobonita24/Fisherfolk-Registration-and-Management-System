'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card } from '@/components/ui/card'
import ShipmentDetail from './detail'
import ShipmentsKpiCards from './kpi-cards'
import ShipmentsPageHeader from './page-header'
import TrackingList from './tracking-list'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

type ShipmentsViewProps = {
  shipments: Shipment[]
  orders: Order[]
  clients: Client[]
  drivers: Driver[]
  vehicles: Vehicle[]
  warehouses: Warehouse[]
  selectedShipmentId?: string
}

const ShipmentsView = ({
  shipments,
  orders,
  clients,
  drivers,
  vehicles,
  warehouses,
  selectedShipmentId
}: ShipmentsViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const storeShipments = useShipmentsStore(state => state.shipments)
  const storeOrders = useOrdersStore(state => state.orders)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  // Vars
  const listShipments = excludeUnsavedDrafts(storeShipments.length > 0 ? storeShipments : shipments)
  const orderPool = storeOrders.length > 0 ? storeOrders : orders
  const activeId = selectedShipmentId ?? listShipments[0]?.id

  useEffect(() => {
    if (!selectedShipmentId && activeId) router.replace(`/shipments/${activeId}`)
  }, [router, selectedShipmentId, activeId])

  const selectedShipment = listShipments.find(s => s.id === activeId)
  const selectedOrder = orderPool.find(o => o.id === selectedShipment?.orderId)
  const selectedDriver = drivers.find(d => d.id === selectedShipment?.driverId)
  const selectedVehicle = vehicles.find(v => v.id === selectedShipment?.vehicleId)
  const warehousePool = storeWarehouses.length > 0 ? storeWarehouses : warehouses
  const originWarehouse = warehousePool.find(w => w.name === selectedShipment?.originHub)

  return (
    <div className='space-y-6'>
      <ShipmentsPageHeader />

      <ShipmentsKpiCards shipments={listShipments} />

      <div className='grid gap-6 md:grid-cols-[290px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]'>
        <div className='relative max-md:h-[70svh]'>
          <TrackingList
            shipments={listShipments}
            orders={orderPool}
            clients={clients}
            drivers={drivers}
            vehicles={vehicles}
            selectedShipmentId={activeId}
          />
        </div>
        {selectedShipment ? (
          <ShipmentDetail
            shipment={selectedShipment}
            order={selectedOrder}
            driver={selectedDriver}
            vehicle={selectedVehicle}
            originWarehouse={originWarehouse}
          />
        ) : (
          <Card className='text-muted-foreground items-center p-12 text-sm'>No shipments yet.</Card>
        )}
      </div>
    </div>
  )
}

export default ShipmentsView
