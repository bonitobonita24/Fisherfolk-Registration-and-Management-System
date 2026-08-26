'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { useController, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  AlertCircleIcon,
  DownloadIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { SupplierDocument, SupplierDocType } from '@/types/entities/supplier'
import type { CreateSupplierFormInput } from '../supplier-form-schema'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

const CURRENT_OPERATOR = 'You'

const toDocType = (name: string): SupplierDocType => {
  const extension = name.split('.').pop()?.toLowerCase()

  return extension === 'pdf' ? 'pdf' : extension === 'png' ? 'png' : 'jpg'
}

// Props
type DocumentsSectionProps = {
  control: Control<CreateSupplierFormInput>
  documents?: SupplierDocument[]
}

const DocumentsSection = ({ control, documents }: DocumentsSectionProps) => {
  // Hooks
  const [{ files, isDragging, errors }, actions] = useFileUpload({
    multiple: true,
    maxSize: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png'
  })

  const { field } = useController({ control, name: 'documents' })

  // Vars
  const savedDocuments = documents ?? []

  useEffect(() => {
    field.onChange([
      ...savedDocuments,
      ...files.map(file => ({
        id: file.id,
        name: file.file.name,
        type: toDocType(file.file.name),
        sizeLabel: formatBytes(file.file.size),
        uploadedAt: format(new Date(), 'yyyy-MM-dd'),
        uploadedBy: CURRENT_OPERATOR
      }))
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, documents])

  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <div className='flex items-center gap-3'>
        <span className='bg-accent text-accent-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
          <PaperclipIcon className='size-4' />
        </span>
        <h2 className='text-base font-semibold'>Documents</h2>
      </div>

      {savedDocuments.length > 0 && (
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedDocuments.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className='flex min-w-0 items-center gap-3'>
                      <span className='bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-md'>
                        <FileTextIcon className='size-4' />
                      </span>
                      <div className='min-w-0'>
                        <p className='truncate font-medium'>{doc.name}</p>
                        <p className='text-muted-foreground text-xs'>{doc.sizeLabel}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{doc.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground whitespace-nowrap'>
                    {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{doc.uploadedBy}</TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        aria-label={`Download ${doc.name}`}
                        onClick={() => toast('Download coming soon')}
                      >
                        <DownloadIcon className='size-4' />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className='size-8'
                              aria-label={`Actions for ${doc.name}`}
                            />
                          }
                        >
                          <MoreHorizontalIcon className='size-4' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-fit'>
                          <DropdownMenuItem onClick={actions.openFileDialog}>
                            <UploadCloudIcon data-icon='inline-start' />
                            Replace
                          </DropdownMenuItem>
                          <DropdownMenuItem variant='destructive' onClick={() => toast('Remove coming soon')}>
                            <Trash2Icon data-icon='inline-start' />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Field>
        <FieldLabel htmlFor='supplier-attachments'>Supporting documents (optional)</FieldLabel>
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
            id='supplier-attachments'
            className='sr-only'
            aria-label='Upload supplier documents'
          />
          <UploadCloudIcon className='text-muted-foreground size-8 stroke-1' />
          <div>
            <p className='font-medium'>Drag and drop files here or click to browse</p>
            <p className='text-muted-foreground text-sm'>Accepted formats: PDF, JPG, PNG (Max. 10MB)</p>
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
    </section>
  )
}

export default DocumentsSection
