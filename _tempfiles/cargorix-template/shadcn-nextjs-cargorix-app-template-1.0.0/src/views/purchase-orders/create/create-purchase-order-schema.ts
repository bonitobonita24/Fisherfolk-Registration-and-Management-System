// Third-party Imports
import { z } from 'zod'

export const purchaseOrderLineSchema = z.object({
  id: z.string(),
  productId: z.string().min(1),
  name: z.string(),
  sku: z.string(),
  primaryImage: z.string(),
  quantityOrdered: z.coerce.number().int().positive('Qty must be at least 1'),
  unitCost: z.coerce.number().nonnegative(),
  taxRatePercent: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100)
})

export const purchaseOrderAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeLabel: z.string(),
  type: z.string()
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Select a supplier'),
  warehouseId: z.string().min(1, 'Select a warehouse'),
  currency: z.string().min(1),
  paymentTerms: z.string().min(1),
  buyer: z.string().min(1, 'Select a buyer'),
  expectedDeliveryDate: z.string().min(1, 'Select an expected delivery date'),
  shippingCost: z.coerce.number().nonnegative(),
  notes: z.string().optional().default(''),
  internalNotes: z.string().max(1000).optional().default(''),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Add at least one line item'),
  attachments: z.array(purchaseOrderAttachmentSchema).optional().default([])
})

export type CreatePurchaseOrderFormInput = z.input<typeof createPurchaseOrderSchema>
export type CreatePurchaseOrderFormValues = z.infer<typeof createPurchaseOrderSchema>
