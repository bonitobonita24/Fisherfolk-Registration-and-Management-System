'use client'

// React Imports
import { useEffect, useMemo } from 'react'

// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order, ServiceLevel } from '@/types/entities/order'
import type { Product } from '@/types/entities/product'
import type { Route } from '@/types/entities/route'
import type { Shipment } from '@/types/entities/shipment'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Vehicle, VehicleType } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'
import type { ReportTab } from '@/types/pages/reports-types'
import { REPORT_TABS } from '@/types/pages/reports-types'
import { VEHICLE_TYPE_LIST } from '@/types/entities/vehicle'
import type { ContextualFilter } from './reports-filter-bar'

// Component Imports
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DeliveryTab from './delivery-tab'
import FleetTab from './fleet-tab'
import InventoryTab from './inventory-tab'
import ReportsFilterBar from './reports-filter-bar'
import RevenueTab from './revenue-tab'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useProductsStore } from '@/store/use-products-store'
import { useReportsStore } from '@/store/use-reports-store'
import { useRoutesStore } from '@/store/use-routes-store'
import { useShipmentsStore } from '@/store/use-shipments-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getCategoryHealth } from '@/lib/selectors/inventory-selectors'
import {
  buildReportExport,
  getDeliveryReport,
  getFleetReport,
  getInventoryReport,
  getReportBounds,
  getReportWindow,
  getRevenueReport,
  getShipmentCarriers
} from '@/lib/selectors/reports-selectors'
import { formatCurrency, formatPercent } from './format'

type ReportsViewProps = {
  orders: Order[]
  shipments: Shipment[]
  clients: Client[]
  products: Product[]
  movements: StockMovement[]
  vehicles: Vehicle[]
  routes: Route[]
  warehouses: Warehouse[]
}

const SERVICE_LEVEL_OPTIONS = [
  { label: 'All service levels', value: 'all' },
  { label: 'Standard delivery', value: 'regular' },
  { label: 'Express delivery', value: 'express' },
  { label: 'Same-day delivery', value: 'same_day' }
]

