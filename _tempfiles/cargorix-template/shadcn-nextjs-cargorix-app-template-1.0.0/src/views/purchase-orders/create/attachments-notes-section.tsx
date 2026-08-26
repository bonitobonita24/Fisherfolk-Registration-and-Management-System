'use client'

// Third-party Imports
import { Controller, useFieldArray, type Control } from 'react-hook-form'
import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon } from 'lucide-react'

// Type Imports
import type { CreatePurchaseOrderFormInput } from './create-purchase-order-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

const INTERNAL_NOTES_MAX_LENGTH = 1000

// Props
type AttachmentsNotesSectionProps = {
  control: Control<CreatePurchaseOrderFormInput>
  isTerminal: boolean
}

const AttachmentsNotesSection = ({ control, isTerminal }: AttachmentsNotesSectionProps) => {
  // Hooks
  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' })

  const [
    { isDragging, errors },
    { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps }
  ] = useFileUpload({
    multiple: true,
    onFilesAdded: addedFiles => {
      addedFiles.forEach(item => {
        if (item.file instanceof File) {
          append({ id: item.id, name: item.file.name, sizeLabel: formatBytes(item.file.size), type: item.file.type })
        }
      })
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments & Internal notes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Field>
          <FieldLabel htmlFor='po-attachments'>Attachments</FieldLabel>
          <div
            role='button'
            tabIndex={0}
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            className='border-input data-[dragging=true]:bg-accent/50 flex min-h-32 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center'
          >
            <input {...getInputProps()} id='po-attachments' className='sr-only' aria-label='Upload attachments' />
            <UploadIcon className='size-8 stroke-1' />
            <div>
              <p className='font-medium'>Drag & drop files or click to upload</p>
              <p className='text-muted-foreground text-sm'>Purchase order documents, invoices, quotes</p>
            </div>
            <Button type='button' variant='outline' size='sm' onClick={openFileDialog}>
              Choose files
            </Button>
          </div>

          {fields.length > 0 && (
            <div className='space-y-2'>
              {fields.map((attachment, index) => (
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
                  {!isTerminal && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(index)}
                      aria-label='Remove attachment'
                    >
                      <XIcon className='size-4' />
                    </Button>
                  )}
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

        <Controller
          name='internalNotes'
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='po-internal-notes'>Internal notes</FieldLabel>
              <Textarea
                id='po-internal-notes'
                rows={4}
                maxLength={INTERNAL_NOTES_MAX_LENGTH}
                placeholder='Notes for internal use only — not shared with the supplier'
                {...field}
              />
              <p className='text-muted-foreground text-right text-xs tabular-nums'>
                {(field.value ?? '').length} / {INTERNAL_NOTES_MAX_LENGTH}
              </p>
            </Field>
          )}
        />
      </CardContent>
    </Card>
  )
}

export default AttachmentsNotesSection
