// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { getMaintenanceStatus } from '@/lib/selectors/fleet-selectors'

type MaintenanceHistoryCardProps = {
  vehicle: Vehicle
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const MaintenanceHistoryCard = ({ vehicle }: MaintenanceHistoryCardProps) => {
  // Vars
  const maintenance = getMaintenanceStatus(vehicle)
  const history = vehicle.maintenanceHistory ?? []

  const summary: { label: string; value: string }[] = [
    { label: 'Last Service', value: formatDate(vehicle.lastServiceAt) },
    { label: 'Next Service', value: maintenance.label },
    { label: 'Current Mileage', value: vehicle.odometerKm ? `${vehicle.odometerKm.toLocaleString()} km` : '—' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance History</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {summary.map(item => (
            <div key={item.label} className='bg-muted/40 space-y-1 rounded-lg border p-3'>
              <p className='text-muted-foreground text-xs'>{item.label}</p>
              <p className='text-sm font-semibold'>{item.value}</p>
            </div>
          ))}
        </div>

        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className='text-right'>Mileage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-muted-foreground py-6 text-center text-sm'>
                    No maintenance records yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className='whitespace-nowrap'>{formatDate(record.date)}</TableCell>
                    <TableCell className='font-medium'>{record.type}</TableCell>
                    <TableCell className='text-muted-foreground'>{record.description}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell className='text-right tabular-nums'>{record.odometerKm.toLocaleString()} km</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default MaintenanceHistoryCard
