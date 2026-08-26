'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Driver } from '@/types/entities/driver'
import type { Order } from '@/types/entities/order'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'
import type { RouteFormPatch } from '@/store/use-routes-store'
import type { CreateRouteFormInput, CreateRouteFormValues } from './route-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AddRouteView from './add/add-route-view'
import EditRouteView from './edit/edit-route-view'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Data Imports
import { routeFormSchema } from './route-form-schema'

const routeResolver = zodResolver as unknown as (
  schema: typeof routeFormSchema
) => Resolver<CreateRouteFormInput, unknown, CreateRouteFormValues>

const EMPTY_VALUES: CreateRouteFormInput = {
  routeId: '',
  startWarehouseId: '',
  vehicleId: '',
  driverId: '',
  date: '',
  startTime: '08:00',
  returnToStart: true,
  notes: ''
}

const toPickerValue = (date: string, startTime: string) =>
  date ? `${date.slice(0, 10)}T${(startTime || '09:00').slice(0, 5)}` : ''

const mapRouteToForm = (route: Route): CreateRouteFormInput => ({
  routeId: route.id,
  startWarehouseId: route.startWarehouseId,
  vehicleId: route.vehicleId ?? '',
  driverId: route.driverId ?? '',
  date: toPickerValue(route.date, route.startTime),
  startTime: route.startTime ?? '',
  returnToStart: route.returnToStart,
  notes: route.notes ?? ''
})

const mapFormToPatch = (values: CreateRouteFormInput | CreateRouteFormValues): RouteFormPatch => ({
  startWarehouseId: values.startWarehouseId,
  vehicleId: values.vehicleId || undefined,
  driverId: values.driverId || undefined,
  date: values.date ? values.date.slice(0, 10) : '',
  startTime: values.startTime,
  returnToStart: Boolean(values.returnToStart),
  notes: values.notes ?? ''
})

// Props
type CreateRouteViewProps = {
  routeId: string
  routes: Route[]
  orders: Order[]
  shipments: Shipment[]
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const CreateRouteView = ({
  routeId,
  routes,
  orders,
  shipments,
  vehicles,
  drivers,
  warehouses
}: CreateRouteViewProps) => {
  // States
  const [isDispatching, setIsDispatching] = useState(false)

  // Hooks
  const router = useRouter()
  const initializeRoutes = useRoutesStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  const createDraftRoute = useRoutesStore(state => state.createDraftRoute)
  const saveRouteDraft = useRoutesStore(state => state.saveRouteDraft)
  const commitRoute = useRoutesStore(state => state.commitRoute)
  const updateRoute = useRoutesStore(state => state.updateRoute)
  const dispatchRoute = useRoutesStore(state => state.dispatchRoute)

  const route = useRoutesStore(state => state.routes.find(r => r.id === routeId))
  const storedOrders = useOrdersStore(state => state.orders)
  const storedVehicles = useVehiclesStore(state => state.vehicles)
  const storedDrivers = useDriversStore(state => state.drivers)
  const storedWarehouses = useWarehousesStore(state => state.warehouses)

  const form = useForm<CreateRouteFormInput, unknown, CreateRouteFormValues>({
    resolver: routeResolver(routeFormSchema),
    defaultValues: EMPTY_VALUES
  })

  const values = useWatch({ control: form.control })

  const orderList = storedOrders.length > 0 ? storedOrders : orders
  const vehicleList = storedVehicles.length > 0 ? storedVehicles : vehicles
  const driverList = storedDrivers.length > 0 ? storedDrivers : drivers
  const warehouseList = storedWarehouses.length > 0 ? storedWarehouses : warehouses

  const selectableVehicles = vehicleList.filter(vehicle => !vehicle.isDraft)
  const selectableDrivers = driverList.filter(driver => !driver.isDraft)

  const isNew = isDispatching || route?.status === 'draft'
  const hydrated = values.routeId === routeId

  const draftRoute: Route | undefined = !route
    ? undefined
    : hydrated
      ? {
          ...route,
          startWarehouseId: values.startWarehouseId ?? '',
          vehicleId: values.vehicleId || undefined,
          driverId: values.driverId || undefined,
          date: values.date ? values.date.slice(0, 10) : '',
          startTime: values.startTime ?? '',
          returnToStart: values.returnToStart ?? route.returnToStart,
          notes: values.notes ?? ''
        }
      : route

  const warehouse = warehouseList.find(item => item.id === draftRoute?.startWarehouseId)
  const vehicle = selectableVehicles.find(item => item.id === draftRoute?.vehicleId)

  const warehouseFor = (id?: string) => warehouseList.find(item => item.id === id)

  const handleSaveDraft = () => {
    const current = form.getValues()

    saveRouteDraft(routeId, mapFormToPatch(current), warehouseFor(current.startWarehouseId))
    toast.success('Route draft saved')
    router.push('/route-planner')
  }

  const handleDispatch = form.handleSubmit(submitted => {
    const patch = mapFormToPatch(submitted)
    const warehouseId = warehouseFor(submitted.startWarehouseId)

    if (!patch.vehicleId || !patch.driverId) {
      saveRouteDraft(routeId, patch, warehouseId)
      toast.error('Assign a vehicle and a driver before dispatching')

      return
    }

    setIsDispatching(true)
    commitRoute(routeId, patch, warehouseId)

    if (!dispatchRoute(routeId)) {
      setIsDispatching(false)
      toast.error('Route saved, but not dispatched')

      return
    }

    toast.success('Route dispatched')
    router.push(`/route-planner/${routeId}`)
  })

  const handleSaveChanges = form.handleSubmit(submitted => {
    updateRoute(routeId, mapFormToPatch(submitted), warehouseFor(submitted.startWarehouseId))
    toast.success('Route updated')
    router.push(`/route-planner/${routeId}`)
  })

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

  useEffect(() => {
    createDraftRoute(routeId)
  }, [createDraftRoute, routeId])

  useEffect(() => {
    if (!route) return

    const next = mapRouteToForm(route)

    if (!next.driverId && next.vehicleId) {
      next.driverId = vehicleList.find(vehicle => vehicle.id === next.vehicleId)?.assignedDriverId ?? ''
    }

    form.reset(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/route-planner' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to route planner
      </Button>

      {!draftRoute ? null : isNew ? (
        <AddRouteView
          control={form.control}
          setValue={form.setValue}
          route={draftRoute}
          warehouse={warehouse}
          vehicle={vehicle}
          orders={orderList}
          vehicles={selectableVehicles}
          drivers={selectableDrivers}
          warehouses={warehouseList}
          onSaveDraft={handleSaveDraft}
          onDispatch={handleDispatch}
        />
      ) : (
        <EditRouteView
          control={form.control}
          setValue={form.setValue}
          route={draftRoute}
          warehouse={warehouse}
          vehicle={vehicle}
          orders={orderList}
          vehicles={selectableVehicles}
          drivers={selectableDrivers}
          warehouses={warehouseList}
          onSaveChanges={handleSaveChanges}
        />
      )}
    </div>
  )
}

export default CreateRouteView
