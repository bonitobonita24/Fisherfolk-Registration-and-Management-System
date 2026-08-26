'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { notFound } from 'next/navigation'

// Third-party Imports
import { addMinutes, format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import RouteActivityCard from './route-activity-card'
import RouteDetailHeader from './route-detail-header'
import RouteInformationCard from './route-information-card'
import RouteMapCard from './route-map-card'
import RouteNotesCard from './route-notes-card'
import RouteProgressCard from './route-progress-card'
import RouteStopsTable from './route-stops-table'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getRouteTotals } from '@/lib/selectors/route-selectors'

type RouteDetailViewProps = {
  routeId: string
  routes: Route[]
  orders: Order[]
  shipments: Shipment[]
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const RouteDetailView = ({
  routeId,
  routes,
  orders,
  shipments,
  vehicles,
  drivers,
  warehouses
}: RouteDetailViewProps) => {
  // Hooks
  const initializeRoutes = useRoutesStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  const storedRoute = useRoutesStore(state => state.routes.find(r => r.id === routeId))
  const storedVehicles = useVehiclesStore(state => state.vehicles)
  const storedDrivers = useDriversStore(state => state.drivers)
  const storedWarehouses = useWarehousesStore(state => state.warehouses)

  const route = storedRoute ?? routes.find(r => r.id === routeId)
  const vehicleList = storedVehicles.length > 0 ? storedVehicles : vehicles
  const driverList = storedDrivers.length > 0 ? storedDrivers : drivers
  const warehouseList = storedWarehouses.length > 0 ? storedWarehouses : warehouses

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

  if (!route) notFound()

  const warehouse = warehouseList.find(w => w.id === route.startWarehouseId)
  const vehicle = route.vehicleId ? vehicleList.find(v => v.id === route.vehicleId) : undefined
  const driver = route.driverId ? driverList.find(d => d.id === route.driverId) : undefined

  const totals = getRouteTotals(route, warehouse, vehicle)
  const startsAt = new Date(`${route.date.slice(0, 10)}T${(route.startTime || '00:00').slice(0, 5)}:00`)

  const estimatedEnd = Number.isNaN(startsAt.getTime())
    ? '—'
    : format(addMinutes(startsAt, totals.durationMinutes), 'HH:mm')

  return (
    <div className='space-y-6'>
      <RouteDetailHeader route={route} warehouse={warehouse} />
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <RouteInformationCard
            route={route}
            driver={driver}
            vehicle={vehicle}
            totals={totals}
            estimatedEnd={estimatedEnd}
          />
          <RouteNotesCard route={route} />
        </div>
        <div className='min-w-0 space-y-6'>
          <RouteMapCard route={route} warehouse={warehouse} />
          <RouteStopsTable route={route} />
        </div>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <RouteProgressCard route={route} totals={totals} estimatedEnd={estimatedEnd} />
          <RouteActivityCard route={route} />
        </div>
      </div>
    </div>
  )
}

export default RouteDetailView
