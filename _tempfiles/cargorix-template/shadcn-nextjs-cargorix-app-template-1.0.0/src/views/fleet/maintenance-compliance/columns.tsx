'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { EyeIcon } from 'lucide-react'

// Type Imports
import type { MaintenanceComplianceRow } from '@/lib/selectors/fleet-selectors'

// Component Imports
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const getMaintenanceComplianceColumns = (): ColumnDef<MaintenanceComplianceRow>[] => [
  {
    id: 'vehicle',
    accessorFn: row => row.label,
    meta: { filterVariant: 'text', label: 'Vehicle' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Vehicle' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const r = row.original

      return (
        r.label.toLowerCase().includes(search) ||
        r.registrationNo.toLowerCase().includes(search) ||
        r.nextServiceLabel.toLowerCase().includes(search) ||
        r.inspectionIssues.some(issue => issue.toLowerCase().includes(search))
      )
    },
    cell: ({ row }) => <span className='text-foreground font-medium'>{row.original.label}</span>
  },
  {
    id: 'registration',
    accessorKey: 'registrationNo',
    meta: { label: 'Registration' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Registration' />,
    cell: ({ row }) => <span>{row.original.registrationNo}</span>
  },
  {
    id: 'nextService',
    accessorFn: row => row.nextServiceLabel,
    enableSorting: false,
    meta: { label: 'Next Service Due' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Next Service Due' />,
    cell: ({ row }) => {
      const { nextServiceLabel, nextServiceDetail } = row.original

      return (
        <div className='flex flex-col'>
          <span>{nextServiceLabel}</span>
          {nextServiceDetail && nextServiceDetail !== '—' && (
            <span className='text-muted-foreground text-xs'>{nextServiceDetail}</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'registrationExpiry',
    accessorFn: row => row.registrationExpiry ?? '',
    meta: { label: 'Registration Expiry' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Registration Expiry' />,
    cell: ({ row }) => <span>{formatDate(row.original.registrationExpiry)}</span>
  },
  {
    id: 'insuranceExpiry',
    accessorFn: row => row.insuranceExpiry ?? '',
    meta: { label: 'Insurance Expiry' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Insurance Expiry' />,
    cell: ({ row }) => <span>{formatDate(row.original.insuranceExpiry)}</span>
  },
  {
    id: 'inspectionIssues',
    accessorFn: row => row.inspectionIssues.length,
    enableSorting: false,
    meta: { label: 'Inspection Issues' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Inspection Issues' />,
    cell: ({ row }) => {
      const issues = row.original.inspectionIssues

      if (!issues.length) return <span className='text-muted-foreground'>—</span>

      return (
        <ul className='text-muted-foreground list-disc space-y-0.5 pl-4 text-xs'>
          {issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
      )
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              aria-label={`View ${row.original.label}`}
              nativeButton={false}
              render={<Link href={`/fleet/${row.original.id}`} />}
            />
          }
        >
          <EyeIcon className='size-4' />
        </TooltipTrigger>
        <TooltipContent>View</TooltipContent>
      </Tooltip>
    )
  }
]

export default getMaintenanceComplianceColumns
