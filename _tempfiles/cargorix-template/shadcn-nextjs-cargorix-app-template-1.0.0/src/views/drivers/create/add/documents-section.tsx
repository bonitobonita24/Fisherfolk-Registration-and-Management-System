'use client'

// Third-party Imports
import { format } from 'date-fns'
import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon } from 'lucide-react'

// Type Imports
import type { DriverDocument } from '@/types/entities/driver'
import type { LicenseSeverity } from '@/lib/selectors/drivers-selectors'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

// Util Imports
import { getLicenseSeverity } from '@/lib/selectors/drivers-selectors'
import { DOC_TYPE_LABEL } from '../../driver-badges'

// Vars
const DOC_STATUS_BADGE: Record<LicenseSeverity, { label: string; className: string }> = {
  valid: { label: 'Valid', className: 'bg-success-soft text-success' },
  expiring: { label: 'Expiring', className: 'bg-warning-soft text-warning' },
  expired: { label: 'Expired', className: 'bg-destructive/10 text-destructive' }
}

const formatDate = (value: string) => (value ? format(new Date(value), 'dd MMM yyyy') : '—')

// Props
type DocumentsSectionProps = {
  documents?: DriverDocument[]
}

const DocumentsSection = ({ documents }: DocumentsSectionProps) => {
  // Hooks
  const [{ files, isDragging, errors }, actions] = useFileUpload({
    multiple: true,
    maxSize: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileTextIcon className='size-5' />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {documents && documents.length > 0 && (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => {
                  const status = DOC_STATUS_BADGE[getLicenseSeverity(doc.expiry)]

                  return (
                    <TableRow key={`${doc.type}-${doc.number}`}>
                      <TableCell className='font-medium'>{DOC_TYPE_LABEL[doc.type]}</TableCell>
                      <TableCell className='text-muted-foreground'>{doc.number}</TableCell>
                      <TableCell className='whitespace-nowrap'>{formatDate(doc.expiry)}</TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor='driver-attachments'>Attachments</FieldLabel>
          <div
            role='button'
            tabIndex={0}
            onClick={actions.openFileDialog}
            onDragEnter={actions.handleDragEnter}
            onDragLeave={actions.handleDragLeave}
            onDragOver={actions.handleDragOver}
            onDrop={actions.handleDrop}
            data-dragging={isDragging || undefined}
            className='border-input data-[dragging=true]:bg-accent/50 flex min-h-32 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center'
          >
            <input
              {...actions.getInputProps()}
              id='driver-attachments'
              className='sr-only'
              aria-label='Upload driver documents'
            />
            <UploadIcon className='size-8 stroke-1' />
            <div>
              <p className='font-medium'>Drag &amp; drop files or click to upload</p>
              <p className='text-muted-foreground text-sm'>
                License, medical card, background check or drug test PDFs up to 10MB each
              </p>
            </div>
            <Button type='button' variant='outline' size='sm' onClick={actions.openFileDialog}>
              Choose files
            </Button>
          </div>

          {files.length > 0 && (
            <div className='space-y-2'>
              {files.map(file => (
                <div key={file.id} className='bg-muted flex items-center justify-between gap-3 rounded-md p-3'>
                  <div className='flex min-w-0 items-center gap-3'>
                    <div className='bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md'>
                      <FileTextIcon className='size-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{file.file.name}</p>
                      <p className='text-muted-foreground text-xs'>{formatBytes(file.file.size)}</p>
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => actions.removeFile(file.id)}
                    aria-label='Remove file'
                  >
                    <XIcon className='size-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className='text-destructive flex items-center gap-1 text-xs' role='alert'>
              <AlertCircleIcon className='size-3 shrink-0' />
              <span>{errors[0]}</span>
            </div>
          )}
        </Field>
      </CardContent>
    </Card>
  )
}

export default DocumentsSection
