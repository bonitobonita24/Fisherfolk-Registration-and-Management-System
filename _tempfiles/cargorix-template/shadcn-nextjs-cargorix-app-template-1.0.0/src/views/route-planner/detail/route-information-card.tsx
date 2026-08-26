// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import {
  ClockIcon,
  FlagIcon,
  GaugeIcon,
  MapPinIcon,
  PackageIcon,
  RouteIcon,
  TruckIcon,
  UserRoundIcon
} from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Route, RouteTotals } from '@/types/entities/route'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RouteInformationCardProps = {
  route: Route
  driver?: Driver
  vehicle?: Vehicle
  totals: RouteTotals
  estimatedEnd: string
}

const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

const RouteInformationCard = ({ route, driver, vehicle, totals, estimatedEnd }: RouteInformationCardProps) => {
  // Vars
  const rows: { label: string; value: string; icon: ReactNode }[] = [
    { label: 'Driver', value: driver?.name ?? '—', icon: <UserRoundIcon className='size-4' /> },
    {
      label: 'Vehicle',
      value: vehicle?.registrationNo ?? vehicle?.id.toUpperCase() ?? '—',
      icon: <TruckIcon className='size-4' />
    },
    { label: 'Start Time', value: route.startTime || '—', icon: <ClockIcon className='size-4' /> },
    { label: 'Estimated End', value: estimatedEnd, icon: <FlagIcon className='size-4' /> },
    { label: 'Distance', value: `${totals.distanceKm} km`, icon: <RouteIcon className='size-4' /> },
    { label: 'Duration', value: formatDuration(totals.durationMinutes), icon: <GaugeIcon className='size-4' /> },
    { label: 'Stops', value: `${totals.stopCount}`, icon: <MapPinIcon className='size-4' /> },
    {
      label: 'Packages',
      value: `${totals.packageCount.toLocaleString()} · ${totals.weightKg.toLocaleString()} kg`,
      icon: <PackageIcon className='size-4' />
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1'>
          {rows.map(row => (
            <div key={row.label} className='flex items-start gap-3'>
              <div className='bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg'>
                {row.icon}
              </div>
              <div className='min-w-0 space-y-0.5'>
                <dt className='text-muted-foreground text-xs'>{row.label}</dt>
                <dd className='truncate text-sm font-medium'>{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export default RouteInformationCard
