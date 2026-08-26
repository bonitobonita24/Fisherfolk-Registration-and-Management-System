'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import { format, subDays } from 'date-fns'
import type { VisibilityState } from '@tanstack/react-table'

// Type Imports
import type { ActivityEvent, ActivityFilters } from '@/types/pages/activity-log'

import { DEFAULT_ACTIVITY_DAYS } from '@/types/pages/activity-log'

// Component Imports
import ActivityFilterBar from './activity-filter-bar'
import ActivityStats from './activity-stats'
import ActivityTable from './table/activity-table'

// Util Imports
import {
  buildActivityExport,
  filterActivityEvents,
  getActivityBounds,
  getActivityStats
} from '@/lib/selectors/activity-selectors'

type ActivityLogViewProps = {
  events: ActivityEvent[]
}

const ActivityLogView = ({ events }: ActivityLogViewProps) => {
  // Vars
  const bounds = useMemo(() => getActivityBounds(events), [events])
  const anchorDay = useMemo(() => format(bounds.last, 'yyyy-MM-dd'), [bounds])

  const defaultFilters = useMemo<ActivityFilters>(
    () => ({
      search: '',
      from: format(subDays(bounds.last, DEFAULT_ACTIVITY_DAYS - 1), 'yyyy-MM-dd'),
      to: format(bounds.last, 'yyyy-MM-dd')
    }),
    [bounds]
  )

  // States
  const [filters, setFilters] = useState<ActivityFilters>(defaultFilters)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const stats = useMemo(() => getActivityStats(events, anchorDay), [events, anchorDay])
  const filteredEvents = useMemo(() => filterActivityEvents(events, filters), [events, filters])

  const handleFilterChange = (patch: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  const handleColumnVisibilityChange = (id: string, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [id]: visible }))
  }

  const handleReset = () => {
    setFilters(defaultFilters)
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Activity Log</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          A read-only audit trail of every action taken across the workspace — who did it, what it touched, and whether
          it succeeded.
        </p>
      </div>

      <ActivityStats stats={stats} />

      <ActivityTable
        events={filteredEvents}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        toolbar={
          <ActivityFilterBar
            filters={filters}
            bounds={bounds}
            columnVisibility={columnVisibility}
            getExportTable={() => buildActivityExport(filteredEvents)}
            onFilterChange={handleFilterChange}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onReset={handleReset}
          />
        }
      />
    </div>
  )
}

export default ActivityLogView
