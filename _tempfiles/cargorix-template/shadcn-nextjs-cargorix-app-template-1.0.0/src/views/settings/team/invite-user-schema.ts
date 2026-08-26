// Third-party Imports
import { z } from 'zod'

export const inviteUserSchema = z.object({
  name: z.string().min(1, 'Enter a full name'),
  email: z.string().min(1, 'Enter an email').email('Enter a valid email'),
  jobTitle: z.string().min(1, 'Enter a job title'),
  roleId: z.string().min(1, 'Select a role'),
  warehouseIds: z.array(z.string())
})

export type InviteUserFormInput = z.input<typeof inviteUserSchema>
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>
