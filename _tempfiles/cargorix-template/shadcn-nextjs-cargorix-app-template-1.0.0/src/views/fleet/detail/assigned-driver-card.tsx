// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AssignedDriverCardProps = {
  vehicle: Vehicle
  driver?: Driver
}

const AssignedDriverCard = ({ vehicle, driver }: AssignedDriverCardProps) => {
  // Vars
  const hasDriver = Boolean(vehicle.assignedDriverId && driver)

  const rows: { label: string; value: string }[] = [
    { label: 'Phone', value: driver?.phone ?? '—' },
    { label: 'Email', value: driver?.email ?? '—' },
    { label: 'License No.', value: driver?.licenseNumber ?? '—' },
    {
      label: 'License Expiry',
      value: driver?.licenseExpiry ? format(new Date(driver.licenseExpiry), 'd MMM yyyy') : '—'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Driver</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {hasDriver && driver ? (
          <>
            <div className='flex items-center gap-3'>
              <Avatar className='size-10'>
                {driver.avatarUrl && <AvatarImage src={driver.avatarUrl} alt={driver.name} />}
                <AvatarFallback>{driver.initials}</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <div className='flex items-center gap-2'>
                  <p className='truncate font-medium'>{driver.name}</p>
                  <Badge className='bg-primary text-primary-foreground'>Primary</Badge>
                </div>
                <p className='text-muted-foreground text-xs'>{driver.id.toUpperCase()}</p>
              </div>
            </div>
            <dl className='space-y-3 text-sm'>
              {rows.map(row => (
                <div key={row.label} className='flex items-center justify-between gap-4'>
                  <dt className='text-muted-foreground'>{row.label}</dt>
                  <dd className='font-medium'>{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>No driver assigned.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default AssignedDriverCard
