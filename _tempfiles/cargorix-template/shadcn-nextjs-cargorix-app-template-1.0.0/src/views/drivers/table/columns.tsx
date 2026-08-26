'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { MailIcon, PhoneIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Util Imports
import { getHomeHubName } from '@/lib/selectors/drivers-selectors'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import DriverRowActions from './driver-row-actions'

// Util Imports
import { getLicenseSeverity } from '@/lib/selectors/drivers-selectors'
import { isDraftId } from '@/lib/is-draft-id'
import { cn } from '@/lib/utils'

// Data Imports
import { DRIVER_STATUS_BADGE, LICENSE_CLASS_LABEL, SHIFT_LABEL } from '../driver-badges'

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const getDriverColumns = (warehouses: Warehouse[]): ColumnDef<Driver>[] => [
  {
    id: 'driver',
    accessorFn: row => row.name,
    meta: { filterVariant: 'text', label: 'Driver' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Driver' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const d = row.original

      return (
        d.name.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search) ||
        Boolean(d.licenseNumber?.toLowerCase().includes(search)) ||
        Boolean(d.phone?.toLowerCase().includes(search))
      )
    },
    cell: ({ row }) => {
      const d = row.original

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarImage src={d.avatarUrl} alt={d.name} />
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{d.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-foreground font-semibold'>{d.name || 'Untitled draft'}</span>
            <span className='text-muted-foreground text-xs'>
              {d.isDraft && isDraftId(d.id) ? '—' : d.id.toUpperCase()}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    id: 'contact',
    accessorFn: row => row.phone ?? '',
    enableSorting: false,
    meta: { label: 'Contact' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Contact' />,
    cell: ({ row }) => {
      const d = row.original

      if (!d.phone && !d.email) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col gap-1 text-xs'>
          {d.phone && (
            <span className='text-muted-foreground flex items-center gap-1.5'>
              <PhoneIcon className='size-3.5' />
              {d.phone}
            </span>
          )}
          {d.email && (
            <span className='text-muted-foreground flex items-center gap-1.5'>
              <MailIcon className='size-3.5' />
              {d.email}
            </span>
          )}
        </div>
      )
    }
  },
  {
    id: 'license',
    accessorFn: row => row.licenseNumber ?? '',
    meta: { label: 'License' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='License' />,
    cell: ({ row }) => {
      const d = row.original

      if (!d.licenseNumber) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{d.licenseNumber}</span>
          {d.licenseClass && (
            <span className='text-muted-foreground text-xs'>{LICENSE_CLASS_LABEL[d.licenseClass]}</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'assignedVehicle',
    accessorFn: row => row.assignedVehicle?.vehicleNo ?? '',
    enableSorting: false,
    meta: { label: 'Assigned Vehicle' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Assigned Vehicle' />,
    cell: ({ row }) => {
      const vehicle = row.original.assignedVehicle

      if (!vehicle) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{vehicle.vehicleNo}</span>
          <span className='text-muted-foreground text-xs'>
            {vehicle.make} {vehicle.model}
          </span>
        </div>
      )
    }
  },
  {
    id: 'assignment',
    accessorFn: row => row.currentAssignment?.routeName ?? '',
    enableSorting: false,
    meta: { label: 'Current Assignment' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Current Assignment' />,
    cell: ({ row }) => {
      const assignment = row.original.currentAssignment

      if (!assignment) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{assignment.routeName}</span>
          <span className='text-muted-foreground text-xs'>ETA: {assignment.etaLabel}</span>
        </div>
      )
    }
  },
  {
    id: 'homeHub',
    accessorFn: row => row.homeHubId ?? '',
    meta: { filterVariant: 'select', label: 'Home Hub' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Home Hub' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      const hub = getHomeHubName(row.original, warehouses)

      return hub ? <span>{hub}</span> : <span className='text-muted-foreground'>—</span>
    }
  },
  {
    id: 'shift',
    accessorFn: row => row.shift ?? '',
    meta: { label: 'Shift' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Shift' />,
    cell: ({ row }) => {
      const d = row.original

      if (!d.shift) return <span className='text-muted-foreground'>—</span>

      return (
        <div className='flex flex-col'>
          <span>{SHIFT_LABEL[d.shift]}</span>
          {d.shiftHours && <span className='text-muted-foreground text-xs'>{d.shiftHours}</span>}
        </div>
      )
    }
  },
  {
    id: 'status',
    accessorFn: row => (row.isDraft ? 'draft' : (row.employmentStatus ?? 'inactive')),
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value,
    cell: ({ row }) => {
      if (row.original.isDraft) return <Badge className='bg-muted text-muted-foreground'>Draft</Badge>

      const key = row.original.employmentStatus ?? 'inactive'
      const badge = DRIVER_STATUS_BADGE[key]

      return (
        <span className='inline-flex items-center gap-2'>
          <span className={cn('size-2 shrink-0 rounded-full', badge.dot)} />
          <Badge className={badge.className}>{badge.label}</Badge>
        </span>
      )
    }
  },
  {
    id: 'licenseExpiry',
    accessorFn: row => row.licenseExpiry ?? '',
    meta: { label: 'License Expiry' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='License Expiry' />,
    cell: ({ row }) => {
      const expiry = row.original.licenseExpiry

      if (!expiry) return <span className='text-muted-foreground'>—</span>

      const severity = getLicenseSeverity(expiry)
      const relative = formatDistanceToNowStrict(new Date(expiry), { addSuffix: true })

      return (
        <div className='flex flex-col'>
          <span>{formatDate(expiry)}</span>
          <span
            className={cn(
              'text-xs',
              severity === 'expired'
                ? 'text-destructive'
                : severity === 'expiring'
                  ? 'text-warning'
                  : 'text-muted-foreground'
            )}
          >
            {relative}
          </span>
        </div>
      )
    }
  },
  {
    id: 'licenseSeverity',
    accessorFn: row => getLicenseSeverity(row.licenseExpiry),
    enableHiding: true,
    enableSorting: false,
    meta: { filterVariant: 'select', label: 'License status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='License status' />,
    filterFn: (row, id, value) => value === 'all' || row.getValue(id) === value
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <DriverRowActions driver={row.original} />
  }
]

export default getDriverColumns
