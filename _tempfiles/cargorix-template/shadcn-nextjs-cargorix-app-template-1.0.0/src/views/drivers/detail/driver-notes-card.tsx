// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DriverNotesCardProps = {
  driver: Driver
}

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '')

const DriverNotesCard = ({ driver }: DriverNotesCardProps) => {
  // Vars
  const updatedAt = formatDate(driver.notesUpdatedAt)

  return (
    <Card className='max-lg:order-2'>
      <CardHeader>
        <CardTitle>Driver Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {driver.notes ? (
          <>
            <p className='text-sm'>{driver.notes}</p>
            {driver.notesUpdatedBy && updatedAt && (
              <p className='text-muted-foreground text-xs'>
                Last updated by {driver.notesUpdatedBy} on {updatedAt}
              </p>
            )}
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>No notes.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default DriverNotesCard
