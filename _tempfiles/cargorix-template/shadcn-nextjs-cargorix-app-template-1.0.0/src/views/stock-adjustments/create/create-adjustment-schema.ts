// Third-party Imports
import { z } from 'zod'

export const adjustmentLineSchema = z.object({
  id: z.string(),
  productId: z.string().min(1),
  name: z.string(),
  sku: z.string(),
  primaryImage: z.string(),
  unit: z.string(),
  currentQty: z.coerce.number(),
  adjustmentQty: z.coerce.number().int()
})

export const createAdjustmentSchema = z
  .object({
    warehouseId: z.string().min(1, 'Select a warehouse'),
    reason: z.string().min(1, 'Select a reason'),
    requestedBy: z.string().min(1, 'Select who requested this adjustment'),
    date: z.string().min(1, 'Select a date'),
    notes: z.string().optional().default(''),
    lines: z.array(adjustmentLineSchema).min(1, 'Add at least one line item')
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (line.adjustmentQty === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Adjustment can't be zero",
          path: ['lines', index, 'adjustmentQty']
        })
      } else if (line.currentQty + line.adjustmentQty < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Would drive stock negative',
          path: ['lines', index, 'adjustmentQty']
        })
      }
    })
  })

export type CreateAdjustmentFormInput = z.input<typeof createAdjustmentSchema>
export type CreateAdjustmentFormValues = z.infer<typeof createAdjustmentSchema>
