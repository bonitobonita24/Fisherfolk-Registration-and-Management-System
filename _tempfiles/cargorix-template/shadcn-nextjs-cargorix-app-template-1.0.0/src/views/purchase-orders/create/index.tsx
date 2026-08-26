'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, CheckIcon, FileTextIcon, SaveIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Product } from '@/types/entities/product'
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'
import type { Warehouse } from '@/types/entities/warehouse'
import type { PurchaseOrderFormPatch } from '@/store/use-purchase-orders-store'
import type { CreatePurchaseOrderFormInput, CreatePurchaseOrderFormValues } from './create-purchase-order-schema'
import { TERMINAL_STATUSES } from '@/types/entities/purchase-order'

// Component Imports
import { Button } from '@/components/ui/button'
import AttachmentsNotesSection from './attachments-notes-section'
import LineItemsSection from './line-items-section'
import OrderDetailsSection from './order-details-section'
import PoSummarySidebar from './po-summary-sidebar'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { excludeDrafts } from '@/lib/exclude-drafts'

// Data Imports
import { createPurchaseOrderSchema } from './create-purchase-order-schema'

const createPurchaseOrderResolver = zodResolver as unknown as (
  schema: typeof createPurchaseOrderSchema
) => Resolver<CreatePurchaseOrderFormInput, unknown, CreatePurchaseOrderFormValues>

const EMPTY_VALUES: CreatePurchaseOrderFormInput = {
  supplierId: '',
  warehouseId: '',
  currency: 'USD',
  paymentTerms: 'Net 30',
  buyer: '',
  expectedDeliveryDate: '',
  shippingCost: 0,
  notes: '',
  internalNotes: '',
  lines: [],
  attachments: []
}

const mapPoToForm = (po: PurchaseOrder): CreatePurchaseOrderFormInput => ({
  supplierId: po.supplierId,
  warehouseId: po.warehouseId,
  currency: po.currency,
  paymentTerms: po.paymentTerms,
  buyer: po.buyer,
  expectedDeliveryDate: po.expectedDeliveryDate,
  shippingCost: po.shippingCost,
  notes: po.notes,
  internalNotes: po.internalNotes,
  lines: po.lines,
  attachments: po.attachments
})

type CreatePurchaseOrderViewProps = {
  poId: string
  seedProductIds?: string[]
  suppliers: Supplier[]
  products: Product[]
  warehouses: Warehouse[]
  purchaseOrders: PurchaseOrder[]
}

