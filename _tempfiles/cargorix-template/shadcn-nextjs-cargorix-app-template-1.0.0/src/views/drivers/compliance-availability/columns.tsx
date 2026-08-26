'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, MoreHorizontalIcon } from 'lucide-react'

// Type Imports
import type { ComplianceAvailabilityRow, LicenseSeverity } from '@/lib/selectors/drivers-selectors'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'

// Util Imports
import { cn } from '@/lib/utils'

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const severityText = (severity: LicenseSeverity) =>
  severity === 'expired' ? 'text-destructive' : severity === 'expiring' ? 'text-warning' : 'text-muted-foreground'

const severityIcon = (severity: LicenseSeverity) => {
  if (severity === 'expired') return <AlertCircleIcon className='text-destructive size-4 shrink-0' />
  if (severity === 'expiring') return <AlertTriangleIcon className='text-warning size-4 shrink-0' />

  return <CheckCircleIcon className='text-success size-4 shrink-0' />
}

const renderDateCell = (date: string | undefined, severity: LicenseSeverity) => {
  if (!date) return <span className='text-muted-foreground'>—</span>

  return (
    <div className='flex items-center gap-2'>
      {severityIcon(severity)}
      <div className='flex flex-col'>
        <span>{formatDate(date)}</span>
        <span className={cn('text-xs', severityText(severity))}>
          {formatDistanceToNowStrict(new Date(date), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

type ComplianceColumnHandlers = {
  onViewDetails: (id: string) => void
  onSendReminder: () => void
}

const getComplianceAvailabilityColumns = ({
  onViewDetails,
  onSendReminder
}: ComplianceColumnHandlers): ColumnDef<ComplianceAvailabilityRow>[] => [
  {
    id: 'driver',
    accessorFn: row => row.name,
    meta: { filterVariant: 'text', label: 'Driver' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Driver' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const r = row.original

      return (
        r.name.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        r.availabilityLabel.toLowerCase().includes(search) ||
        Boolean(r.availabilityNote?.toLowerCase().includes(search)) ||
        r.notes.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => {
      const r = row.original

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarImage src={r.avatarUrl} alt={r.name} />
            <AvatarFallback className='bg-muted text-muted-foreground text-xs'>{r.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='font-medium'>{r.name}</span>
            <span className='text-muted-foreground text-xs'>{r.id.toUpperCase()}</span>
          </div>
        </div>
      )
    }
  },
  {
    id: 'licenseExpiry',
    accessorFn: row => row.licenseExpiry ?? '',
    meta: { label: 'License Expiry' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='License Expiry' />,
    cell: ({ row }) => renderDateCell(row.original.licenseExpiry, row.original.licenseSeverity)
  },
  {
    id: 'medicalExpiry',
    accessorFn: row => row.medicalExpiry ?? '',
    meta: { label: 'Medical Check Due' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Medical Check Due' />,
    cell: ({ row }) => renderDateCell(row.original.medicalExpiry, row.original.medicalSeverity)
  },
  {
    id: 'availability',
    accessorFn: row => row.availabilityLabel,
    meta: { label: 'Current Availability' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Current Availability' />,
    cell: ({ row }) => {
      const r = row.original

      return (
        <div className='flex flex-col'>
          <span className={cn('flex items-center gap-2', r.availabilityClassName)}>
            <span className={cn('size-2 shrink-0 rounded-full', r.availabilityDot)} />
            {r.availabilityLabel}
          </span>
          {r.availabilityNote && <span className='text-muted-foreground text-xs'>{r.availabilityNote}</span>}
        </div>
      )
    }
  },
  {
    id: 'notes',
    accessorKey: 'notes',
    enableSorting: false,
    meta: { label: 'Notes' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
    cell: ({ row }) => (
      <span
        className='text-muted-foreground block max-w-56 truncate text-sm'
        title={row.original.notes === '—' ? undefined : row.original.notes}
      >
        {row.original.notes}
      </span>
    )
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon' className='size-8' aria-label={`Actions for ${row.original.name}`} />
          }
        >
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          <DropdownMenuItem onClick={() => onViewDetails(row.original.id)}>View details</DropdownMenuItem>
          <DropdownMenuItem onClick={onSendReminder}>Send reminder</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
]

export default getComplianceAvailabilityColumns
