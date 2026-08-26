// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type NotesCardProps = {
  client: Client
}

const NotesCard = ({ client }: NotesCardProps) => {
  // Vars
  const updatedAt = client.notesUpdatedAt ? format(new Date(client.notesUpdatedAt), 'dd MMM yyyy') : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {client.notes ? (
          <p className='text-sm whitespace-pre-line'>{client.notes}</p>
        ) : (
          <p className='text-muted-foreground py-2 text-center text-sm'>No notes yet.</p>
        )}
        {client.notes && client.notesUpdatedBy && (
          <p className='text-muted-foreground text-xs'>
            Updated by {client.notesUpdatedBy}
            {updatedAt && ` · ${updatedAt}`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default NotesCard
