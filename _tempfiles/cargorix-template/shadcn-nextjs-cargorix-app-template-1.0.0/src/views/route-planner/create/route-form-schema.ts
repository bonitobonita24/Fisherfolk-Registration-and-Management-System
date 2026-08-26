// Third-party Imports
import { z } from 'zod'

export const routeFormSchema = z.object({
  routeId: z.string(),
  startWarehouseId: z.string().min(1, 'Start warehouse is required'),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  date: z.string().min(1, 'Schedule date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  returnToStart: z.boolean(),
  notes: z.string().max(500, 'Notes must be 500 characters or fewer').optional()
})

export type CreateRouteFormInput = z.input<typeof routeFormSchema>
export type CreateRouteFormValues = z.output<typeof routeFormSchema>

export const NOTES_MAX_LENGTH = 500
