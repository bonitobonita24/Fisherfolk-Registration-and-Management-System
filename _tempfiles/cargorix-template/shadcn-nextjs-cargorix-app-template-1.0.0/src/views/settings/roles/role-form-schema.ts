// Third-party Imports
import { z } from 'zod'

export const resourcePermissionsSchema = z.object({
  resource: z.string(),
  read: z.boolean(),
  write: z.boolean(),
  create: z.boolean(),
  delete: z.boolean()
})

export const roleFormSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  permissions: z.array(resourcePermissionsSchema)
})

export type RoleFormInput = z.input<typeof roleFormSchema>
export type RoleFormValues = z.infer<typeof roleFormSchema>
