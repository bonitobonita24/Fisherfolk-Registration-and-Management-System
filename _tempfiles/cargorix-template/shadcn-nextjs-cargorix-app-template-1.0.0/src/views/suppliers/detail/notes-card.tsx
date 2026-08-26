// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type NotesCardProps = {
  supplier: Supplier
}

const NotesCard = ({ supplier }: NotesCardProps) => {
  // Vars
  const updatedAt = supplier.lastUpdatedAt ? format(new Date(supplier.lastUpdatedAt), 'dd MMM yyyy') : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {supplier.notes ? (
          <p className='text-sm whitespace-pre-line'>{supplier.notes}</p>
        ) : (
          <p className='text-muted-foreground py-2 text-center text-sm'>No notes yet.</p>
        )}
        {supplier.notes && updatedAt && supplier.lastUpdatedBy && (
          <p className='text-muted-foreground text-xs'>
            Last updated {updatedAt} by {supplier.lastUpdatedBy}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default NotesCard
