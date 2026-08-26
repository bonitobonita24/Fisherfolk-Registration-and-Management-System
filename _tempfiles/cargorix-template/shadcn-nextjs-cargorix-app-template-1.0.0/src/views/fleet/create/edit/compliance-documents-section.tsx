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
  const [{ files, errors }, actions] = useFileUpload({
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
            name='insuranceProvider'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-insurance-provider'>Insurance Provider</FieldLabel>
                <Input
                  id='vehicle-insurance-provider'
                  placeholder='e.g. Progressive Commercial'
                  {...field}
                  value={field.value ?? ''}
                />
              </Field>
            )}
          />

          <Controller
            name='insurancePolicyNo'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-policy-number'>Policy Number</FieldLabel>
                <Input id='vehicle-policy-number' placeholder='e.g. POL-4820193' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='insuranceExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-insurance-valid-until'>Insurance Valid Until</FieldLabel>
                <DatePicker id='vehicle-insurance-valid-until' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name='emissionsCertNumber'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-emissions-cert'>Emissions Cert Number</FieldLabel>
                <Input id='vehicle-emissions-cert' placeholder='e.g. EMS-11209' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='emissionsExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-emissions-valid-until'>Emissions Valid Until</FieldLabel>
                <DatePicker id='vehicle-emissions-valid-until' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name='inspectionCertNumber'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-inspection-cert'>Inspection Cert Number</FieldLabel>
                <Input id='vehicle-inspection-cert' placeholder='e.g. INS-33071' {...field} value={field.value ?? ''} />
              </Field>
            )}
          />

          <Controller
            name='inspectionExpiry'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='vehicle-inspection-valid-until'>Inspection Valid Until</FieldLabel>
                <DatePicker id='vehicle-inspection-valid-until' value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>

        <Field>
          <div className='flex items-center justify-between gap-4'>
            <FieldLabel htmlFor='vehicle-documents'>Documents</FieldLabel>
            <Button type='button' variant='outline' size='sm' onClick={actions.openFileDialog}>
              <UploadIcon className='size-4' />
              Upload
            </Button>
          </div>
          <input
            {...actions.getInputProps()}
            id='vehicle-documents'
            className='sr-only'
            aria-label='Upload vehicle documents'
          />

          {files.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {files.map(file => (
                <div key={file.id} className='bg-muted flex items-center gap-2 rounded-md px-3 py-2'>
                  <FileTextIcon className='size-4 shrink-0' />
                  <span className='max-w-40 truncate text-sm font-medium'>{file.file.name}</span>
                  <span className='text-muted-foreground text-xs'>{formatBytes(file.file.size)}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    onClick={() => actions.removeFile(file.id)}
                    aria-label='Remove document'
                  >
                    <XIcon className='size-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>No documents uploaded yet.</p>
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