const CreatePurchaseOrderView = ({
  poId,
  seedProductIds,
  suppliers,
  products,
  warehouses,
  purchaseOrders
}: CreatePurchaseOrderViewProps) => {
  // Hooks
  const router = useRouter()
  const initializePurchaseOrders = usePurchaseOrdersStore(state => state.initialize)
  const initializeSuppliers = useSuppliersStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const createDraftPurchaseOrder = usePurchaseOrdersStore(state => state.createDraftPurchaseOrder)
  const savePurchaseOrderDraft = usePurchaseOrdersStore(state => state.savePurchaseOrderDraft)
  const confirmPurchaseOrder = usePurchaseOrdersStore(state => state.confirmPurchaseOrder)
  const updateActivePurchaseOrder = usePurchaseOrdersStore(state => state.updateActivePurchaseOrder)
  const po = usePurchaseOrdersStore(state => state.getPurchaseOrder(poId))
  const allSuppliers = useSuppliersStore(state => state.suppliers)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const allProducts = useProductsStore(state => state.products)

  // Vars
  const storeSuppliers = excludeDrafts(allSuppliers)
  const storeProducts = excludeDrafts(allProducts)
  const isDraft = po?.status === 'draft'
  const isTerminal = po ? TERMINAL_STATUSES.includes(po.status) : false
  const locked = !isDraft

  const isNew = !po?.number

  const form = useForm<CreatePurchaseOrderFormInput, unknown, CreatePurchaseOrderFormValues>({
    resolver: createPurchaseOrderResolver(createPurchaseOrderSchema),
    defaultValues: EMPTY_VALUES
  })

  const mapFormToPatch = (
    values: CreatePurchaseOrderFormValues | CreatePurchaseOrderFormInput
  ): PurchaseOrderFormPatch => {
    const selectedSupplier = storeSuppliers.find(supplier => supplier.id === values.supplierId)
    const selectedWarehouse = storeWarehouses.find(warehouse => warehouse.id === values.warehouseId)

    const lines = (values.lines ?? []).map(line => ({
      ...line,
      quantityOrdered: Number(line.quantityOrdered),
      unitCost: Number(line.unitCost),
      taxRatePercent: Number(line.taxRatePercent),
      discountPercent: Number(line.discountPercent),
      receivedQty: po?.lines.find(existing => existing.id === line.id)?.receivedQty ?? 0
    }))

    return {
      supplierId: values.supplierId ?? '',
      supplier: selectedSupplier
        ? {
            supplierId: selectedSupplier.id,
            name: selectedSupplier.name,
            contactPerson: selectedSupplier.contactPerson,
            email: selectedSupplier.email,
            phone: selectedSupplier.phone,
            address: selectedSupplier.address
          }
        : (po?.supplier ?? { supplierId: '', name: '', contactPerson: '', email: '', phone: '', address: '' }),
      warehouseId: values.warehouseId ?? '',
      warehouseName: selectedWarehouse?.name ?? po?.warehouseName ?? '',
      deliveryAddress: selectedWarehouse?.address ?? po?.deliveryAddress ?? '',
      currency: values.currency ?? 'USD',
      paymentTerms: values.paymentTerms ?? 'Net 30',
      buyer: values.buyer ?? '',
      expectedDeliveryDate: values.expectedDeliveryDate ?? '',
      lines,
      shippingCost: Number(values.shippingCost ?? 0),
      notes: values.notes ?? '',
      internalNotes: values.internalNotes ?? '',
      attachments: values.attachments ?? []
    }
  }

  const handleSaveDraft = () => {
    savePurchaseOrderDraft(poId, mapFormToPatch(form.getValues()))
    router.push('/purchase-orders')
  }

  const handleCreateAndConfirm = form.handleSubmit(values => {
    if (confirmPurchaseOrder(poId, mapFormToPatch(values))) router.push(`/purchase-orders/${poId}`)
  })

  const handleSaveChanges = () => {
    const values = form.getValues()

    if (isTerminal) {
      updateActivePurchaseOrder(poId, {
        internalNotes: values.internalNotes,
        attachments: values.attachments ?? []
      })
    } else {
      updateActivePurchaseOrder(poId, {
        expectedDeliveryDate: values.expectedDeliveryDate,
        buyer: values.buyer,
        internalNotes: values.internalNotes,
        attachments: values.attachments ?? [],
        trackingCarrier: po?.trackingCarrier ?? '',
        trackingNumber: po?.trackingNumber ?? ''
      })
    }

    router.push(`/purchase-orders/${poId}`)
  }

  useEffect(() => {
    initializePurchaseOrders(purchaseOrders)
  }, [initializePurchaseOrders, purchaseOrders])

  useEffect(() => {
    initializeSuppliers(suppliers)
  }, [initializeSuppliers, suppliers])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    createDraftPurchaseOrder(poId, seedProductIds)
  }, [createDraftPurchaseOrder, poId, seedProductIds])

  useEffect(() => {
    if (po) form.reset(mapPoToForm(po))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [po?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/purchase-orders' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to purchase orders
      </Button>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {isNew ? 'Create Purchase Order' : 'Edit Purchase Order'}
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            {isDraft
              ? 'Build the order, then confirm it to lock the commercial details.'
              : 'Update tracking, notes and attachments while the order is active.'}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {isDraft ? (
            <>
              <Button type='button' variant='outline' onClick={handleSaveDraft}>
                <FileTextIcon className='size-4' />
                Save draft
              </Button>
              <Button type='button' onClick={handleCreateAndConfirm}>
                <CheckIcon className='size-4' />
                Create & Confirm
              </Button>
            </>
          ) : (
            <Button type='button' onClick={handleSaveChanges}>
              <SaveIcon className='size-4' />
              Save changes
            </Button>
          )}
        </div>
      </div>

      <div className='relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='space-y-6'>
          <OrderDetailsSection
            control={form.control}
            po={po}
            suppliers={storeSuppliers}
            warehouses={storeWarehouses}
            locked={locked}
            isTerminal={isTerminal}
          />
          <LineItemsSection control={form.control} products={storeProducts} locked={locked} />

          <AttachmentsNotesSection control={form.control} isTerminal={isTerminal} />
        </div>

        <aside className='lg:sticky lg:top-18 lg:self-start'>
          <PoSummarySidebar
            control={form.control}
            po={po}
            suppliers={storeSuppliers}
            warehouses={storeWarehouses}
            isDraft={isDraft}
          />
        </aside>
      </div>
    </div>
  )
}

export default CreatePurchaseOrderView
