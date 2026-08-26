'use client'

// Third-party Imports
import type { ColumnDef } from '@tanstack/react-table'

// Type Imports
import type { UtilizationFilterValue } from '../warehouse-badges'
import type { WarehouseOverviewRow } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import DataTableColumnHeader from '@/components/shared/data-table/data-table-column-header'
import WarehouseRowActions from './warehouse-row-actions'

// Data Imports
import { WAREHOUSE_STATUS_BADGE, matchesUtilization } from '../warehouse-badges'

const getWarehouseColumns = (): ColumnDef<WarehouseOverviewRow>[] => [
  {
    id: 'select',
    size: 40,
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all warehouses'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.name}`}
      />
    )
  },
  {
    id: 'warehouse',
    accessorKey: 'name',
    meta: { filterVariant: 'text', label: 'Warehouse' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Warehouse' />,
    filterFn: (row, _id, value: string) => {
      const search = value.toLowerCase()
      const warehouse = row.original

      return (
        warehouse.name.toLowerCase().includes(search) ||
        warehouse.code.toLowerCase().includes(search) ||
        warehouse.manager.toLowerCase().includes(search) ||
        warehouse.location.toLowerCase().includes(search)
      )
    },
    cell: ({ row }) => (
      <div>
        <p className='font-medium'>{row.original.name}</p>
        <p className='text-muted-foreground text-xs'>{row.original.code}</p>
      </div>
    )
  },
  {
    id: 'location',
    accessorKey: 'location',
    meta: { filterVariant: 'select', label: 'Location' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />
  },
  {
    id: 'manager',
    accessorKey: 'manager',
    meta: { label: 'Manager' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Manager' />
  },
  {
    id: 'unitsStored',
    accessorKey: 'unitsStored',
    meta: { label: 'Units Stored' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Units Stored' />,
    cell: ({ row }) => <span className='tabular-nums'>{row.original.unitsStored.toLocaleString()}</span>
  },
  {
    id: 'skuCount',
    accessorKey: 'skuCount',
    meta: { label: 'SKUs' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='SKUs' />
  },
  {
    id: 'capacity',
    accessorKey: 'maxCapacity',
    meta: { label: 'Capacity' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Capacity' />,
    cell: ({ row }) => <span className='tabular-nums'>{row.original.maxCapacity.toLocaleString()}</span>
  },
  {
    id: 'utilization',
    accessorFn: row => row.utilizationPercent,
    meta: { label: 'Utilization' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Utilization' />,
    filterFn: (row, _id, value: UtilizationFilterValue) => matchesUtilization(row.original.utilizationPercent, value),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <Progress className='h-2 w-24' value={row.original.utilizationPercent} />
        <span className='text-sm tabular-nums'>{row.original.utilizationPercent}%</span>
      </div>
    )
  },
  {
    id: 'docks',
    accessorKey: 'dockCount',
    meta: { label: 'Docks' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Docks' />
  },
  {
    id: 'status',
    accessorKey: 'status',
    meta: { filterVariant: 'select', label: 'Status' },
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    filterFn: (row, id, value: string) => row.getValue(id) === value,
    cell: ({ row }) => {
      const status = WAREHOUSE_STATUS_BADGE[row.original.status]

      return <Badge className={status.className}>{status.label}</Badge>
    }
  },
  {
    id: 'actions',
    size: 60,
    enableHiding: false,
    enableSorting: false,
    meta: { label: 'Actions' },
    header: () => <span className='text-muted-foreground text-sm font-medium'>Actions</span>,
    cell: ({ row }) => <WarehouseRowActions warehouse={row.original} />
  }
]

export default getWarehouseColumns
