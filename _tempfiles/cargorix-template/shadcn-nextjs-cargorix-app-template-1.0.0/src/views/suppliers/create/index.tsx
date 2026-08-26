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

import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier, SupplierCategory, SupplierIncoterms, SupplierStatus } from '@/types/entities/supplier'
import type { SupplierFormPatch } from '@/store/use-suppliers-store'
import type { CreateSupplierFormInput, CreateSupplierFormValues } from './supplier-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AddSupplierView from './add/add-supplier-view'
import EditSupplierView from './edit/edit-supplier-view'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'

// Data Imports
import { supplierFormSchema } from './supplier-form-schema'

const supplierResolver = zodResolver as unknown as (
  schema: typeof supplierFormSchema
) => Resolver<CreateSupplierFormInput, unknown, CreateSupplierFormValues>

const CURRENT_OPERATOR = 'You'

const EMPTY_VALUES: CreateSupplierFormInput = {
  name: '',
  supplierCode: '',
  category: '',
  status: 'active',
  accountOwner: '',
  description: '',
  contactPerson: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  paymentTerms: '',
  currency: 'USD',
  leadTimeDays: '',
  minimumOrderValue: '',
  incoterms: '',
  priceValidityDays: '',
  productsSupplied: [],
  notes: '',
  documents: []
}

const mapSupplierToForm = (supplier: Supplier): CreateSupplierFormInput => ({
  name: supplier.name ?? '',
  supplierCode: supplier.supplierCode ?? '',
  category: supplier.category ?? '',
  status: supplier.status ?? 'active',
  accountOwner: supplier.accountOwner ?? '',
  description: supplier.description ?? '',
  contactPerson: supplier.contactPerson ?? '',
  email: supplier.email ?? '',
  phone: supplier.phone ?? '',
  addressLine1: supplier.addressLine1 ?? '',
  addressLine2: supplier.addressLine2 ?? '',
  city: supplier.city ?? '',
  state: supplier.state ?? '',
  postalCode: supplier.postalCode ?? '',
  country: supplier.country ?? '',
  paymentTerms: supplier.paymentTerms ?? '',
  currency: supplier.currency ?? 'USD',
  leadTimeDays: supplier.leadTimeDays ?? '',
  minimumOrderValue: supplier.minimumOrderValue ?? '',
  incoterms: supplier.incoterms ?? '',
  priceValidityDays: supplier.priceValidityDays ?? '',
  productsSupplied: supplier.productsSupplied ?? [],
  notes: supplier.notes ?? '',
  documents: supplier.documents ?? []
})

const toOptionalNumber = (value: unknown) => {
  const raw = String(value ?? '').trim()

  return raw === '' ? undefined : Number(raw)
}

const trimmed = (value: unknown) => String(value ?? '').trim()

const composeAddress = (values: CreateSupplierFormValues | CreateSupplierFormInput) => {
  const street = [trimmed(values.addressLine1), trimmed(values.addressLine2)].filter(Boolean).join(', ')
  const cityState = [trimmed(values.city), trimmed(values.state)].filter(Boolean).join(', ')
  const locality = [cityState, trimmed(values.postalCode)].filter(Boolean).join(' ')

  return [street, locality, trimmed(values.country)].filter(Boolean).join('\n')
}

const mapFormToPatch = (
  values: CreateSupplierFormValues | CreateSupplierFormInput,
  existing?: Supplier
): SupplierFormPatch => ({
  name: trimmed(values.name),
  supplierCode: trimmed(values.supplierCode) || undefined,
  category: (values.category as SupplierCategory) || existing?.category,
  status: (values.status as SupplierStatus) || existing?.status || 'active',
  accountOwner: trimmed(values.accountOwner) || undefined,
  description: trimmed(values.description) || undefined,
  contactPerson: trimmed(values.contactPerson),
  email: trimmed(values.email),
  phone: trimmed(values.phone),
  address: composeAddress(values) || existing?.address || '',
  addressLine1: trimmed(values.addressLine1) || undefined,
  addressLine2: trimmed(values.addressLine2) || undefined,
  city: trimmed(values.city) || undefined,
  state: trimmed(values.state) || undefined,
  postalCode: trimmed(values.postalCode) || undefined,
  country: trimmed(values.country) || undefined,
  paymentTerms: trimmed(values.paymentTerms) || undefined,
  currency: trimmed(values.currency) || 'USD',
  leadTimeDays: toOptionalNumber(values.leadTimeDays),
  minimumOrderValue: toOptionalNumber(values.minimumOrderValue),
  incoterms: (values.incoterms as SupplierIncoterms) || existing?.incoterms,
  priceValidityDays: toOptionalNumber(values.priceValidityDays),
  productsSupplied: values.productsSupplied ?? existing?.productsSupplied ?? [],
  documents: values.documents ?? existing?.documents ?? [],
  notes: trimmed(values.notes) || undefined,
  lastUpdatedAt: format(new Date(), 'yyyy-MM-dd'),
  lastUpdatedBy: CURRENT_OPERATOR
})

// Props
type CreateSupplierViewProps = {
  supplierId: string
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
}

const CreateSupplierView = ({ supplierId, suppliers, purchaseOrders }: CreateSupplierViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeSuppliers = useSuppliersStore(state => state.initialize)
  const initializePurchaseOrders = usePurchaseOrdersStore(state => state.initialize)
  const createDraftSupplier = useSuppliersStore(state => state.createDraftSupplier)
  const saveSupplierDraft = useSuppliersStore(state => state.saveSupplierDraft)
  const commitSupplier = useSuppliersStore(state => state.commitSupplier)
  const updateSupplier = useSuppliersStore(state => state.updateSupplier)
  const supplier = useSuppliersStore(state => state.getSupplier(supplierId))

  // Vars
  const isNew = Boolean(supplier?.isDraft)

  const form = useForm<CreateSupplierFormInput, unknown, CreateSupplierFormValues>({
    resolver: supplierResolver(supplierFormSchema),
    defaultValues: EMPTY_VALUES
  })

  const handleSaveDraft = () => {
    saveSupplierDraft(supplierId, mapFormToPatch(form.getValues(), supplier))
    router.push('/suppliers')
  }

  const handleAdd = form.handleSubmit(values => {
    commitSupplier(supplierId, mapFormToPatch(values, supplier))
    router.push(`/suppliers/${supplierId}`)
  })

  const handleSaveChanges = form.handleSubmit(values => {
    updateSupplier(supplierId, mapFormToPatch(values, supplier))
    router.push(`/suppliers/${supplierId}`)
  })

  useEffect(() => {
    initializeSuppliers(suppliers)
  }, [initializeSuppliers, suppliers])

  useEffect(() => {
    initializePurchaseOrders(purchaseOrders)
  }, [initializePurchaseOrders, purchaseOrders])

  useEffect(() => {
    createDraftSupplier(supplierId)
  }, [createDraftSupplier, supplierId])

  useEffect(() => {
    if (supplier) form.reset(mapSupplierToForm(supplier))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/suppliers' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to suppliers
      </Button>

      {isNew ? (
        <AddSupplierView
          control={form.control}
          purchaseOrders={purchaseOrders}
          onSaveDraft={handleSaveDraft}
          onAdd={handleAdd}
        />
      ) : supplier ? (
        <EditSupplierView
          control={form.control}
          supplier={supplier}
          purchaseOrders={purchaseOrders}
          onSaveChanges={handleSaveChanges}
        />
      ) : null}
    </div>
  )
}

export default CreateSupplierView
