'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Route, RouteTotals } from '@/types/entities/route'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import RouteRowActions from './route-row-actions'

// Util Imports
import { getRouteTotals } from '@/lib/selectors/route-selectors'

// Data Imports
import { ROUTE_STATUS_BADGE } from '../route-badges'

export const UNASSIGNED_FILTER_VALUE = 'unassigned'

const formatDate = (value: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

const dash = <span className='text-muted-foreground'>—</span>

type RouteColumnData = {
  vehicles: Vehicle[]
  drivers: Driver[]
  warehouses: Warehouse[]
}

const getRouteColumns = ({ vehicles, drivers, warehouses }: RouteColumnData): ColumnDef<Route>[] => {
  // Vars
  const vehicleById = new Map(vehicles.map(v => [v.id, v]))
  const driverById = new Map(drivers.map(d => [d.id, d]))
  const warehouseById = new Map(warehouses.map(w => [w.id, w]))

  const totalsCache = new WeakMap<Route, RouteTotals>()

  const totalsFor = (route: Route): RouteTotals => {
    const cached = totalsCache.get(route)

    if (cached) return cached

    const totals = getRouteTotals(
      route,
      warehouseById.get(route.startWarehouseId),
      route.vehicleId ? vehicleById.get(route.vehicleId) : undefined
    )

    totalsCache.set(route, totals)

    return totals
  }

  return [
    {
      id: 'number',
      accessorKey: 'number',
      meta: { filterVariant: 'text', label: 'Route' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Route' />,
      filterFn: (row, _id, value: string) => {
        const search = value.toLowerCase()
        const route = row.original
        const driver = route.driverId ? driverById.get(route.driverId) : undefined
        const vehicle = route.vehicleId ? vehicleById.get(route.vehicleId) : undefined

        return (
          route.number.toLowerCase().includes(search) ||
          Boolean(driver?.name.toLowerCase().includes(search)) ||
          Boolean(vehicle?.registrationNo?.toLowerCase().includes(search)) ||
          Boolean(vehicle?.id.toLowerCase().includes(search))
        )
      },
      cell: ({ row }) => {
        const route = row.original

        return (
          <div className='flex flex-col'>
            <span className='text-foreground font-semibold'>{route.number}</span>
            <span className='text-muted-foreground text-xs'>Start {route.startTime}</span>
          </div>
        )
      }
    },
    {
      id: 'date',
      accessorKey: 'date',
      meta: { label: 'Date' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
      cell: ({ row }) => <span className='whitespace-nowrap'>{formatDate(row.original.date)}</span>
    },
    {
      id: 'origin',
      accessorFn: row => warehouseById.get(row.startWarehouseId)?.name ?? '',
      meta: { label: 'Origin' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Origin' />,
      cell: ({ row }) => {
        const warehouse = warehouseById.get(row.original.startWarehouseId)

        if (!warehouse) return dash

        return (
          <div className='flex flex-col'>
            <span className='font-medium'>{warehouse.name}</span>
            <span className='text-muted-foreground text-xs'>{warehouse.code}</span>
          </div>
        )
      }
    },
    {
      id: 'stops',
      accessorFn: row => row.stops.length,
      meta: { label: 'Stops' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Stops' />,
      cell: ({ row }) => <span className='tabular-nums'>{row.original.stops.length}</span>
    },
    {
      id: 'driver',
      accessorFn: row => (row.driverId ? (driverById.get(row.driverId)?.name ?? '') : ''),
      meta: { filterVariant: 'select', label: 'Driver' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Driver' />,
      filterFn: (row, _id, value: string) => {
        if (value === 'all') return true
        if (value === UNASSIGNED_FILTER_VALUE) return !row.original.driverId

        return row.original.driverId === value
      },
      cell: ({ row }) => {
        const driver = row.original.driverId ? driverById.get(row.original.driverId) : undefined

        if (!driver) return dash

        return (
          <div className='flex items-center gap-2.5'>
            <Avatar className='size-8'>
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
              <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{driver.initials}</AvatarFallback>
            </Avatar>
            <span className='font-medium'>{driver.name}</span>
          </div>
        )
      }
    },
    {
      id: 'vehicle',
      accessorFn: row => (row.vehicleId ? (vehicleById.get(row.vehicleId)?.registrationNo ?? '') : ''),
      meta: { filterVariant: 'select', label: 'Vehicle' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Vehicle' />,
      filterFn: (row, _id, value: string) => {
        if (value === 'all') return true
        if (value === UNASSIGNED_FILTER_VALUE) return !row.original.vehicleId

        return row.original.vehicleId === value
      },
      cell: ({ row }) => {
        const vehicle = row.original.vehicleId ? vehicleById.get(row.original.vehicleId) : undefined

        if (!vehicle) return dash

        return (
          <div className='flex flex-col'>
            <span className='font-medium'>{vehicle.registrationNo ?? vehicle.id}</span>
            <span className='text-muted-foreground text-xs'>{vehicle.id.toUpperCase()}</span>
          </div>
        )
      }
    },
    {
      id: 'distance',
      accessorFn: row => totalsFor(row).distanceKm,
      meta: { label: 'Distance' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Distance' />,
      cell: ({ row }) => <span className='whitespace-nowrap tabular-nums'>{totalsFor(row.original).distanceKm} km</span>
    },
    {
      id: 'duration',
      accessorFn: row => totalsFor(row).durationMinutes,
      meta: { label: 'Duration' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Duration' />,
      cell: ({ row }) => (
        <span className='whitespace-nowrap tabular-nums'>
          {formatDuration(totalsFor(row.original).durationMinutes)}
        </span>
      )
    },
    {
      id: 'packages',
      accessorFn: row => totalsFor(row).packageCount,
      meta: { label: 'Packages' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Packages' />,
      cell: ({ row }) => {
        const totals = totalsFor(row.original)

        return (
          <div className='flex flex-col'>
            <span className='tabular-nums'>{totals.packageCount.toLocaleString()}</span>
            <span className='text-muted-foreground text-xs tabular-nums'>{totals.weightKg.toLocaleString()} kg</span>
          </div>
        )
      }
    },
    {
      id: 'status',
      accessorKey: 'status',
      meta: { filterVariant: 'select', label: 'Status' },
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
      cell: ({ row }) => {
        const badge = ROUTE_STATUS_BADGE[row.original.status]

        return <Badge className={badge.className}>{badge.label}</Badge>
      }
    },
    {
      id: 'actions',
      size: 60,
      enableHiding: false,
      enableSorting: false,
      meta: { label: 'Actions' },
      header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
      cell: ({ row }) => <RouteRowActions route={row.original} />
    }
  ]
}

export default getRouteColumns
