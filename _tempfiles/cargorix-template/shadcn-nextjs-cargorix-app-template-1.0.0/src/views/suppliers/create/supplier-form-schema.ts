// Third-party Imports
import { z } from 'zod'

// Type Imports
import type { SupplierDocument } from '@/types/entities/supplier'
import { SUPPLIER_INCOTERMS_LIST } from '@/types/entities/supplier'

// Data Imports
import { TEAM_MEMBERS } from '@/fake-db/entities/team-members'
import { CATEGORY_OPTIONS, INCOTERMS_LABEL, SUPPLIER_STATUS_OPTIONS } from '../supplier-badges'

const emptyToUndefined = (value: unknown) => (String(value ?? '').trim() === '' ? undefined : value)

const requiredNumber = (message: string) =>
  z.preprocess(emptyToUndefined, z.coerce.number({ error: message }).min(0, message))

const optionalNumber = (message: string) => z.preprocess(emptyToUndefined, z.coerce.number().min(0, message).optional())

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Enter a supplier name'),
  supplierCode: z.string().min(1, 'Enter a supplier code'),
  category: z.string().min(1, 'Select a category'),
  status: z.string().min(1, 'Select a status'),
  accountOwner: z.string().optional().default(''),
  description: z.string().optional().default(''),
  contactPerson: z.string().min(1, 'Enter a contact person'),
  email: z.string().min(1, 'Enter an email').email('Enter a valid email'),
  phone: z.string().min(1, 'Enter a phone number'),
  addressLine1: z.string().min(1, 'Enter an address'),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(1, 'Enter a city'),
  state: z.string().min(1, 'Enter a state / region'),
  postalCode: z.string().min(1, 'Enter a postal code'),
  country: z.string().min(1, 'Select a country'),
  paymentTerms: z.string().min(1, 'Select payment terms'),
  currency: z.string().min(1, 'Select a currency'),
  leadTimeDays: requiredNumber('Enter a lead time of 0 days or more'),
  minimumOrderValue: requiredNumber('Enter a minimum order value of 0 or more'),
  incoterms: z.string().optional().default(''),
  priceValidityDays: optionalNumber('Enter a price validity of 0 days or more'),
  productsSupplied: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),

  documents: z.array(z.custom<SupplierDocument>()).optional().default([])
})

export type CreateSupplierFormInput = z.input<typeof supplierFormSchema>
export type CreateSupplierFormValues = z.infer<typeof supplierFormSchema>

export const CATEGORY_SELECT_OPTIONS = CATEGORY_OPTIONS.filter(option => option.value !== 'all').map(option => ({
  label: option.label,
  value: option.value as string
}))

export const STATUS_SELECT_OPTIONS = SUPPLIER_STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => ({
  label: option.label,
  value: option.value as string
}))

export const ACCOUNT_OWNER_OPTIONS = TEAM_MEMBERS.map(member => ({ label: member, value: member }))

export const INCOTERMS_SELECT_OPTIONS = SUPPLIER_INCOTERMS_LIST.map(incoterms => ({
  label: INCOTERMS_LABEL[incoterms],
  value: incoterms as string
}))

export const PAYMENT_TERMS_SELECT_OPTIONS = ['Net 30', 'Net 15', 'Net 60', 'Due on receipt'].map(terms => ({
  label: terms,
  value: terms
}))

export const CURRENCY_OPTIONS = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' }
]

export const COUNTRY_OPTIONS = [
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'Netherlands',
  'China',
  'Taiwan',
  'Vietnam',
  'India'
].map(country => ({ label: country, value: country }))

export const PRODUCTS_SUPPLIED_SUGGESTIONS = [
  'Accessories',
  'Adhesives',
  'Aluminium Stock',
  'Audio',
  'Branded Apparel',
  'Cables',
  'Cleaning Agents',
  'Coatings',
  'Conveyors',
  'Dock Equipment',
  'Drayage',
  'Electronics',
  'Forklifts',
  'Freight Services',
  'Janitorial',
  'Labels',
  'Networking',
  'Office Supplies',
  'Packaging',
  'Pallet Wrap',
  'Power Accessories',
  'Racking',
  'Recycled Fibre',
  'Resin Pellets',
  'Safety Gear',
  'Spare Parts',
  'Steel Sheet',
  'Textiles',
  'Timber',
  'Void Fill',
  'Warehousing',
  'Workwear'
]
