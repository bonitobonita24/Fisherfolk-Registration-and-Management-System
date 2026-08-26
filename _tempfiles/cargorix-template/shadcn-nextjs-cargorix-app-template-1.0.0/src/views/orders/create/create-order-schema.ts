// Third-party Imports
import { z } from 'zod'

// Util Imports
import { isBeforeDate } from '@/lib/date-bounds'

export const INTERNAL_NOTE_MAX_LENGTH = 500

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const createOrderSchema = z
  .object({
    entryReason: z.string().optional(),
    customerReference: z.string().optional(),
    internalNote: z
      .string()
      .max(INTERNAL_NOTE_MAX_LENGTH, `Keep the note under ${INTERNAL_NOTE_MAX_LENGTH} characters`)
      .optional(),

    clientId: z.string().min(1, 'Select a client'),
    contactName: z.string().optional(),
    contactEmail: z
      .string()
      .optional()
      .refine(value => !value || EMAIL_PATTERN.test(value), 'Enter a valid email'),
    contactPhone: z.string().optional(),
    billingAccount: z.string().optional(),

    pickupAddress: z.string().min(1, 'Pickup address is required'),
    pickupAddressDetail: z.string().optional(),
    deliveryAddress: z.string().min(1, 'Delivery address is required'),
    deliveryAddressDetail: z.string().optional(),
    requestedPickupAt: z.string().min(1, 'Requested pickup is required'),
    requiredDeliveryAt: z.string().min(1, 'Required delivery is required'),
    serviceLevel: z.enum(['regular', 'express', 'same_day']),

    packages: z
      .array(
        z.object({
          description: z.string().min(1, 'Description is required'),
          quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
          weightKg: z.coerce.number().min(0),
          lengthCm: z.coerce.number().min(0),
          widthCm: z.coerce.number().min(0),
          heightCm: z.coerce.number().min(0)
        })
      )
      .min(1, 'Add at least one package')
  })
  .refine(values => !isBeforeDate(values.requiredDeliveryAt, values.requestedPickupAt), {
    message: 'Required delivery cannot be before the requested pickup',
    path: ['requiredDeliveryAt']
  })

export type CreateOrderFormInput = z.input<typeof createOrderSchema>
export type CreateOrderFormValues = z.infer<typeof createOrderSchema>
