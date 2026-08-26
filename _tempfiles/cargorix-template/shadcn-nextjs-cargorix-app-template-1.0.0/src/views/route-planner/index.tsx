'use client'

// React Imports
import { useEffect } from 'react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import RoutePlannerHeader from './page-header'
import RoutePlannerKpiCards from './kpi-cards'
import RoutesTable from './table/routes-table'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

type RoutePlannerViewProps = {
  routes: Route[]
  orders: Order[]
  shipments: Shipment[]
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const RoutePlannerView = ({ routes, orders, shipments, vehicles, drivers, warehouses }: RoutePlannerViewProps) => {
  // Hooks
  const initializeRoutes = useRoutesStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  useEffect(() => {
    initializeRoutes(routes)
  }, [initializeRoutes, routes])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  return (
    <div className='space-y-6'>
      <RoutePlannerHeader />
      <RoutePlannerKpiCards />
      <RoutesTable />
    </div>
  )
}

export default RoutePlannerView
