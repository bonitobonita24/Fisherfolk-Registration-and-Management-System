// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Client } from '@/types/entities/client'

export type ClientFormPatch = Partial<
  Pick<
    Client,
    | 'name'
    | 'avatarInitials'
    | 'billingAccount'
    | 'clientCode'
    | 'legalName'
    | 'industry'
    | 'status'
    | 'accountType'
    | 'accountManager'
    | 'contactName'
    | 'contactJobTitle'
    | 'email'
    | 'phone'
    | 'contactMobile'
    | 'preferredContactMethod'
    | 'city'
    | 'state'
    | 'country'
    | 'billingAddress'
    | 'shippingAddress'
    | 'paymentTerms'
    | 'currency'
    | 'creditLimit'
    | 'billingEmail'
    | 'taxId'
    | 'preferredServices'
    | 'notes'
    | 'notesUpdatedBy'
    | 'notesUpdatedAt'
    | 'documents'
  >
>

const buildEmptyClient = (id: string): Client => ({
  id,
  name: '',
  industry: '',
  contactName: '',
  email: '',
  phone: '',
  billingAccount: '',
  avatarInitials: '',
  isDraft: true,
  status: 'active',
  accountType: 'standard',
  currency: 'USD',
  preferredServices: [],
  documents: [],
  activity: []
})

interface ClientsState {
  clients: Client[]

  initialize: (clients: Client[]) => void
  getClient: (id: string) => Client | undefined
  updateClient: (id: string, updates: Partial<Client>) => void
  createDraftClient: (id: string) => void
  saveClientDraft: (id: string, patch: ClientFormPatch) => void
  commitClient: (id: string, patch: ClientFormPatch) => void
}

export const useClientsStore = create<ClientsState>()((set, get) => ({
  clients: [],

  initialize: clients => {
    if (get().clients.length > 0) return
    set({ clients })
  },

  getClient: id => get().clients.find(c => c.id === id),

  updateClient: (id, updates) =>
    set(state => ({ clients: state.clients.map(c => (c.id === id ? { ...c, ...updates } : c)) })),

  createDraftClient: id => {
    if (get().clients.some(c => c.id === id)) return
    set(state => ({ clients: [buildEmptyClient(id), ...state.clients] }))
  },

  saveClientDraft: (id, patch) =>
    set(state => ({ clients: state.clients.map(c => (c.id === id ? { ...c, ...patch, isDraft: true } : c)) })),

  commitClient: (id, patch) =>
    set(state => ({ clients: state.clients.map(c => (c.id === id ? { ...c, ...patch, isDraft: false } : c)) }))
}))
