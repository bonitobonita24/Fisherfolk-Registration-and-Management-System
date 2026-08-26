'use client'

// Third-party Imports
import { toast } from 'sonner'
import {
  AlertCircleIcon,
  DownloadIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UploadCloudIcon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { ClientDocument } from '@/types/entities/client'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, FieldLabel } from '@/components/ui/field'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

// Props
type DocumentsSectionProps = {
  documents?: ClientDocument[]
}

const DocumentsSection = ({ documents }: DocumentsSectionProps) => {
  // Hooks
  const [{ files, isDragging, errors }, actions] = useFileUpload({
    multiple: true,
    maxSize: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png'
  })

  // Vars
  const savedDocuments = documents ?? []

  return (
    <section className='space-y-6 p-4 sm:p-6'>
      <h2 className='text-base font-semibold'>Documents</h2>

      {savedDocuments.length > 0 && (
        <ul className='space-y-2'>
          {savedDocuments.map(doc => (
            <li key={doc.id} className='flex items-center justify-between gap-3 rounded-md border p-3'>
              <div className='flex min-w-0 items-center gap-3'>
                <span className='bg-muted text-muted-foreground grid size-10 shrink-0 place-items-center rounded-md'>
                  <FileTextIcon className='size-5' />
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{doc.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {doc.type.toUpperCase()} · {doc.sizeLabel} · Uploaded {doc.uploadedAt}
                  </p>
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                <Button type='button' variant='outline' size='sm' onClick={actions.openFileDialog}>
                  Replace
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
                    <DropdownMenuItem onClick={() => toast('Download coming soon')}>
                      <DownloadIcon data-icon='inline-start' />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem variant='destructive' onClick={() => toast('Remove coming soon')}>
                      <Trash2Icon data-icon='inline-start' />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Field>
        <FieldLabel htmlFor='client-attachments'>Supporting documents (optional)</FieldLabel>
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
            id='client-attachments'
            className='sr-only'
            aria-label='Upload client documents'
          />
          <UploadCloudIcon className='text-muted-foreground size-8 stroke-1' />
          <div>
            <p className='font-medium'>Drag and drop files here, or click to browse</p>
            <p className='text-muted-foreground text-sm'>PDF, PNG, JPG up to 10MB each</p>
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
