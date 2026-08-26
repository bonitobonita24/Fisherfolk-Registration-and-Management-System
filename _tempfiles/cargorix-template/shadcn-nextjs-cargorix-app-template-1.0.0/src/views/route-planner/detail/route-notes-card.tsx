// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Route } from '@/types/entities/route'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RouteNotesCardProps = {
  route: Route
}

const RouteNotesCard = ({ route }: RouteNotesCardProps) => {
  // Vars
  const createdAt = route.createdAt ? new Date(route.createdAt) : null
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime()) ? format(createdAt, 'dd MMM yyyy') : ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {route.notes ? (
          <>
            <p className='text-sm'>{route.notes}</p>
            {route.createdBy && createdLabel && (
              <p className='text-muted-foreground text-xs'>
                Added by {route.createdBy} on {createdLabel}
              </p>
            )}
          </>
        ) : (
          <p className='text-muted-foreground text-sm'>No notes on this route.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default RouteNotesCard
