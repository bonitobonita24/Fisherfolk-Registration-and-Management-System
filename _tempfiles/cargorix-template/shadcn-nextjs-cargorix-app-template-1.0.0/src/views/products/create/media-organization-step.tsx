'use client'

// Third-party Imports
import { Controller } from 'react-hook-form'
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  PlusIcon,
  UploadIcon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { UseFormReturn } from 'react-hook-form'

import type { CreateProductFormInput, CreateProductFormValues } from './create-product-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import ChipInput from '@/components/shared/chip-input'

import WizardSideCard from './wizard-side-card'

// Hook Imports
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload'

type MediaOrganizationStepProps = {
  form: UseFormReturn<CreateProductFormInput, unknown, CreateProductFormValues>
  onNext: () => void
  onPrev: () => void
}

const VISIBILITY_OPTIONS = [
  { label: 'Visible (Public)', value: 'visible' },
  { label: 'Hidden', value: 'hidden' }
]

const COLLECTION_SUGGESTIONS = ['Best Sellers', 'New Arrivals', 'Summer Sale']
const SALES_CHANNEL_SUGGESTIONS = ['Online Store', 'Mobile App', 'Amazon', 'eBay']

const MEDIA_GUIDELINES = [
  'Use high-quality, well-lit images.',
  'Recommended size: 2000 x 2000px.',
  'Use a clean background and center the product.',
  'First image will be used as the cover.',
  'Videos should be under 60 seconds.'
]

