export type ClientStatus = 'active' | 'on_hold' | 'inactive'
export const CLIENT_STATUS_LIST: ClientStatus[] = ['active', 'on_hold', 'inactive']

export type PaymentTerms = 'prepaid' | 'net_15' | 'net_30' | 'net_45' | 'net_60'
export const PAYMENT_TERMS_LIST: PaymentTerms[] = ['prepaid', 'net_15', 'net_30', 'net_45', 'net_60']

export type ClientAccountType = 'standard' | 'key' | 'enterprise'

export type PreferredContactMethod = 'email' | 'phone' | 'mobile'

export type ClientDocType = 'pdf' | 'png' | 'jpg'

export interface ClientDocument {
  id: string
  name: string
  type: ClientDocType
  sizeLabel: string
  uploadedAt: string
}

export interface ClientActivityEntry {
  id: string
  label: string
  at: string
  icon: 'shopping-cart' | 'truck' | 'file-text' | 'user'
}

export interface Client {
  id: string
  name: string
  industry: string
  contactName: string
  email: string
  phone: string
  billingAccount: string
  avatarInitials: string

  isDraft?: boolean
  clientCode?: string
  legalName?: string
  status?: ClientStatus
  accountType?: ClientAccountType
  accountManager?: string
  description?: string
  memberSince?: string

  contactJobTitle?: string
  contactMobile?: string
  preferredContactMethod?: PreferredContactMethod

  city?: string
  state?: string
  country?: string

  billingAddress?: string
  shippingAddress?: string

  paymentTerms?: PaymentTerms
  currency?: string
  creditLimit?: number
  billingEmail?: string
  taxId?: string

  preferredServices?: string[]
  notes?: string
  notesUpdatedBy?: string
  notesUpdatedAt?: string
  documents?: ClientDocument[]
  activity?: ClientActivityEntry[]

  historicalOrders?: number
  historicalRevenue?: number
}
