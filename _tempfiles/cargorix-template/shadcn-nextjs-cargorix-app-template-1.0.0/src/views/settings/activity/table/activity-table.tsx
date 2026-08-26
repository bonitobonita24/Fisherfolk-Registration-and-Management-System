'use client'

// React Imports
import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

// Third-party Imports
import type { OnChangeFn, VisibilityState } from '@tanstack/react-table'

// Type Imports
import type { ActivityEvent } from '@/types/pages/activity-log'

// Component Imports
import { Card } from '@/components/ui/card'
import getActivityColumns from './columns'

// Shared Imports
import DataTable from '@/components/shared/data-table'
import TablePagination from '@/components/shared/table-pagination'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

type ActivityTableProps = {
  events: ActivityEvent[]
  columnVisibility: VisibilityState
  onColumnVisibilityChange: OnChangeFn<VisibilityState>
  toolbar?: ReactNode
}

const ActivityTable = ({ events, columnVisibility, onColumnVisibilityChange, toolbar }: ActivityTableProps) => {
  // Vars
  const columns = useMemo(() => getActivityColumns(), [])

  // Hooks
  const table = useEntityTable({
    data: events,
    columns,
    getRowId: row => row.id,
    initialSorting: [{ id: 'at', desc: true }],
    columnVisibility,
    onColumnVisibilityChange
  })

  useEffect(() => {
    if (table.getState().pagination.pageIndex !== 0) table.setPageIndex(0)
  }, [events, table])

  return (
    <Card className='gap-0 py-0'>
      {toolbar}
      <DataTable table={table} columnCount={columns.length} emptyMessage='No activity found.' scrollable />
      <TablePagination table={table} noun='events' />
    </Card>
  )
}

export default ActivityTable
