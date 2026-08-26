'use client'

// Third-party Imports
import { toast } from 'sonner'
import { format } from 'date-fns'
import { DownloadIcon, FileTextIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DocumentsCardProps = {
  supplier: Supplier
}

const DocumentsCard = ({ supplier }: DocumentsCardProps) => {
  // Vars
  const documents = supplier.documents ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className='text-muted-foreground py-2 text-center text-sm'>No documents uploaded.</p>
        ) : (
          <ul className='space-y-4'>
            {documents.map(doc => (
              <li key={doc.id} className='flex items-start gap-3'>
                <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
                  <FileTextIcon className='size-4' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium wrap-break-word'>{doc.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {doc.type.toUpperCase()} · {doc.sizeLabel} · Uploaded{' '}
                    {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 shrink-0'
                  aria-label={`Download ${doc.name}`}
                  onClick={() => toast('Download coming soon')}
                >
                  <DownloadIcon className='size-4' />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentsCard
