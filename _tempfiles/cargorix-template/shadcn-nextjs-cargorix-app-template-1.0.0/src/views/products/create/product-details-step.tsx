'use client'

// Third-party Imports
import { Controller } from 'react-hook-form'
import { ArrowRightIcon, LightbulbIcon, PackageIcon, SparklesIcon } from 'lucide-react'

// Type Imports
import type { UseFormReturn } from 'react-hook-form'

import type { CreateProductFormInput, CreateProductFormValues } from './create-product-schema'
import { PRODUCT_CATEGORY_LIST } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import WizardSideCard from './wizard-side-card'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import ChipInput from '@/components/shared/chip-input'

type ProductDetailsStepProps = {
  form: UseFormReturn<CreateProductFormInput, unknown, CreateProductFormValues>
  onNext: () => void
  isEditing: boolean
}

const CATEGORY_ITEMS = PRODUCT_CATEGORY_LIST.map(category => ({ label: category, value: category }))

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Archived', value: 'archived' }
]

const PRODUCT_TIPS = [
  'Use a clear, descriptive product name.',
  'Choose the most relevant category.',
  'Add a short description for quick overview.',
  'Include a detailed description for buyers.',
  'Use tags to improve product discoverability.'
]

const ProductDetailsStep = ({ form, onNext, isEditing }: ProductDetailsStepProps) => {
  // Vars
  const previewName = form.watch('name')
  const previewSku = form.watch('sku')
  const previewStatus = form.watch('status')
  const previewCategory = form.watch('category')
  const previewBrand = form.watch('brand')

  const previewStatusLabel = STATUS_OPTIONS.find(option => option.value === previewStatus)?.label ?? 'Draft'

  return (
    <div className='space-y-6'>
      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <Card>
          <CardContent className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <Controller
              name='name'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-name'>
                    Product Name <RequiredMark />
                  </FieldLabel>
                  <Input id='product-name' placeholder='e.g. Wireless Bluetooth Headphones' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='sku'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-sku'>
                    SKU <RequiredMark />
                  </FieldLabel>
                  <Input id='product-sku' placeholder='e.g. WBH-1001' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='category'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-category'>
                    Category <RequiredMark />
                  </FieldLabel>
                  <Select items={CATEGORY_ITEMS} value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id='product-category' className='w-full'>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {PRODUCT_CATEGORY_LIST.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
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
              name='brand'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-brand'>Brand/Vendor</FieldLabel>
                  <Input id='product-brand' placeholder='e.g. Acme Audio' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='productType'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-type'>Product Type</FieldLabel>
                  <Input id='product-type' placeholder='e.g. Physical' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='status'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='gap-0' htmlFor='product-status'>
                    Status <RequiredMark />
                  </FieldLabel>
                  <Select items={STATUS_OPTIONS} value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id='product-status' className='w-full'>
                      <SelectValue placeholder='Select a status' />
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
                    >
                      <SelectGroup>
                        {STATUS_OPTIONS.map(option => (
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
              name='shortDescription'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-short-description'>Short Description</FieldLabel>
                  <Textarea
                    id='product-short-description'
                    placeholder='A quick summary shown in listings'
                    rows={3}
                    {...field}
                  />
                  <div className='flex items-center justify-between'>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : <span />}
                    <span className='text-muted-foreground text-xs'>{field.value?.length ?? 0} / 160</span>
                  </div>
                </Field>
              )}
            />

            <Controller
              name='tags'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-tags'>Tags</FieldLabel>
                  <ChipInput
                    id='product-tags'
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder='Add a tag and press Enter'
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name='description'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-description'>Full Description</FieldLabel>
                  <Textarea
                    id='product-description'
                    placeholder='Describe the product in detail for buyers'
                    rows={6}
                    {...field}
                  />
                  <div className='flex items-center justify-between'>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : <span />}
                    <span className='text-muted-foreground text-xs'>{field.value?.length ?? 0} / 2000</span>
                  </div>
                </Field>
              )}
            />

            <Controller
              name='slug'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field className='sm:col-span-2' data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='product-slug'>Product URL Slug</FieldLabel>
                  <Input id='product-slug' placeholder='e.g. wireless-bluetooth-headphones' {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <div className='grid h-fit grid-cols-1 gap-4 md:max-xl:grid-cols-2'>
          <WizardSideCard title='Product Tips' icon={LightbulbIcon}>
            <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
              {PRODUCT_TIPS.map(tip => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </WizardSideCard>

          <WizardSideCard title={isEditing ? 'Preview' : 'Preview (Draft)'} icon={SparklesIcon}>
            <div className='flex items-start gap-3'>
              <div className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-md'>
                <PackageIcon className='text-muted-foreground size-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <p className='truncate text-sm font-medium'>{previewName || 'Untitled product'}</p>
                <p className='text-muted-foreground text-xs'>{previewSku || 'No SKU yet'}</p>
                <div className='flex flex-wrap items-center gap-1.5 pt-1'>
                  <Badge variant='secondary'>{previewStatusLabel}</Badge>
                  {previewCategory && <Badge variant='outline'>{previewCategory}</Badge>}
                  {previewBrand && <Badge variant='outline'>{previewBrand}</Badge>}
                </div>
              </div>
            </div>
          </WizardSideCard>
        </div>
      </div>

      <div className='flex justify-end'>
        <Button type='button' onClick={onNext}>
          Next
          <ArrowRightIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}

export default ProductDetailsStep
