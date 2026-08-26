// Third-party Imports
import { format } from 'date-fns'
import { create } from 'zustand'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

export type SupplierFormPatch = Partial<
  Pick<
    Supplier,
    | 'name'
    | 'contactPerson'
    | 'contactJobTitle'
    | 'email'
    | 'phone'
    | 'address'
    | 'supplierCode'
    | 'category'
    | 'status'
    | 'accountOwner'
    | 'description'
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'state'
    | 'postalCode'
    | 'country'
    | 'paymentTerms'
    | 'currency'
    | 'leadTimeDays'
    | 'minimumOrderValue'
    | 'incoterms'
    | 'priceValidityDays'
    | 'productsSupplied'
    | 'notes'
    | 'documents'
    | 'onboardedAt'
    | 'lastUpdatedAt'
    | 'lastUpdatedBy'
  >
>

const buildEmptySupplier = (id: string): Supplier => ({
  id,
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  isDraft: true,
  status: 'active',
  currency: 'USD',
  productsSupplied: [],
  documents: [],
  activity: []
})

interface SuppliersState {
  suppliers: Supplier[]

  initialize: (suppliers: Supplier[]) => void
  getSupplier: (id: string) => Supplier | undefined
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  createDraftSupplier: (id: string) => void
  saveSupplierDraft: (id: string, patch: SupplierFormPatch) => void
  commitSupplier: (id: string, patch: SupplierFormPatch) => void
}

export const useSuppliersStore = create<SuppliersState>()((set, get) => ({
  suppliers: [],

  initialize: suppliers => {
    if (get().suppliers.length > 0) return
    set({ suppliers })
  },

  getSupplier: id => get().suppliers.find(s => s.id === id),

  updateSupplier: (id, updates) =>
    set(state => ({ suppliers: state.suppliers.map(s => (s.id === id ? { ...s, ...updates } : s)) })),

  createDraftSupplier: id => {
    if (get().suppliers.some(s => s.id === id)) return
    set(state => ({ suppliers: [buildEmptySupplier(id), ...state.suppliers] }))
  },

  saveSupplierDraft: (id, patch) =>
    set(state => ({ suppliers: state.suppliers.map(s => (s.id === id ? { ...s, ...patch, isDraft: true } : s)) })),

  commitSupplier: (id, patch) =>
    set(state => ({
      suppliers: state.suppliers.map(s =>
        s.id === id
          ? {
              ...s,
              ...patch,
              onboardedAt: patch.onboardedAt ?? s.onboardedAt ?? format(new Date(), 'yyyy-MM-dd'),
              isDraft: false
            }
          : s
      )
    }))
}))
