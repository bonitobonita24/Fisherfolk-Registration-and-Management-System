// Third-party Imports
import { z } from 'zod'

// Type Imports
import { PAYMENT_TERMS_LIST } from '@/types/entities/client'

// Data Imports
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'
import { CLIENT_STATUS_OPTIONS, INDUSTRY_OPTIONS, PAYMENT_TERMS_LABEL } from '../client-badges'

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Enter a client name'),
  clientCode: z.string().min(1, 'Enter a client code'),
  legalName: z.string().optional().default(''),
  industry: z.string().optional().default(''),
  status: z.string().optional().default('active'),
  accountType: z.string().optional().default('standard'),
  accountManager: z.string().min(1, 'Select an account manager'),
  contactName: z.string().min(1, 'Enter a contact name'),
  contactJobTitle: z.string().optional().default(''),
  email: z.string().min(1, 'Enter an email').email('Enter a valid email'),
  phone: z.string().min(1, 'Enter a phone number'),
  contactMobile: z.string().optional().default(''),
  preferredContactMethod: z.string().optional().default(''),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  country: z.string().optional().default(''),
  billingAddress: z.string().min(1, 'Enter a billing address'),
  shippingAddress: z.string().optional().default(''),
  sameAsBilling: z.boolean().optional().default(false),
  paymentTerms: z.string().min(1, 'Select payment terms'),
  currency: z.string().min(1, 'Select a currency'),
  creditLimit: z.coerce.number().min(0, 'Enter a credit limit of 0 or more').optional(),
  billingEmail: z.string().min(1, 'Enter a billing email').email('Enter a valid email'),
  taxId: z.string().optional().default(''),
  preferredServices: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default('')
})

export type CreateClientFormInput = z.input<typeof clientFormSchema>
export type CreateClientFormValues = z.infer<typeof clientFormSchema>

export const INDUSTRY_SELECT_OPTIONS = INDUSTRY_OPTIONS.map(industry => ({ label: industry, value: industry }))

export const STATUS_SELECT_OPTIONS = CLIENT_STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => ({
  label: option.label,
  value: option.value as string
}))

export const PAYMENT_TERMS_SELECT_OPTIONS = PAYMENT_TERMS_LIST.map(terms => ({
  label: PAYMENT_TERMS_LABEL[terms],
  value: terms as string
}))

export const ACCOUNT_MANAGER_OPTIONS = TEAM_MEMBERS.map(member => ({ label: member, value: member }))

export const CURRENCY_OPTIONS = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' }
]

export const PREFERRED_CONTACT_OPTIONS = [
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Mobile', value: 'mobile' }
]
