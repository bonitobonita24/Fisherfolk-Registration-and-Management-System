'use client'

// Third-party Imports
import { Controller, type Control } from 'react-hook-form'
import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon } from 'lucide-react'

// Type Imports
import type { CreateVehicleFormInput } from '../vehicle-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// Shared Imports
import DatePicker from '@/components/shared/date-picker'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

// Props
type ComplianceDocumentsSectionProps = {
  control: Control<CreateVehicleFormInput>
}

const ComplianceDocumentsSection = ({ control }: ComplianceDocumentsSectionProps) => {
  // Hooks
  const [{ files, isDragging, errors }, actions] = useFileUpload({
    multiple: true,
    maxSize: 10 * 1024 * 1024,
    accept: '.pdf,.jpg,.jpeg,.png'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance &amp; Documents</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <FieldGroup className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Controller
            name='insuranceExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-insurance-expiry'>Insurance Expiry</FieldLabel>
                <DatePicker id='vehicle-insurance-expiry' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name='registrationExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-registration-expiry'>Registration Expiry</FieldLabel>
                <DatePicker id='vehicle-registration-expiry' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name='inspectionExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-inspection-expiry'>Inspection Expiry</FieldLabel>
                <DatePicker id='vehicle-inspection-expiry' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name='permitNumber'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-permit'>Permit Number</FieldLabel>
                <Input id='vehicle-permit' placeholder='e.g. PRM-99120' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />
        </FieldGroup>

        <Field>
          <FieldLabel htmlFor='vehicle-attachments'>Attachments</FieldLabel>
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
              id='vehicle-attachments'
              className='sr-only'
              aria-label='Upload compliance documents'
            />
            <UploadIcon className='size-8 stroke-1' />
            <div>
              <p className='font-medium'>Drag &amp; drop files or click to upload</p>
              <p className='text-muted-foreground text-sm'>
                Insurance, registration or inspection PDFs up to 10MB each
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

export default ComplianceDocumentsSection
