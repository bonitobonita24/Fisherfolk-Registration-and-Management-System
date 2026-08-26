'use client'

// Third-party Imports
import { Controller } from 'react-hook-form'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClipboardCheckIcon,
  LightbulbIcon,
  ListChecksIcon,
  PackageIcon,
  SparklesIcon,
  XIcon
} from 'lucide-react'

// Type Imports
import type { UseFormReturn } from 'react-hook-form'

import type { CreateProductFormInput, CreateProductFormValues } from './create-product-schema'
import type { StepperType } from './index'
import type { ProductStockStatus } from '@/types/entities/product'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import WizardSideCard from './wizard-side-card'

// Shared Imports
import RequiredMark from '@/components/shared/required-mark'
import DatePicker from '@/components/shared/date-picker'

// Util Imports
import { todayDate } from '@/lib/date-bounds'
import { cn } from '@/lib/utils'

// Util Imports
import { computeAvailableStock, computeMarginPercent } from '@/lib/selectors/products-selectors'

// Data Imports
import { PRODUCT_LIFECYCLE_STATUS_BADGE, PRODUCT_STOCK_STATUS_BADGE } from '../product-badges'

type ReviewPublishStepProps = {
  form: UseFormReturn<CreateProductFormInput, unknown, CreateProductFormValues>
  onPrev: () => void
  onPublish: () => void
  onEditStep: StepperType['goTo']
  isEditing: boolean
}

const SALES_CHANNELS = ['Online Store', 'Mobile App', 'Amazon', 'eBay']

const PRODUCT_TIPS_COPY =
  'Publishing high-quality products with clear descriptions and images increases visibility and conversions.'

const getFormStockStatus = (onHand: number, reorderPoint: number): ProductStockStatus => {
  if (onHand === 0) return 'out_of_stock'
  if (onHand <= reorderPoint) return 'low_stock'

  return 'active'
}

