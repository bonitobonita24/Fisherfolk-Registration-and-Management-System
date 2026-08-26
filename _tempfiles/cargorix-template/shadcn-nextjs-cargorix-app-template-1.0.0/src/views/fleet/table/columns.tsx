'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { BikeIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import VehicleRowActions from './vehicle-row-actions'

// Util Imports
import { MAINTENANCE_STATUS_OPTIONS, getCapacityKg, getMaintenanceStatus } from '@/lib/selectors/fleet-selectors'
import { isDraftId } from '@/lib/is-draft-id'

// Data Imports
import { VEHICLE_STATUS_BADGE, VEHICLE_TYPE_LABEL } from '../vehicle-badges'

type FleetColumnMaps = {
  driverNameById: Record<string, string>
  warehouseNameById: Record<string, string>
}

const getFleetColumns = ({ driverNameById, warehouseNameById }: FleetColumnMaps): ColumnDef<Vehicle>[] => [
  {
    id: 'vehicle',
    accessorFn: row => row.id,
    meta: { filterVariant: 'text', label: 'Vehicle' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Vehicle' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const v = row.original

      return (
        v.id.toLowerCase().includes(search) ||
        Boolean(v.registrationNo?.toLowerCase().includes(search)) ||
        Boolean(v.make?.toLowerCase().includes(search)) ||
        Boolean(v.model?.toLowerCase().includes(search))
      )
    },
    cell: ({ row }) => {
      const v = row.original
      const TypeIcon = v.type === 'motorcycle' ? BikeIcon : TruckIcon

      return (
        <div className='flex items-center gap-3'>
          <span className='bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md'>
            <TypeIcon className='size-4' />
          </span>
          <div className='flex flex-col'>
            <span className='text-foreground font-semibold'>
              {v.isDraft && isDraftId(v.id) ? 'Untitled vehicle' : v.id}
            </span>
            <span className='text-muted-foreground text-xs'>
              {v.make} {v.model}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    id: 'registration',
    accessorKey: 'registrationNo',
    meta: { label: 'Registration' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Registration' />,
    cell: ({ row }) => <span>{row.original.registrationNo || '—'}</span>
  },
  {
    id: 'type',
    accessorKey: 'type',
    meta: { filterVariant: 'select', label: 'Type' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => <span>{VEHICLE_TYPE_LABEL[row.original.type]}</span>
  },
  {
    id: 'assignedDriver',
    accessorFn: row => driverNameById[row.assignedDriverId ?? ''] ?? '',
    meta: { label: 'Assigned Driver' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Assigned Driver' />,
    cell: ({ row }) => {
      const name = driverNameById[row.original.assignedDriverId ?? '']

      return name ? <span>{name}</span> : <span className='text-muted-foreground'>—</span>
    }
  },
  {
    id: 'assignment',
    accessorFn: row => row.currentAssignment?.shipmentName ?? '',
    enableSorting: false,
    meta: { label: 'Current Assignment' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Current Assignment' />,
    cell: ({ row }) => {
      const assignment = row.original.currentAssignment

      if (!assignment) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{assignment.shipmentName}</span>
          <span className='text-muted-foreground text-xs'>
            {assignment.origin} → {assignment.destination}
          </span>
        </div>
      )
    }
  },
  {
    id: 'homeWarehouse',
    accessorFn: row => warehouseNameById[row.homeWarehouseId ?? ''] ?? '',
    meta: { label: 'Home Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Home Warehouse' />,
    filterFn: (row, _id, value) => value === 'all' || row.original.homeWarehouseId === value,
    cell: ({ row }) => {
      const name = warehouseNameById[row.original.homeWarehouseId ?? '']

      return name ? <span>{name}</span> : <span className='text-muted-foreground'>—</span>
    }
  },
  {
    id: 'capacity',
    accessorFn: row => getCapacityKg(row),
    meta: { label: 'Capacity' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Capacity' />,
    cell: ({ row }) => <span className='tabular-nums'>{getCapacityKg(row.original).toLocaleString()} kg</span>
  },
  {
    id: 'mileage',
    accessorFn: row => row.odometerKm ?? 0,
    meta: { label: 'Mileage' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Mileage' />,
    cell: ({ row }) => <span className='tabular-nums'>{(row.original.odometerKm ?? 0).toLocaleString()} km</span>
  },
  {
    id: 'status',
    accessorFn: row => (row.isDraft ? 'draft' : (row.operationalStatus ?? 'available')),
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const key = row.original.isDraft ? 'draft' : (row.original.operationalStatus ?? 'available')
      const badge = VEHICLE_STATUS_BADGE[key]

      return <Badge className={badge.className}>{badge.label}</Badge>
    }
  },
  {
    id: 'nextMaintenance',
    accessorFn: row => getMaintenanceStatus(row).label,
    enableSorting: false,
    meta: { label: 'Next Maintenance' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Next Maintenance' />,
    cell: ({ row }) => {
      const status = getMaintenanceStatus(row.original)

      return (
        <div className='flex flex-col'>
          <span>{status.label}</span>
          {status.detail && status.detail !== '—' && (
            <span className='text-muted-foreground text-xs'>{status.detail}</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'maintenanceStatus',
    accessorFn: row => getMaintenanceStatus(row).severity,
    enableHiding: true,
    enableSorting: false,
    meta: { filterVariant: 'select', label: 'Maintenance status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Maintenance status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const severity = getMaintenanceStatus(row.original).severity

      return MAINTENANCE_STATUS_OPTIONS.find(option => option.value === severity)?.label ?? severity
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <VehicleRowActions vehicle={row.original} />
  }
]

export default getFleetColumns
