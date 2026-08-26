'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type {
  Client,
  ClientAccountType,
  ClientStatus,
  PaymentTerms,
  PreferredContactMethod
} from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'
import type { ClientFormPatch } from '@/store/use-clients-store'
import type { CreateClientFormInput, CreateClientFormValues } from './client-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AddClientView from './add/add-client-view'
import EditClientView from './edit/edit-client-view'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Util Imports
import { getInitials } from '@/lib/get-initials'

// Data Imports
import { clientFormSchema } from './client-form-schema'
import { PAYMENT_TERMS_LABEL } from '../client-badges'

const clientResolver = zodResolver as unknown as (
  schema: typeof clientFormSchema
) => Resolver<CreateClientFormInput, unknown, CreateClientFormValues>

const CURRENT_OPERATOR = 'You'

const EMPTY_VALUES: CreateClientFormInput = {
  name: '',
  clientCode: '',
  legalName: '',
  industry: '',
  status: 'active',
  accountType: 'standard',
  accountManager: '',
  contactName: '',
  contactJobTitle: '',
  email: '',
  phone: '',
  contactMobile: '',
  preferredContactMethod: '',
  city: '',
  state: '',
  country: '',
  billingAddress: '',
  shippingAddress: '',
  sameAsBilling: false,
  paymentTerms: '',
  currency: 'USD',
  creditLimit: undefined,
  billingEmail: '',
  taxId: '',
  preferredServices: [],
  notes: ''
}

const mapClientToForm = (client: Client): CreateClientFormInput => ({
  name: client.name ?? '',
  clientCode: client.clientCode ?? '',
  legalName: client.legalName ?? '',
  industry: client.industry ?? '',
  status: client.status ?? 'active',
  accountType: client.accountType ?? 'standard',
  accountManager: client.accountManager ?? '',
  contactName: client.contactName ?? '',
  contactJobTitle: client.contactJobTitle ?? '',
  email: client.email ?? '',
  phone: client.phone ?? '',
  contactMobile: client.contactMobile ?? '',
  preferredContactMethod: client.preferredContactMethod ?? '',
  city: client.city ?? '',
  state: client.state ?? '',
  country: client.country ?? '',
  billingAddress: client.billingAddress ?? '',
  shippingAddress: client.shippingAddress ?? '',
  sameAsBilling: Boolean(client.billingAddress) && client.billingAddress === client.shippingAddress,
  paymentTerms: client.paymentTerms ?? '',
  currency: client.currency ?? 'USD',
  creditLimit: client.creditLimit,
  billingEmail: client.billingEmail ?? '',
  taxId: client.taxId ?? '',
  preferredServices: client.preferredServices ?? [],
  notes: client.notes ?? ''
})

const mapFormToPatch = (values: CreateClientFormValues | CreateClientFormInput, existing?: Client): ClientFormPatch => {
  const name = (values.name ?? '').trim()
  const paymentTerms = values.paymentTerms ? (values.paymentTerms as PaymentTerms) : undefined
  const termsLabel = paymentTerms ? PAYMENT_TERMS_LABEL[paymentTerms] : ''
  const creditLimit = String(values.creditLimit ?? '').trim()
  const notes = values.notes || undefined
  const notesChanged = notes !== existing?.notes

  return {
    name,
    avatarInitials: getInitials(name),
    billingAccount: [name, termsLabel].filter(Boolean).join(' — '),
    clientCode: values.clientCode,
    legalName: values.legalName || undefined,
    industry: values.industry ?? '',
    status: values.status ? (values.status as ClientStatus) : undefined,
    accountType: values.accountType ? (values.accountType as ClientAccountType) : undefined,
    accountManager: values.accountManager || undefined,
    contactName: values.contactName ?? '',
    contactJobTitle: values.contactJobTitle || undefined,
    email: values.email ?? '',
    phone: values.phone ?? '',
    contactMobile: values.contactMobile || undefined,
    preferredContactMethod: values.preferredContactMethod
      ? (values.preferredContactMethod as PreferredContactMethod)
      : undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    country: values.country || undefined,
    billingAddress: values.billingAddress,
    shippingAddress: values.sameAsBilling ? values.billingAddress : values.shippingAddress || undefined,
    paymentTerms,
    currency: values.currency,
    creditLimit: creditLimit === '' ? undefined : Number(creditLimit),
    billingEmail: values.billingEmail || undefined,
    taxId: values.taxId || undefined,
    preferredServices: values.preferredServices ?? [],
    notes,
    ...(notesChanged ? { notesUpdatedBy: CURRENT_OPERATOR, notesUpdatedAt: format(new Date(), 'yyyy-MM-dd') } : {})
  }
}

// Props
type CreateClientViewProps = {
  clientId: string
  clients: Client[]
  orders: Order[]
  shipments: Shipment[]
}

const CreateClientView = ({ clientId, clients, orders, shipments }: CreateClientViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeClients = useClientsStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const initializeShipments = useShipmentsStore(state => state.initialize)
  const createDraftClient = useClientsStore(state => state.createDraftClient)
  const saveClientDraft = useClientsStore(state => state.saveClientDraft)
  const commitClient = useClientsStore(state => state.commitClient)
  const updateClient = useClientsStore(state => state.updateClient)
  const client = useClientsStore(state => state.getClient(clientId))

  // Vars
  const isNew = Boolean(client?.isDraft)

  const form = useForm<CreateClientFormInput, unknown, CreateClientFormValues>({
    resolver: clientResolver(clientFormSchema),
    defaultValues: EMPTY_VALUES
  })

  const handleSaveDraft = () => {
    saveClientDraft(clientId, mapFormToPatch(form.getValues(), client))
    router.push('/clients')
  }

  const handleAdd = form.handleSubmit(values => {
    commitClient(clientId, mapFormToPatch(values, client))
    router.push(`/clients/${clientId}`)
  })

  const handleSaveChanges = form.handleSubmit(values => {
    updateClient(clientId, mapFormToPatch(values, client))
    router.push(`/clients/${clientId}`)
  })

  useEffect(() => {
    initializeClients(clients)
  }, [initializeClients, clients])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    initializeShipments(shipments)
  }, [initializeShipments, shipments])

  useEffect(() => {
    createDraftClient(clientId)
  }, [createDraftClient, clientId])

  useEffect(() => {
    if (client) form.reset(mapClientToForm(client))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/clients' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to clients
      </Button>

      {isNew ? (
        <AddClientView control={form.control} onSaveDraft={handleSaveDraft} onAdd={handleAdd} />
      ) : client ? (
        <EditClientView control={form.control} client={client} onSaveChanges={handleSaveChanges} />
      ) : null}
    </div>
  )
}

export default CreateClientView
