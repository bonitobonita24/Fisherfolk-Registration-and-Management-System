// Third-party Imports
import { z } from 'zod'

const URL_PATTERN = /^https?:\/\/.+/

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.enum(['Electronics', 'Clothing', 'Sports', 'Home & Garden', 'Books', 'Packaging Supplies']),
  productType: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'draft', 'scheduled', 'archived']),
  shortDescription: z.string().max(160, 'Keep it under 160 characters').optional(),
  description: z.string().max(2000, 'Keep it under 2000 characters').optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().optional(),

  price: z.coerce.number().min(0, 'Base price is required'),
  compareAtPrice: z.coerce.number().min(0).optional(),
  unitCost: z.coerce.number().min(0).optional(),
  taxClass: z.string().optional(),
  currency: z.string().optional(),
  trackInventory: z.boolean().optional(),
  onHand: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  reorderQuantity: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  warehouseId: z.string().optional(),
  weightKg: z.coerce.number().min(0).optional(),
  lengthCm: z.coerce.number().min(0).optional(),
  widthCm: z.coerce.number().min(0).optional(),
  heightCm: z.coerce.number().min(0).optional(),
  unit: z.enum(['each', 'kg', 'box', 'pallet']),

  primaryImage: z.string().min(1, 'A primary image is required'),
  galleryImages: z.array(z.string()).optional(),
  videoUrl: z
    .string()
    .optional()
    .refine(value => !value || URL_PATTERN.test(value), 'Enter a valid URL'),
  collections: z.array(z.string()).optional(),
  salesChannels: z.array(z.string()).optional(),
  visibility: z.enum(['visible', 'hidden']),
  featured: z.boolean().optional(),

  publishTiming: z.enum(['now', 'scheduled']),
  scheduledAt: z.string().optional()
})

export const productDraftSchema = createProductSchema.extend({
  primaryImage: z.string().optional().default('')
})

export type CreateProductFormInput = z.input<typeof createProductSchema>
export type CreateProductFormValues = z.infer<typeof createProductSchema>
