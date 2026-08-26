// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { BuildingIcon, CalendarIcon, CreditCardIcon, IdCardIcon, MailIcon, PhoneIcon } from 'lucide-react'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { getHomeHubName } from '@/lib/selectors/drivers-selectors'

type DriverInformationCardProps = {
  driver: Driver
  warehouses: Warehouse[]
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

const DriverInformationCard = ({ driver, warehouses }: DriverInformationCardProps) => {
  // Vars
  const rows: { label: string; value: string; icon: ReactNode }[] = [
    { label: 'Phone', value: driver.phone || '—', icon: <PhoneIcon className='size-4' /> },
    { label: 'Email', value: driver.email || '—', icon: <MailIcon className='size-4' /> },
    { label: 'Home Hub', value: getHomeHubName(driver, warehouses) || '—', icon: <BuildingIcon className='size-4' /> },
    { label: 'Employee ID', value: driver.employeeId || '—', icon: <IdCardIcon className='size-4' /> },
    { label: 'Date Joined', value: formatDate(driver.hireDate), icon: <CalendarIcon className='size-4' /> },
    { label: 'License No.', value: driver.licenseNumber || '—', icon: <CreditCardIcon className='size-4' /> }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
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

export default DriverInformationCard
