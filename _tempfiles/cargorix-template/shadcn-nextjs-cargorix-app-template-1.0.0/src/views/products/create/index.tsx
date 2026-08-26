'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import * as Stepperize from '@stepperize/react'
import { SaveIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Product } from '@/types/entities/product'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import InventoryPricingStep from './inventory-pricing-step'
import MediaOrganizationStep from './media-organization-step'
import ProductDetailsStep from './product-details-step'
import ReviewPublishStep from './review-publish-step'
import StepperNav from './stepper-nav'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Data Imports
import { createProductSchema, productDraftSchema } from './create-product-schema'

import type { CreateProductFormInput, CreateProductFormValues } from './create-product-schema'

const { useStepper } = Stepperize.defineStepper([
  { id: 'product-details', title: 'Product Details', description: 'Basic information' },
  { id: 'inventory-pricing', title: 'Inventory & Pricing', description: 'Stock and price setup' },
  { id: 'media-organization', title: 'Media & Organization', description: 'Upload assets and organize' },
  { id: 'review-publish', title: 'Review & Publish', description: 'Final checks' }
])

export type StepperType = ReturnType<typeof useStepper>

const createProductResolver = zodResolver as unknown as (
  schema: typeof createProductSchema
) => Resolver<CreateProductFormInput, unknown, CreateProductFormValues>

const buildDefaultValues = (product: Product): CreateProductFormInput => ({
  name: product.name,
  sku: product.sku,
  category: product.category,
  productType: product.productType,
  brand: product.brand,
  status: product.status,
  shortDescription: product.shortDescription,
  description: product.description,
  tags: product.tags,
  slug: product.slug,
  price: product.price,
  compareAtPrice: product.compareAtPrice ?? undefined,
  unitCost: product.unitCost,
  taxClass: product.taxClass,
  currency: product.currency,
  trackInventory: product.trackInventory,
  onHand: product.onHand,
  reorderPoint: product.reorderPoint,
  reorderQuantity: product.reorderQuantity,
  barcode: product.barcode,
  warehouseId: product.warehouseId,
  weightKg: product.weightKg,
  lengthCm: product.lengthCm,
  widthCm: product.widthCm,
  heightCm: product.heightCm,
  unit: product.unit,
  primaryImage: product.primaryImage,
  galleryImages: product.galleryImages,
  videoUrl: product.videoUrl ?? undefined,
  collections: product.collections,
  salesChannels: product.salesChannels,
  visibility: product.visibility,
  featured: product.featured,
  publishTiming: 'now',
  scheduledAt: undefined
})

const EMPTY_DEFAULT_VALUES: CreateProductFormInput = {
  name: '',
  sku: '',
  category: 'Electronics',
  productType: 'Physical',
  brand: '',
  status: 'draft',
  shortDescription: '',
  description: '',
  tags: [],
  slug: '',
  price: 0,
  compareAtPrice: undefined,
  unitCost: 0,
  taxClass: 'Standard Tax Rate',
  currency: 'USD',
  trackInventory: true,
  onHand: 0,
  reorderPoint: 0,
  reorderQuantity: 0,
  barcode: '',
  warehouseId: '',
  weightKg: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  unit: 'each',
  primaryImage: '',
  galleryImages: [],
  videoUrl: undefined,
  collections: [],
  salesChannels: ['Online Store'],
  visibility: 'visible',
  featured: false,
  publishTiming: 'now',
  scheduledAt: undefined
}

type StepId = 'product-details' | 'inventory-pricing' | 'media-organization' | 'review-publish'

const STEP_FIELDS: Record<StepId, readonly (keyof CreateProductFormValues)[]> = {
  'product-details': ['name', 'sku', 'category', 'status'],
  'inventory-pricing': ['price'],
  'media-organization': ['primaryImage'],
  'review-publish': []
}

const STEP_ERROR_FIELDS: Record<StepId, readonly (keyof CreateProductFormValues)[]> = {
  'product-details': [
    'name',
    'sku',
    'category',
    'productType',
    'brand',
    'status',
    'shortDescription',
    'description',
    'tags',
    'slug'
  ],
  'inventory-pricing': [
    'price',
    'compareAtPrice',
    'unitCost',
    'taxClass',
    'currency',
    'trackInventory',
    'onHand',
    'reorderPoint',
    'reorderQuantity',
    'barcode',
    'warehouseId',
    'weightKg',
    'lengthCm',
    'widthCm',
    'heightCm',
    'unit'
  ],
  'media-organization': [
    'primaryImage',
    'galleryImages',
    'videoUrl',
    'collections',
    'salesChannels',
    'visibility',
    'featured'
  ],
  'review-publish': ['publishTiming', 'scheduledAt']
}

const STEP_ORDER: readonly StepId[] = ['product-details', 'inventory-pricing', 'media-organization', 'review-publish']

type StepErrorMap = Partial<Record<keyof CreateProductFormValues, unknown>>

const findFirstInvalidStep = (errors: StepErrorMap): StepId | undefined =>
  STEP_ORDER.find(step => STEP_ERROR_FIELDS[step].some(field => Boolean(errors[field])))

type CreateProductViewProps = {
  productId: string
  products: Product[]
  warehouses: Warehouse[]
}

