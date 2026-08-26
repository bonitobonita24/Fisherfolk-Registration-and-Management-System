// Third-party Imports
import { z } from 'zod'

// Util Imports
import { isBeforeDate } from '@/lib/date-bounds'

export const transferLineSchema = z.object({
  id: z.string(),
  productId: z.string().min(1),
  name: z.string(),
  sku: z.string(),
  primaryImage: z.string(),
  unit: z.string(),
  quantitySent: z.coerce.number().int().positive('Qty must be at least 1')
})

export const createTransferSchema = z
  .object({
    sourceWarehouseId: z.string().min(1, 'Select a source warehouse'),
    destinationWarehouseId: z.string().min(1, 'Select a destination warehouse'),
    requestedBy: z.string().min(1, 'Select who requested this transfer'),
    dispatchDate: z.string().min(1, 'Select a dispatch date'),
    expectedArrival: z.string().min(1, 'Select an expected arrival date'),
    notes: z.string().optional().default(''),
    lines: z.array(transferLineSchema).min(1, 'Add at least one line item')
  })
  .refine(values => values.sourceWarehouseId !== values.destinationWarehouseId, {
    message: 'Source and destination must differ',
    path: ['destinationWarehouseId']
  })
  .refine(values => !isBeforeDate(values.expectedArrival, values.dispatchDate), {
    message: 'Expected arrival cannot be before the dispatch date',
    path: ['expectedArrival']
  })

export type CreateTransferFormInput = z.input<typeof createTransferSchema>
export type CreateTransferFormValues = z.infer<typeof createTransferSchema>
