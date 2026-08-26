// Third-party Imports
import { z } from 'zod'

// Util Imports
import { isBeforeDate } from '@/lib/date-bounds'

export const createShipmentSchema = z
  .object({
    serviceLevel: z.enum(['regular', 'express', 'same_day']),
    originHub: z.string().min(1, 'Select an origin hub'),
    pickupWindowStart: z.string().min(1, 'Pickup window start is required'),
    pickupWindowEnd: z.string().min(1, 'Pickup window end is required'),
    deliveryDeadline: z.string().min(1, 'Delivery deadline is required'),
    routeType: z.string().min(1),
    driverId: z.string().optional(),
    vehicleId: z.string().optional(),
    carrier: z.string().min(1, 'Carrier is required'),
    trackingDeviceId: z.string().optional(),
    generateLabels: z.boolean(),
    sendTrackingLink: z.boolean(),
    requireProofOfDelivery: z.boolean(),
    driverInstructions: z.string().optional()
  })
  .refine(values => !isBeforeDate(values.pickupWindowEnd, values.pickupWindowStart), {
    message: 'Pickup window end cannot be before its start',
    path: ['pickupWindowEnd']
  })
  .refine(values => !isBeforeDate(values.deliveryDeadline, values.pickupWindowEnd), {
    message: 'Delivery deadline cannot be before the pickup window ends',
    path: ['deliveryDeadline']
  })

export type CreateShipmentFormInput = z.input<typeof createShipmentSchema>
export type CreateShipmentFormValues = z.infer<typeof createShipmentSchema>