const CreateProductView = ({ productId, products, warehouses }: CreateProductViewProps) => {
  // Hooks
  const router = useRouter()
  const stepper = useStepper()
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const createDraftProduct = useProductsStore(state => state.createDraftProduct)
  const commitProduct = useProductsStore(state => state.commitProduct)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const draft = useProductsStore(state => state.getProduct(productId))

  // Vars
  const product = draft ?? products.find(p => p.id === productId)

  const isEditing = Boolean(product) && product?.isDraft !== true
  const warehouseOptions = storeWarehouses.length > 0 ? storeWarehouses : warehouses

  const form = useForm<CreateProductFormInput, unknown, CreateProductFormValues>({
    resolver: createProductResolver(createProductSchema),
    defaultValues: product ? buildDefaultValues(product) : EMPTY_DEFAULT_VALUES
  })

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    createDraftProduct(productId)
  }, [createDraftProduct, productId])

  useEffect(() => {
    if (draft) form.reset(buildDefaultValues(draft))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id])

  const buildUpdates = (values: CreateProductFormValues): Partial<Product> => ({
    name: values.name,
    sku: values.sku,
    slug: values.slug || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category: values.category,
    productType: values.productType ?? 'Physical',
    brand: values.brand ?? '',
    shortDescription: values.shortDescription ?? '',
    description: values.description ?? '',
    tags: values.tags ?? [],
    price: values.price,
    compareAtPrice: values.compareAtPrice ?? null,
    unitCost: values.unitCost ?? 0,
    taxClass: values.taxClass ?? 'Standard Tax Rate',
    currency: values.currency ?? 'USD',
    trackInventory: values.trackInventory ?? true,
    onHand: values.onHand ?? 0,
    reorderPoint: values.reorderPoint ?? 0,
    reorderQuantity: values.reorderQuantity ?? 0,
    barcode: values.barcode ?? '',
    warehouseId: values.warehouseId ?? '',
    weightKg: values.weightKg ?? 0,
    lengthCm: values.lengthCm ?? 0,
    widthCm: values.widthCm ?? 0,
    heightCm: values.heightCm ?? 0,
    unit: values.unit,
    primaryImage: values.primaryImage,
    galleryImages: values.galleryImages ?? [],
    videoUrl: values.videoUrl || null,
    collections: values.collections ?? [],
    salesChannels: values.salesChannels ?? [],
    visibility: values.visibility,
    featured: values.featured ?? false
  })

  const showFirstInvalidStep = (errors: StepErrorMap) => {
    const step = findFirstInvalidStep(errors)

    if (step) stepper.goTo(step)
  }

  const handleSaveDraft = async () => {
    const identified = await form.trigger(STEP_FIELDS['product-details'] as (keyof CreateProductFormValues)[])

    if (!identified) {
      stepper.goTo('product-details')
      toast.error('Add a product name and SKU before saving.')

      return
    }

    const parsed = productDraftSchema.safeParse(form.getValues())

    if (!parsed.success) {
      const invalidFields: StepErrorMap = Object.fromEntries(
        parsed.error.issues.map(issue => [String(issue.path[0]), true])
      )

      await form.trigger()
      showFirstInvalidStep(invalidFields)
      toast.error('Fix the highlighted fields before saving.')

      return
    }

    commitProduct(productId, {
      ...buildUpdates(parsed.data),
      status: isEditing ? (product?.status ?? 'draft') : 'draft'
    })
    toast.success(isEditing ? 'Changes saved.' : 'Draft saved.')
    router.push('/products')
  }

  const handlePublish = form.handleSubmit(
    values => {
      commitProduct(productId, {
        ...buildUpdates(values),
        status: values.publishTiming === 'scheduled' ? 'scheduled' : 'active'
      })
      toast.success(values.publishTiming === 'scheduled' ? 'Product scheduled.' : 'Product published.')
      router.push('/products')
    },
    errors => {
      showFirstInvalidStep(errors)
      toast.error('Fix the highlighted fields before publishing.')
    }
  )

  const handleSaveChanges = form.handleSubmit(
    values => {
      commitProduct(productId, { ...buildUpdates(values), status: values.status })
      toast.success('Changes saved.')
      router.push('/products')
    },
    errors => {
      showFirstInvalidStep(errors)
      toast.error('Fix the highlighted fields before saving.')
    }
  )

  const handleNext = async () => {
    const currentId = stepper.id as keyof typeof STEP_FIELDS
    const fields = STEP_FIELDS[currentId]
    const valid = fields.length === 0 || (await form.trigger(fields as (keyof CreateProductFormValues)[]))

    if (valid) await stepper.next()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{isEditing ? 'Edit Product' : 'Create Product'}</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            {isEditing
              ? 'Update this product’s details across the guided steps.'
              : 'Add a new product to your catalog using a guided setup.'}
          </p>
        </div>
        <Button
          type='button'
          variant={isEditing ? 'default' : 'outline'}
          className='gap-2'
          onClick={isEditing ? handleSaveChanges : handleSaveDraft}
        >
          <SaveIcon className='size-4' />
          {isEditing ? 'Save changes' : 'Save draft'}
        </Button>
      </div>

      <StepperNav stepper={stepper} />

      {stepper.match({
        'product-details': () => <ProductDetailsStep form={form} onNext={handleNext} isEditing={isEditing} />,
        'inventory-pricing': () => (
          <InventoryPricingStep
            form={form}
            onNext={handleNext}
            onPrev={() => stepper.prev()}
            reserved={product?.reserved ?? 0}
            warehouses={warehouseOptions}
          />
        ),
        'media-organization': () => (
          <MediaOrganizationStep form={form} onNext={handleNext} onPrev={() => stepper.prev()} />
        ),
        'review-publish': () => (
          <ReviewPublishStep
            form={form}
            onPrev={() => stepper.prev()}
            onPublish={isEditing ? handleSaveChanges : handlePublish}
            onEditStep={stepper.goTo}
            isEditing={isEditing}
          />
        )
      })}
    </div>
  )
}

export default CreateProductView