const ReportsView = ({
  orders,
  shipments,
  clients,
  products,
  movements,
  vehicles,
  routes,
  warehouses
}: ReportsViewProps) => {
  // Hooks
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const initializeClients = useClientsStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeRoutes = useRoutesStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)

  const storeOrders = useOrdersStore(state => state.orders)
  const storeShipments = useShipmentsStore(state => state.shipments)
  const storeClients = useClientsStore(state => state.clients)
  const storeProducts = useProductsStore(state => state.products)
  const storeMovements = useStockLedgerStore(state => state.movements)
  const storeVehicles = useVehiclesStore(state => state.vehicles)
  const storeRoutes = useRoutesStore(state => state.routes)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)

  const tab = useReportsStore(state => state.tab)
  const setTab = useReportsStore(state => state.setTab)
  const from = useReportsStore(state => state.from)
  const to = useReportsStore(state => state.to)
  const compare = useReportsStore(state => state.compare)
  const carrier = useReportsStore(state => state.carrier)
  const setCarrier = useReportsStore(state => state.setCarrier)
  const serviceLevel = useReportsStore(state => state.serviceLevel)
  const setServiceLevel = useReportsStore(state => state.setServiceLevel)
  const warehouseId = useReportsStore(state => state.warehouseId)
  const setWarehouseId = useReportsStore(state => state.setWarehouseId)
  const vehicleType = useReportsStore(state => state.vehicleType)
  const setVehicleType = useReportsStore(state => state.setVehicleType)

  const bounds = useMemo(() => getReportBounds(storeOrders, storeShipments), [storeOrders, storeShipments])

  const window = useMemo(() => getReportWindow(bounds, from, to), [bounds, from, to])

  const delivery = useMemo(
    () => getDeliveryReport(storeShipments, window, compare, carrier),
    [storeShipments, window, compare, carrier]
  )

  const revenue = useMemo(
    () => getRevenueReport(storeOrders, storeClients, window, compare, serviceLevel),
    [storeOrders, storeClients, window, compare, serviceLevel]
  )

  const inventory = useMemo(
    () => getInventoryReport(storeProducts, storeMovements, window, warehouseId),
    [storeProducts, storeMovements, window, warehouseId]
  )

  const fleet = useMemo(
    () => getFleetReport(storeVehicles, storeShipments, storeRoutes, window, compare, vehicleType),
    [storeVehicles, storeShipments, storeRoutes, window, compare, vehicleType]
  )

  const categoryHealth = useMemo(
    () =>
      getCategoryHealth(
        storeProducts.filter(
          product => product.status !== 'draft' && (warehouseId === 'all' || product.warehouseId === warehouseId)
        )
      ),
    [storeProducts, warehouseId]
  )

  const carrierOptions = useMemo(
    () => [
      { label: 'All carriers', value: 'all' },
      ...getShipmentCarriers(storeShipments).map(name => ({ label: name, value: name }))
    ],
    [storeShipments]
  )

  const warehouseOptions = useMemo(
    () => [
      { label: 'All warehouses', value: 'all' },
      ...storeWarehouses.map(warehouse => ({ label: warehouse.name, value: warehouse.id }))
    ],
    [storeWarehouses]
  )

  const vehicleTypeOptions = useMemo(
    () => [
      { label: 'All vehicle types', value: 'all' },
      ...VEHICLE_TYPE_LIST.map(type => ({ label: `${type[0].toUpperCase()}${type.slice(1)}`, value: type }))
    ],
    []
  )

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    initializeClients(clients)
  }, [initializeClients, clients])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeLedger(movements)
  }, [initializeLedger, movements])

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeRoutes(routes)
  }, [initializeRoutes, routes])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  // Vars
  const bucketUnit = window.bucketDays === 1 ? 'day' : window.bucketDays === 7 ? 'week' : 'month'

  const bucketLabel = window.bucketDays === 1 ? 'daily' : window.bucketDays === 7 ? 'weekly' : 'monthly'

  const utilizationCaption = `Avg share of fleet dispatched per ${bucketUnit}`

  const contextual: ContextualFilter =
    tab === 'delivery'
      ? { label: 'Carrier', value: carrier, options: carrierOptions, onChange: setCarrier }
      : tab === 'revenue'
        ? {
            label: 'Service level',
            value: serviceLevel,
            options: SERVICE_LEVEL_OPTIONS,
            onChange: value => setServiceLevel(value as ServiceLevel | 'all')
          }
        : tab === 'inventory'
          ? { label: 'Warehouse', value: warehouseId, options: warehouseOptions, onChange: setWarehouseId }
          : {
              label: 'Vehicle type',
              value: vehicleType,
              options: vehicleTypeOptions,
              onChange: value => setVehicleType(value as VehicleType | 'all')
            }

  const tabLabel = REPORT_TABS.find(item => item.value === tab)?.label ?? 'Report'

  const exportSpan = `${format(window.start, 'yyyy-MM-dd')}-to-${format(new Date(window.end.getTime() - 1), 'yyyy-MM-dd')}`

  const getExportTable = () =>
    tab === 'delivery'
      ? buildReportExport(
          tabLabel,
          window.label,
          [
            { label: 'On-time rate', value: formatPercent(delivery.onTimeRate) },
            { label: 'Avg delivery time (days)', value: delivery.avgDeliveryDays },
            { label: 'Avg distance (km)', value: delivery.avgDistanceKm },
            { label: 'Failed deliveries', value: formatPercent(delivery.failureRate) },
            { label: 'Deliveries completed', value: delivery.deliveredCount }
          ],
          {
            title: 'On-time rate by carrier',
            headers: ['Carrier', 'On-time %', 'Deliveries'],
            rows: delivery.byCarrier.map(row => [row.label, row.value, row.caption ?? ''])
          }
        )
      : tab === 'revenue'
        ? buildReportExport(
            tabLabel,
            window.label,
            [
              { label: 'Revenue', value: formatCurrency(revenue.revenue) },
              { label: 'Avg order value', value: formatCurrency(revenue.avgOrderValue) },
              { label: 'Orders', value: revenue.orderCount },
              { label: 'Cancellation rate', value: formatPercent(revenue.cancellationRate) }
            ],
            {
              title: 'Top clients by revenue',
              headers: ['Rank', 'Client', 'Orders', 'Revenue'],
              rows: revenue.topClients.map(row => [row.rank, row.name, row.orders, row.revenue])
            }
          )
        : tab === 'inventory'
          ? buildReportExport(
              tabLabel,
              window.label,
              [
                { label: 'Turnover ratio', value: `${inventory.turnoverRatio}x` },
                { label: 'Days on hand', value: inventory.daysOnHand },
                { label: 'Dead stock rate', value: formatPercent(inventory.deadStockRate) },
                { label: 'Low stock rate', value: formatPercent(inventory.lowStockRate) },
                { label: 'Units sold', value: inventory.unitsSold }
              ],
              {
                title: 'Turnover by category',
                headers: ['Category', 'Turnover', 'Units sold'],
                rows: inventory.byCategory.map(row => [row.name, row.turnover, row.unitsSold])
              }
            )
          : buildReportExport(
              tabLabel,
              window.label,
              [
                { label: 'Fleet utilisation', value: formatPercent(fleet.utilization) },
                { label: 'Avg stops per route', value: fleet.avgStopsPerRoute },
                { label: 'Avg trip distance (km)', value: fleet.avgRouteDistanceKm },
                { label: 'Vehicles engaged', value: `${fleet.activeVehicles} of ${fleet.fleetSize}` }
              ],
              {
                title: 'Top vehicles',
                headers: ['Rank', 'Vehicle', 'Type', 'Trips', 'Utilisation %'],
                rows: fleet.topVehicles.map(row => [row.rank, row.label, row.typeLabel, row.trips, row.utilization])
              }
            )

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Reports</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Monitor operational performance across logistics workflows.
        </p>
      </div>

      <ReportsFilterBar
        window={window}
        bounds={bounds}
        contextual={contextual}
        getExportTable={getExportTable}
        exportFilename={`${tab}-report-${exportSpan}`}
        exportTitle={`${tabLabel} report`}
      />

      <Tabs
        value={tab}
        onValueChange={value => {
          if (value) setTab(value as ReportTab)
        }}
      >
        <ScrollArea>
          <TabsList className='w-auto bg-black/10 group-data-horizontal/tabs:h-fit sm:w-full'>
            {REPORT_TABS.map(item => (
              <TabsTrigger key={item.value} value={item.value} className='h-full group-data-horizontal/tabs:after:h-0'>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar
            orientation='horizontal'
            className='data-horizontal:h-1.5 *:data-[slot=scroll-area-thumb]:bg-black/20'
          />
        </ScrollArea>
      </Tabs>

      {tab === 'delivery' && (
        <DeliveryTab report={delivery} window={window} compare={compare} bucketLabel={bucketLabel} />
      )}
      {tab === 'revenue' && <RevenueTab report={revenue} window={window} compare={compare} bucketLabel={bucketLabel} />}
      {tab === 'inventory' && <InventoryTab report={inventory} categoryHealth={categoryHealth} />}
      {tab === 'fleet' && (
        <FleetTab
          report={fleet}
          window={window}
          compare={compare}
          bucketLabel={bucketLabel}
          utilizationCaption={utilizationCaption}
        />
      )}
    </div>
  )
}

export default ReportsView