const ReviewPublishStep = ({ form, onPrev, onPublish, onEditStep, isEditing }: ReviewPublishStepProps) => {
  // Vars
  const name = form.watch('name')
  const sku = form.watch('sku')
  const category = form.watch('category')
  const brand = form.watch('brand')
  const productType = form.watch('productType')
  const tags = form.watch('tags') ?? []
  const shortDescription = form.watch('shortDescription')
  const status = form.watch('status')

  const price = Number(form.watch('price')) || 0
  const compareAtPrice = form.watch('compareAtPrice')
  const unitCost = Number(form.watch('unitCost')) || 0
  const taxClass = form.watch('taxClass')
  const trackInventory = form.watch('trackInventory')
  const onHand = Number(form.watch('onHand')) || 0
  const reorderPoint = Number(form.watch('reorderPoint')) || 0

  const primaryImage = form.watch('primaryImage')
  const galleryImages = form.watch('galleryImages') ?? []
  const videoUrl = form.watch('videoUrl')
  const collections = form.watch('collections') ?? []
  const salesChannels = form.watch('salesChannels') ?? []
  const visibility = form.watch('visibility')
  const publishTiming = form.watch('publishTiming')
  const scheduledAt = form.watch('scheduledAt')

  const grossMarginPercent = computeMarginPercent(price, unitCost)
  const available = computeAvailableStock(onHand, 0)
  const stockStatus = getFormStockStatus(onHand, reorderPoint)
  const stockStatusBadge = PRODUCT_STOCK_STATUS_BADGE[stockStatus]

  const publishLabel = isEditing
    ? PRODUCT_LIFECYCLE_STATUS_BADGE[status].label
    : publishTiming === 'scheduled'
      ? scheduledAt
        ? `Scheduled · ${scheduledAt.slice(0, 10)}`
        : 'Scheduled'
      : 'Immediately'

  const checklist = [
    { label: 'Product details completed', done: !!name && !!sku },
    { label: 'Inventory and pricing set', done: price > 0 },
    { label: 'Media uploaded', done: !!primaryImage },
    { label: 'Category and tags added', done: !!category },
    { label: 'Preview looks good', done: true }
  ]

  const readyToPublish = checklist.every(item => item.done)
  const fullChecklist = [...checklist, { label: 'Ready to publish', done: readyToPublish }]
  const completedCount = fullChecklist.filter(item => item.done).length
  const totalCount = fullChecklist.length
  const pendingCount = totalCount - completedCount
  const readinessPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='flex items-center justify-between'>
            <CardTitle>Product Details</CardTitle>
            <Button type='button' variant='link' size='sm' onClick={() => onEditStep('product-details')}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <dl className='space-y-3 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Product Name</dt>
                <dd className='truncate font-medium'>{name || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>SKU</dt>
                <dd className='font-medium'>{sku || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Category</dt>
                <dd className='font-medium'>{category || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Brand/Vendor</dt>
                <dd className='font-medium'>{brand || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Product Type</dt>
                <dd className='font-medium'>{productType || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Tags</dt>
                <dd className='flex flex-wrap justify-end gap-1'>
                  {tags.length > 0 ? (
                    tags.map(tag => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className='font-medium'>—</span>
                  )}
                </dd>
              </div>
              <div className='space-y-1'>
                <dt className='text-muted-foreground'>Short Description</dt>
                <dd className='font-medium'>{shortDescription || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex items-center justify-between'>
            <CardTitle>Inventory & Pricing</CardTitle>
            <Button type='button' variant='link' size='sm' onClick={() => onEditStep('inventory-pricing')}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <dl className='space-y-3 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Price</dt>
                <dd className='font-medium'>${price.toFixed(2)}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Compare-at Price</dt>
                <dd className='font-medium'>
                  {compareAtPrice != null && compareAtPrice !== '' ? `$${Number(compareAtPrice).toFixed(2)}` : '—'}
                </dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Cost per Item</dt>
                <dd className='font-medium'>${unitCost.toFixed(2)}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Taxable</dt>
                <dd className='font-medium'>{taxClass !== 'Tax Exempt' ? 'Yes' : 'No'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Manage Stock</dt>
                <dd className='font-medium'>{trackInventory ? 'Yes' : 'No'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Stock Quantity</dt>
                <dd className='font-medium'>{onHand}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Low Stock Threshold</dt>
                <dd className='font-medium'>{reorderPoint}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Stock Status</dt>
                <dd>
                  <Badge className={stockStatusBadge.className}>{stockStatusBadge.label}</Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex items-center justify-between'>
            <CardTitle>Media & Organization</CardTitle>
            <Button type='button' variant='link' size='sm' onClick={() => onEditStep('media-organization')}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <dl className='space-y-3 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Images</dt>
                <dd className='font-medium'>{(primaryImage ? 1 : 0) + galleryImages.length}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Videos</dt>
                <dd className='font-medium'>{videoUrl ? 1 : 0}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Category</dt>
                <dd className='font-medium'>{category || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Brand/Vendor</dt>
                <dd className='font-medium'>{brand || '—'}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Collections</dt>
                <dd className='font-medium'>{collections.length}</dd>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <dt className='text-muted-foreground'>Tags</dt>
                <dd className='flex flex-wrap justify-end gap-1'>
                  {tags.length > 0 ? (
                    tags.map(tag => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className='font-medium'>—</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 items-start gap-4 xl:grid-cols-3'>
        <div className='grid grid-cols-1 gap-4 xl:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Publication Settings</CardTitle>
            </CardHeader>
            <CardContent className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2', !isEditing && 'lg:grid-cols-4')}>
              <Controller
                name='publishTiming'
                control={form.control}
                render={({ field }) =>
                  isEditing ? (
                    <></>
                  ) : (
                    <Field className='sm:col-span-2'>
                      <FieldLabel className='gap-0'>
                        Publish Timing <RequiredMark />
                      </FieldLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <FieldLabel htmlFor='publish-timing-now'>
                          <Field orientation='horizontal'>
                            <RadioGroupItem value='now' id='publish-timing-now' />
                            <div className='space-y-1'>
                              <p className='text-sm font-medium'>Publish now</p>
                              <FieldDescription>Make this product live immediately.</FieldDescription>
                            </div>
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor='publish-timing-scheduled'>
                          <Field orientation='horizontal'>
                            <RadioGroupItem value='scheduled' id='publish-timing-scheduled' />
                            <div className='space-y-1'>
                              <p className='text-sm font-medium'>Schedule for later</p>
                              <FieldDescription>Choose a future date to publish.</FieldDescription>
                            </div>
                          </Field>
                        </FieldLabel>
                      </RadioGroup>

                      {field.value === 'scheduled' && (
                        <Controller
                          name='scheduledAt'
                          control={form.control}
                          render={({ field: scheduledAtField }) => (
                            <DatePicker
                              id='product-scheduled-at'
                              value={scheduledAtField.value}
                              onChange={scheduledAtField.onChange}
                              min={todayDate()}
                              placeholder='Select a publish date'
                            />
                          )}
                        />
                      )}
                    </Field>
                  )
                }
              />

              <Controller
                name='salesChannels'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Sales Channels</FieldLabel>
                    <div className='space-y-3'>
                      {SALES_CHANNELS.map(channel => (
                        <FieldLabel key={channel} htmlFor={`sales-channel-${channel}`} className='font-normal'>
                          <Field orientation='horizontal'>
                            <Checkbox
                              id={`sales-channel-${channel}`}
                              checked={field.value?.includes(channel)}
                              onCheckedChange={checked =>
                                field.onChange(
                                  checked
                                    ? [...(field.value ?? []), channel]
                                    : (field.value ?? []).filter(c => c !== channel)
                                )
                              }
                            />
                            <span className='text-sm'>{channel}</span>
                          </Field>
                        </FieldLabel>
                      ))}
                    </div>
                  </Field>
                )}
              />

              <Controller
                name='visibility'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className='gap-0'>
                      Visibility <RequiredMark />
                    </FieldLabel>
                    <RadioGroup value={field.value} onValueChange={field.onChange}>
                      <FieldLabel htmlFor='visibility-visible' className='font-normal'>
                        <Field orientation='horizontal'>
                          <RadioGroupItem value='visible' id='visibility-visible' />
                          <span className='text-sm'>Visible</span>
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor='visibility-hidden' className='font-normal'>
                        <Field orientation='horizontal'>
                          <RadioGroupItem value='hidden' id='visibility-hidden' />
                          <span className='text-sm'>Hidden</span>
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <WizardSideCard title='Product Preview' icon={SparklesIcon}>
            <div className='flex flex-col gap-5 sm:flex-row'>
              <div className='w-full shrink-0 space-y-2 sm:w-56'>
                {primaryImage ? (
                  <div className='aspect-square w-full overflow-hidden rounded-lg'>
                    <img src={primaryImage} alt={name || 'Product'} className='size-full object-cover' />
                  </div>
                ) : (
                  <div className='bg-muted flex aspect-square w-full items-center justify-center rounded-lg'>
                    <PackageIcon className='text-muted-foreground size-8' />
                  </div>
                )}
                {galleryImages.length > 0 && (
                  <div className='grid grid-cols-4 gap-2'>
                    {galleryImages.slice(0, 4).map((image, index) => (
                      <div key={image} className='aspect-square overflow-hidden rounded-md'>
                        <img
                          src={image}
                          alt={`${name || 'Product'} gallery ${index + 1}`}
                          className='size-full object-cover'
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='min-w-0 flex-1 space-y-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate font-medium'>{name || 'Untitled product'}</p>
                    <p className='text-muted-foreground text-xs'>{sku || 'No SKU yet'}</p>
                  </div>
                  <Badge className={cn('shrink-0', stockStatusBadge.className)}>{stockStatusBadge.label}</Badge>
                </div>

                <div className='flex flex-wrap items-baseline gap-2'>
                  <span className='text-2xl font-semibold'>${price.toFixed(2)}</span>
                  {compareAtPrice != null && compareAtPrice !== '' && (
                    <span className='text-muted-foreground text-sm line-through'>
                      ${Number(compareAtPrice).toFixed(2)}
                    </span>
                  )}
                  {grossMarginPercent > 0 && <Badge variant='secondary'>{grossMarginPercent}% margin</Badge>}
                </div>

                {shortDescription && <p className='text-muted-foreground line-clamp-3 text-sm'>{shortDescription}</p>}

                <div className='flex flex-wrap items-center gap-1.5'>
                  {category && <Badge variant='outline'>{category}</Badge>}
                  {brand && <Badge variant='outline'>{brand}</Badge>}
                  <Badge variant='secondary'>{available} in stock</Badge>
                  {tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant='outline'>
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Separator />

                <dl className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-3'>
                  <div className='space-y-1'>
                    <dt className='text-muted-foreground text-xs'>Visibility</dt>
                    <dd className='font-medium capitalize'>{visibility}</dd>
                  </div>
                  <div className='space-y-1'>
                    <dt className='text-muted-foreground text-xs'>{isEditing ? 'Status' : 'Publishes'}</dt>
                    <dd className='font-medium'>{publishLabel}</dd>
                  </div>
                  <div className='min-w-0 space-y-1'>
                    <dt className='text-muted-foreground text-xs'>Sales Channels</dt>
                    <dd className='truncate font-medium'>{salesChannels.join(', ') || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </WizardSideCard>
        </div>

        <div className='grid grid-cols-1 gap-4 md:max-xl:grid-cols-3'>
          <WizardSideCard title='Confirmation Checklist' icon={ListChecksIcon}>
            <ul className='space-y-2.5'>
              {fullChecklist.map(item => (
                <li key={item.label} className='flex items-center gap-2.5 text-sm'>
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full',
                      item.done ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {item.done ? <CheckIcon className='size-3' /> : <XIcon className='size-3' />}
                  </span>
                  <span className={item.done ? 'font-medium' : 'text-muted-foreground'}>{item.label}</span>
                </li>
              ))}
            </ul>
          </WizardSideCard>

          <WizardSideCard title='Readiness Summary' icon={ClipboardCheckIcon}>
            <div className='space-y-3'>
              <div className='flex items-baseline justify-between gap-2'>
                <p className='text-3xl font-bold'>
                  {completedCount}
                  <span className='text-muted-foreground text-lg font-medium'>/{totalCount}</span>
                </p>
                <span className='text-muted-foreground text-sm'>{readinessPercent}% ready</span>
              </div>
              <Progress value={readinessPercent} className={readyToPublish ? 'progress-success' : 'progress-warning'} />
              {readyToPublish ? (
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>All set to publish</p>
                  <p className='text-muted-foreground text-sm'>
                    Everything looks good. You&apos;re ready to share your product.
                  </p>
                </div>
              ) : (
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>
                    {pendingCount} item{pendingCount === 1 ? '' : 's'} need attention
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Complete the unchecked items in the confirmation checklist to publish.
                  </p>
                </div>
              )}
            </div>
          </WizardSideCard>

          <WizardSideCard title='Product Tips' icon={LightbulbIcon}>
            <p className='text-muted-foreground text-sm'>{PRODUCT_TIPS_COPY}</p>
          </WizardSideCard>
        </div>
      </div>

      <div className='flex justify-between'>
        <Button type='button' variant='outline' onClick={onPrev}>
          <ArrowLeftIcon className='size-4' />
          Previous
        </Button>
        <Button type='button' onClick={onPublish}>
          {isEditing ? 'Save changes' : 'Publish product'}
          <ArrowRightIcon className='size-4' />
        </Button>
      </div>
    </div>
  )
}

export default ReviewPublishStep
