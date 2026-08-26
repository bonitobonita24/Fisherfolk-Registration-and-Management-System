'use client'

// React Imports
import { useEffect } from 'react'

// Third-party Imports
import { useController, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import { ImageIcon, UploadCloudIcon, XIcon } from 'lucide-react'

// Type Imports
import type { GeneralSettingsFormInput } from './general-settings-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'

// Hook Imports
import { useFileUpload } from '@/hooks/use-file-upload'

// Util Imports
import { cn } from '@/lib/utils'

// SVG Imports
import LogoSvg from '@/assets/svg/logo'

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/svg+xml'
const MAX_SIZE = 2 * 1024 * 1024

// Props
type BrandingCardProps = {
  control: Control<GeneralSettingsFormInput>
}

const BrandingCard = ({ control }: BrandingCardProps) => {
  // Hooks
  const { field } = useController({ control, name: 'logoName' })

  const [{ isDragging, errors }, actions] = useFileUpload({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    onFilesAdded: added => {
      const name = added[0]?.file.name

      if (!name) return

      field.onChange(name)
      toast.success(`${name} selected`)
    }
  })

  const { clearErrors } = actions

  const handleRemove = () => {
    actions.clearFiles()
    field.onChange(null)
  }

  useEffect(() => {
    if (errors.length === 0) return

    toast.error(errors[0])
    clearErrors()
  }, [errors, clearErrors])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-3'>
          <span className='bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <ImageIcon className='size-4' />
          </span>
          Branding
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          <Field>
            <FieldLabel htmlFor='gs-logo-button'>Company logo</FieldLabel>
            <div
              onDragEnter={actions.handleDragEnter}
              onDragLeave={actions.handleDragLeave}
              onDragOver={actions.handleDragOver}
              onDrop={actions.handleDrop}
              data-dragging={isDragging || undefined}
              className={cn(
                'border-input flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center transition-colors',
                'data-[dragging=true]:border-primary data-[dragging=true]:bg-accent'
              )}
            >
              <input {...actions.getInputProps()} className='sr-only' aria-label='Upload company logo' />
              <span className='bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg'>
                <UploadCloudIcon className='size-5' />
              </span>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Drag and drop your logo here</p>
                <p className='text-muted-foreground text-xs'>PNG, JPG or SVG (max. 2MB)</p>
                <p className='text-muted-foreground text-xs'>Recommended size: 512 × 512px</p>
              </div>
              <Button id='gs-logo-button' type='button' variant='outline' size='sm' onClick={actions.openFileDialog}>
                Choose file
              </Button>
            </div>
            {field.value ? (
              <div className='bg-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2'>
                <span className='truncate text-sm font-medium' title={field.value}>
                  {field.value}
                </span>
                <Button type='button' variant='ghost' size='icon' aria-label='Remove logo' onClick={handleRemove}>
                  <XIcon className='size-4' />
                </Button>
              </div>
            ) : null}
          </Field>

          <div className='flex flex-col gap-3'>
            <p className='text-sm font-medium'>Brand Mark Preview</p>
            <div className='bg-muted/40 min-size-44 flex flex-1 items-center justify-center rounded-2xl border p-6'>
              <LogoSvg className='size-20' />
            </div>
            <FieldDescription>This preview is how your brand will appear on documents and emails.</FieldDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BrandingCard
