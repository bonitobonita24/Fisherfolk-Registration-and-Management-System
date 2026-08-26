'use client'

// React Imports
import { useCallback, useMemo } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { ShieldIcon } from 'lucide-react'
import { toast } from 'sonner'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import getComplianceAvailabilityColumns from './columns'

// Shared Imports
import DataTable from '@/components/shared/data-table'
import TablePagination from '@/components/shared/table-pagination'
import TableToolbar from '@/components/shared/table-toolbar'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'

// Hook Imports
import { useEntityTable } from '@/hooks/use-entity-table'

// Util Imports
import { getComplianceAvailabilityRows } from '@/lib/selectors/drivers-selectors'

const ComplianceAvailabilityCard = () => {
  // Vars
  const drivers = useDriversStore(state => state.drivers)

  const data = useMemo(() => getComplianceAvailabilityRows(drivers), [drivers])

  // Hooks
  const router = useRouter()

  const handleViewDetails = useCallback((id: string) => router.push(`/drivers/${id}`), [router])
  const handleSendReminder = useCallback(() => toast('Reminder sent'), [])

  const columns = useMemo(
    () => getComplianceAvailabilityColumns({ onViewDetails: handleViewDetails, onSendReminder: handleSendReminder }),
    [handleViewDetails, handleSendReminder]
  )

  // Hooks
  const table = useEntityTable({
    data,
    columns,
    getRowId: row => row.id
  })

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='flex items-center justify-between gap-3 border-b p-4'>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          <ShieldIcon className='size-5' />
          Compliance & Availability
        </CardTitle>
        <CardAction>
          <Button
            variant='outline'
            size='sm'
            className='w-fit'
            onClick={() => toast('Compliance overview coming soon')}
          >
            View all compliance
          </Button>
        </CardAction>
      </CardHeader>
      <TableToolbar
        table={table}
        search={{ columnId: 'driver', label: 'Search compliance and availability', placeholder: 'Search drivers...' }}
        compact
      />
      <DataTable
        table={table}
        columnCount={columns.length}
        emptyMessage='No compliance or availability alerts.'
        rowHref={row => `/drivers/${row.id}`}
        rowLabel={row => `Open driver ${row.name}`}
      />
      <TablePagination table={table} noun='drivers' />
    </Card>
  )
}

export default ComplianceAvailabilityCard
