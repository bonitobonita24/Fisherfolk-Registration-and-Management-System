'use client'

// Third-party Imports
import { DownloadIcon, FileTextIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type TransferAttachmentsNotesProps = {
  t: StockTransfer
}

const TransferAttachmentsNotes = ({ t }: TransferAttachmentsNotesProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Attachments & Notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 p-4'>
        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs'>Attachments</p>
          {t.attachments.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No attachments on this transfer.</p>
          ) : (
            <div className='space-y-2'>
              {t.attachments.map(attachment => (
                <div key={attachment.id} className='bg-muted flex items-center justify-between gap-3 rounded-md p-3'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md'>
                      <FileTextIcon className='size-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{attachment.name}</p>
                      <p className='text-muted-foreground text-xs'>{attachment.sizeLabel}</p>
                    </div>
                  </div>

                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={`Download ${attachment.name}`}
                    onClick={() => toast('Downloading attachment')}
                  >
                    <DownloadIcon className='size-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className='space-y-2'>
          <p className='text-muted-foreground text-xs'>Notes</p>
          <p className='text-sm whitespace-pre-line'>{t.notes || 'No notes added.'}</p>
          <p className='text-muted-foreground text-xs'>Added by {t.createdBy}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransferAttachmentsNotes
