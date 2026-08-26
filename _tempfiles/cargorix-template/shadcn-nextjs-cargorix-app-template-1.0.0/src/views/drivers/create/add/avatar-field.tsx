'use client'

// Third-party Imports
import { UploadIcon, UserRoundIcon, XIcon } from 'lucide-react'

// Component Imports
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// Hook Imports
import { useFileUpload } from '@/hooks/use-file-upload'

// Props
type AvatarFieldProps = {
  value?: string
  onChange: (value: string) => void
  fallback: string
}

const AvatarField = ({ value, onChange, fallback }: AvatarFieldProps) => {
  // Hooks
  const [{ isDragging }, actions] = useFileUpload({
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024,
    onFilesAdded: added => {
      if (added[0]?.preview) onChange(added[0].preview)
    }
  })

  const handleRemove = () => {
    actions.clearFiles()
    onChange('')
  }

  return (
    <div
      onDragEnter={actions.handleDragEnter}
      onDragLeave={actions.handleDragLeave}
      onDragOver={actions.handleDragOver}
      onDrop={actions.handleDrop}
      data-dragging={isDragging || undefined}
      className='data-[dragging=true]:border-primary data-[dragging=true]:bg-accent/40 flex items-center gap-4 rounded-md border border-transparent'
    >
      <Avatar className='size-16'>
        <AvatarImage src={value || undefined} alt='Driver photo' />
        <AvatarFallback className='bg-muted text-muted-foreground'>
          {fallback || <UserRoundIcon className='size-6' />}
        </AvatarFallback>
      </Avatar>

      <div className='flex flex-wrap items-center gap-2'>
        <input {...actions.getInputProps()} className='sr-only' aria-label='Upload driver photo' />
        <Button type='button' variant='outline' size='sm' className='gap-2' onClick={actions.openFileDialog}>
          <UploadIcon className='size-4' />
          Upload photo
        </Button>
        {value && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground gap-1.5'
            onClick={handleRemove}
          >
            <XIcon className='size-4' />
            Remove
          </Button>
        )}
        <p className='text-muted-foreground w-full text-xs'>JPG or PNG up to 5MB — or drag &amp; drop.</p>
      </div>
    </div>
  )
}

export default AvatarField