const MediaOrganizationStep = ({ form, onNext, onPrev }: MediaOrganizationStepProps) => {
  // Vars
  const previewPrimaryImage = form.watch('primaryImage')
  const previewGalleryImages = form.watch('galleryImages') ?? []

  // Hooks
  const [primaryImageState, primaryImageActions] = useFileUpload({
    maxFiles: 1,
    accept: 'image/*',
    onFilesChange: files => {
      form.setValue('primaryImage', files[0]?.preview ?? '', { shouldValidate: true })
    }
  })

  const [galleryState, galleryActions] = useFileUpload({
    maxFiles: 8,
    multiple: true,
    accept: 'image/*',
    onFilesChange: files => {
      form.setValue('galleryImages', files.map(f => f.preview ?? '').filter(Boolean))
    }
  })

  const [attachmentsState, attachmentsActions] = useFileUpload({
    multiple: true,
    accept: '.pdf,.zip,.doc,.docx',
    maxSize: 10 * 1024 * 1024
  })

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-6'>
          <Card>
            <CardContent className='grid h-fit grid-cols-1 gap-6 lg:max-xl:grid-cols-3'>
              <Field>
                <FieldLabel htmlFor='product-primary-image'>
                  Primary Image <RequiredMark />
                </FieldLabel>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={primaryImageActions.openFileDialog}
                  onDragEnter={primaryImageActions.handleDragEnter}
                  onDragLeave={primaryImageActions.handleDragLeave}
                  onDragOver={primaryImageActions.handleDragOver}
                  onDrop={primaryImageActions.handleDrop}
                  data-dragging={primaryImageState.isDragging || undefined}
                  className='border-input data-[dragging=true]:bg-accent/50 flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center'
                >
                  <input
                    {...primaryImageActions.getInputProps()}
                    id='product-primary-image'
                    className='sr-only'
                    aria-label='Upload primary image'
                  />
                  <UploadIcon className='size-8 stroke-1' />
                  <div>
                    <p className='font-medium'>Drag & drop an image or click to upload</p>
                    <p className='text-muted-foreground text-sm'>Recommended: 2000 x 2000px (1:1)</p>
                  </div>
                  <Button type='button' variant='outline' size='sm' onClick={primaryImageActions.openFileDialog}>
                    Choose file
                  </Button>
                </div>

                {primaryImageState.files.length > 0 && (
                  <div className='space-y-2'>
                    {primaryImageState.files.map(file => (
                      <div key={file.id} className='bg-muted flex items-center justify-between gap-3 rounded-md p-3'>
                        <div className='flex min-w-0 items-center gap-3'>
                          <div className='bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md'>
                            {file.preview ? (
                              <img src={file.preview} alt={file.file.name} className='size-full object-cover' />
                            ) : (
                              <FileTextIcon className='size-5' />
                            )}
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
                          onClick={() => primaryImageActions.removeFile(file.id)}
                          aria-label='Remove file'
                        >
                          <XIcon className='size-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {primaryImageState.errors.length > 0 && (
                  <div className='text-destructive flex items-center gap-1 text-xs' role='alert'>
                    <AlertCircleIcon className='size-3 shrink-0' />
                    <span>{primaryImageState.errors[0]}</span>
                  </div>
                )}

                {form.formState.errors.primaryImage && <FieldError errors={[form.formState.errors.primaryImage]} />}
              </Field>

              <Field>
                <FieldLabel htmlFor='product-gallery-images'>Gallery Images</FieldLabel>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={galleryActions.openFileDialog}
                  onDragEnter={galleryActions.handleDragEnter}
                  onDragLeave={galleryActions.handleDragLeave}
                  onDragOver={galleryActions.handleDragOver}
                  onDrop={galleryActions.handleDrop}
                  data-dragging={galleryState.isDragging || undefined}
                  className='border-input data-[dragging=true]:bg-accent/50 flex min-h-32 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center'
                >
                  <input
                    {...galleryActions.getInputProps()}
                    id='product-gallery-images'
                    className='sr-only'
                    aria-label='Upload gallery images'
                  />
                  <ImagesIcon className='size-8 stroke-1' />
                  <div>
                    <p className='font-medium'>Drag & drop images or click to upload</p>
                    <p className='text-muted-foreground text-sm'>Add up to 8 images to showcase this product.</p>
                  </div>
                  <Button type='button' variant='outline' size='icon' onClick={galleryActions.openFileDialog}>
                    <PlusIcon className='size-4' />
                  </Button>
                </div>

                {galleryState.files.length > 0 && (
                  <div className='grid grid-cols-4 gap-2'>
                    {galleryState.files.map(file => (
                      <div key={file.id} className='group relative aspect-square overflow-hidden rounded-md'>
                        {file.preview ? (
                          <img src={file.preview} alt={file.file.name} className='size-full object-cover' />
                        ) : (
                          <div className='bg-muted flex size-full items-center justify-center'>
                            <FileTextIcon className='text-muted-foreground size-5' />
                          </div>
                        )}
                        <Button
                          type='button'
                          variant='destructive'
                          size='icon'
                          className='absolute top-1 right-1 size-6 opacity-0 group-hover:opacity-100'
                          onClick={() => galleryActions.removeFile(file.id)}
                          aria-label='Remove file'
                        >
                          <XIcon className='size-3' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {galleryState.errors.length > 0 && (
                  <div className='text-destructive flex items-center gap-1 text-xs' role='alert'>
                    <AlertCircleIcon className='size-3 shrink-0' />
                    <span>{galleryState.errors[0]}</span>
                  </div>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor='product-attachments'>Attachments</FieldLabel>
                <div
                  role='button'
                  tabIndex={0}
                  onClick={attachmentsActions.openFileDialog}
                  onDragEnter={attachmentsActions.handleDragEnter}
                  onDragLeave={attachmentsActions.handleDragLeave}
                  onDragOver={attachmentsActions.handleDragOver}
                  onDrop={attachmentsActions.handleDrop}
                  data-dragging={attachmentsState.isDragging || undefined}
                  className='border-input data-[dragging=true]:bg-accent/50 flex min-h-32 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center'
                >
                  <input
                    {...attachmentsActions.getInputProps()}
                    id='product-attachments'
                    className='sr-only'
                    aria-label='Upload attachments'
                  />
                  <FileTextIcon className='size-8 stroke-1' />
                  <div>
                    <p className='font-medium'>Drag & drop files or click to upload</p>
                    <p className='text-muted-foreground text-sm'>PDF, ZIP, DOC up to 10MB each</p>
                  </div>
                  <Button type='button' variant='outline' size='sm' onClick={attachmentsActions.openFileDialog}>
                    Choose files
                  </Button>
                </div>

                {attachmentsState.files.length > 0 && (
                  <div className='space-y-2'>
                    {attachmentsState.files.map(file => (
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
                          onClick={() => attachmentsActions.removeFile(file.id)}
                          aria-label='Remove file'
                        >
                          <XIcon className='size-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {attachmentsState.errors.length > 0 && (
                  <div className='text-destructive flex items-center gap-1 text-xs' role='alert'>
                    <AlertCircleIcon className='size-3 shrink-0' />
                    <span>{attachmentsState.errors[0]}</span>
                  </div>
                )}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <Controller
                name='videoUrl'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='product-video-url'>Video URL</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <LinkIcon />
                      </InputGroupAddon>
                      <InputGroupInput
                        id='product-video-url'
                        placeholder='https://example.com/product-video'
                        {...field}
                        value={field.value ?? ''}
                      />
                    </InputGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='collections'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='product-collections'>Collections</FieldLabel>
                    <ChipInput
                      id='product-collections'
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder='Add a collection'
                      suggestions={COLLECTION_SUGGESTIONS}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='salesChannels'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='product-sales-channels'>Sales Channels</FieldLabel>
                    <ChipInput
                      id='product-sales-channels'
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder='Add a sales channel'
                      suggestions={SALES_CHANNEL_SUGGESTIONS}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='tags'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='product-media-tags'>Product Tags</FieldLabel>
                    <ChipInput
                      id='product-media-tags'
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder='Add a tag and press Enter'
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='brand'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='product-media-brand'>Vendor / Brand</FieldLabel>
                    <Input id='product-media-brand' placeholder='e.g. Acme Audio' {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel htmlFor='product-category-confirmed'>Category (Confirmed)</FieldLabel>
                <Input id='product-category-confirmed' value={form.watch('category')} disabled readOnly />
              </Field>

              <Controller
                name='visibility'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className='gap-0' htmlFor='product-visibility'>
                      Visibility <RequiredMark />
                    </FieldLabel>
                    <Select items={VISIBILITY_OPTIONS} value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id='product-visibility' className='w-full'>
                        <SelectValue placeholder='Select visibility' />
                      </SelectTrigger>
                      <SelectContent
                        alignItemWithTrigger={false}
                        className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                      >
                        <SelectGroup>
                          {VISIBILITY_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='featured'
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal' className='rounded-md border p-4 sm:col-span-2'>
                    <div className='flex-1 space-y-1'>
                      <FieldLabel htmlFor='product-featured'>Featured Product</FieldLabel>
                      <FieldDescription>Show this product on the storefront home page.</FieldDescription>
                    </div>
                    <Switch id='product-featured' checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className='grid h-fit grid-cols-1 gap-4 md:max-xl:grid-cols-2'>
          <WizardSideCard title='Media Guidelines' icon={ImageIcon}>
            <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
              {MEDIA_GUIDELINES.map(guideline => (
                <li key={guideline}>{guideline}</li>
              ))}
            </ul>
          </WizardSideCard>

          <WizardSideCard title='Gallery Preview (Live)' icon={ImagesIcon}>
            <div className='space-y-3'>
              {previewPrimaryImage ? (
                <div className='aspect-square w-full overflow-hidden rounded-md'>
                  <img src={previewPrimaryImage} alt='Primary product' className='size-full object-cover' />
                </div>
              ) : (
                <div className='bg-muted flex aspect-square w-full items-center justify-center rounded-md'>
                  <ImageIcon className='text-muted-foreground size-8' />
                </div>
              )}

              <div className='grid grid-cols-4 gap-2'>
                {previewGalleryImages.length > 0
                  ? previewGalleryImages.map((image, index) => (
                      <div key={`${image}-${index}`} className='aspect-square w-full overflow-hidden rounded-md'>
                        <img src={image} alt={`Gallery ${index + 1}`} className='size-full object-cover' />
                      </div>
                    ))
                  : Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className='bg-muted flex aspect-square w-full items-center justify-center rounded-md'
                      >
                        <ImageIcon className='text-muted-foreground size-4' />
                      </div>
                    ))}
              </div>

              <p className='text-muted-foreground text-xs'>This is how your media will appear to customers.</p>
            </div>
          </WizardSideCard>
        </div>
      </div>

      <div className='flex justify-between'>
        <Button type='button' variant='outline' onClick={onPrev}>
          <ArrowLeftIcon className='size-4' />
          Previous
        </Button>
        <Button type='button' onClick={onNext}>
          Next
          <ArrowRightIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}

export default MediaOrganizationStep
