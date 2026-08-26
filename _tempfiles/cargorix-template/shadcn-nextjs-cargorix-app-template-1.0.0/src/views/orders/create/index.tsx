'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryState } from 'nuqs'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import AddOrderView from './add/add-order-view'
import EditOrderView from './edit/edit-order-view'
import OrderFormSections from './order-form-sections'
import OrderPreviewSidebar from './order-preview-sidebar'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import {
  computeOrderTotal,
  computeRouteMetrics,
  getDeliveryLocations,
  getPickupLocations
} from '@/lib/selectors/orders-selectors'
import { excludeDrafts } from '@/lib/exclude-drafts'
import { toOrderPackages, toPackageFormValues } from './order-package-mapper'

// Data Imports
import { createOrderSchema } from './create-order-schema'

import type { CreateOrderFormInput, CreateOrderFormValues } from './create-order-schema'

const createOrderResolver = zodResolver as unknown as (
  schema: typeof createOrderSchema
) => Resolver<CreateOrderFormInput, unknown, CreateOrderFormValues>

const EMPTY_VALUES: CreateOrderFormInput = {
  entryReason: 'Customer placed order by phone',
  customerReference: '',
  internalNote: '',
  clientId: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  billingAccount: '',
  pickupAddress: '',
  pickupAddressDetail: '',
  deliveryAddress: '',
  deliveryAddressDetail: '',
  requestedPickupAt: '',
  requiredDeliveryAt: '',
  serviceLevel: 'regular',
  packages: [{ description: '', quantity: 1, weightKg: '', lengthCm: '', widthCm: '', heightCm: '' }]
}

type CreateOrderViewProps = {
  orderId: string
  clients: Client[]
  warehouses: Warehouse[]
  orders: Order[]
}

const CreateOrderView = ({ orderId, clients, warehouses, orders }: CreateOrderViewProps) => {
  // States
  const [showSuccess, setShowSuccess] = useState(false)

  // Refs
  const hydratedFor = useRef<string | null>(null)
  const scrolledFor = useRef<string | null>(null)

  // Hooks
  const router = useRouter()
  const [section] = useQueryState('section')
  const initializeClients = useClientsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeOrders = useOrdersStore(state => state.initialize)
  const storeClients = useClientsStore(state => state.clients)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const storeOrders = useOrdersStore(state => state.orders)
  const createDraftOrder = useOrdersStore(state => state.createDraftOrder)
  const updateOrder = useOrdersStore(state => state.updateOrder)
  const saveOrderEdits = useOrdersStore(state => state.saveOrderEdits)
  const confirmOrder = useOrdersStore(state => state.confirmOrder)
  const order = useOrdersStore(state => state.getOrder(orderId))

  // Vars
  const clientOptions = excludeDrafts(storeClients.length > 0 ? storeClients : clients)
  const warehouseOptions = storeWarehouses.length > 0 ? storeWarehouses : warehouses
  const orderPool = excludeDrafts(storeOrders.length > 0 ? storeOrders : orders)
  const pickupLocations = getPickupLocations(warehouseOptions)
  const deliveryLocations = getDeliveryLocations(orderPool)
  const isNew = order?.status === 'draft'
  const isEditing = Boolean(order) && !isNew

  const form = useForm<CreateOrderFormInput, unknown, CreateOrderFormValues>({
    resolver: createOrderResolver(createOrderSchema),
    defaultValues: EMPTY_VALUES
  })

  useEffect(() => {
    initializeClients(clients)
  }, [initializeClients, clients])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    initializeOrders(orders)
  }, [initializeOrders, orders])

  useEffect(() => {
    createDraftOrder(orderId)
  }, [createDraftOrder, orderId])

  useEffect(() => {
    if (hydratedFor.current === orderId) return

    const existing = useOrdersStore.getState().getOrder(orderId)

    if (!existing) return

    hydratedFor.current = orderId

    if (!existing.clientId && !existing.pickupAddress && existing.packages.length === 0) return

    form.reset({
      entryReason: existing.entryReason || EMPTY_VALUES.entryReason,
      customerReference: existing.customerReference ?? '',
      internalNote: existing.internalNote ?? '',
      clientId: existing.clientId ?? '',
      contactName: existing.contactName ?? '',
      contactEmail: existing.contactEmail ?? '',
      contactPhone: existing.contactPhone ?? '',
      billingAccount: existing.billingAccount ?? '',
      pickupAddress: existing.pickupAddress ?? '',
      pickupAddressDetail: existing.pickupAddressDetail ?? '',
      deliveryAddress: existing.deliveryAddress ?? '',
      deliveryAddressDetail: existing.deliveryAddressDetail ?? '',
      requestedPickupAt: existing.requestedPickupAt ?? '',
      requiredDeliveryAt: existing.requiredDeliveryAt ?? '',
      serviceLevel: existing.serviceLevel ?? 'regular',
      packages: existing.packages.length > 0 ? toPackageFormValues(existing.packages) : EMPTY_VALUES.packages
    })
  }, [form, orderId, storeOrders])

  useEffect(() => {
    if (section !== 'packages' || scrolledFor.current === orderId || hydratedFor.current !== orderId) return

    scrolledFor.current = orderId
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [section, orderId, storeOrders])

  const buildUpdates = (values: CreateOrderFormValues) => {
    const packages = toOrderPackages(values.packages, `pkg-${orderId}`)
    const pickup = pickupLocations.find(option => option.value === values.pickupAddress)
    const delivery = deliveryLocations.find(option => option.value === values.deliveryAddress)
    const metrics = pickup && delivery ? computeRouteMetrics(pickup, delivery) : null

    return {
      isDraft: false,
      entryReason: values.entryReason,
      customerReference: values.customerReference,
      internalNote: values.internalNote,
      clientId: values.clientId,
      contactName: values.contactName ?? '',
      contactEmail: values.contactEmail ?? '',
      contactPhone: values.contactPhone ?? '',
      billingAccount: values.billingAccount ?? '',
      currency: 'USD',
      pickupAddress: values.pickupAddress,
      pickupAddressDetail: values.pickupAddressDetail || (pickup?.detail ?? ''),
      pickupLat: pickup?.lat ?? 0,
      pickupLng: pickup?.lng ?? 0,
      deliveryAddress: values.deliveryAddress,
      deliveryAddressDetail: values.deliveryAddressDetail || (delivery?.detail ?? ''),
      deliveryLat: delivery?.lat ?? 0,
      deliveryLng: delivery?.lng ?? 0,
      distanceKm: metrics?.distanceKm ?? 0,
      etaMinutes: metrics?.etaMinutes ?? 0,
      tollEstimate: metrics?.tollEstimate ?? 0,
      requestedPickupAt: values.requestedPickupAt,
      requiredDeliveryAt: values.requiredDeliveryAt,
      serviceLevel: values.serviceLevel,
      priority: 'normal' as const,
      packages,
      declaredValue: 0,
      handlingRequirement: 'standard' as const,
      totalAmount: computeOrderTotal(values.serviceLevel, packages)
    }
  }

  const handleSaveDraft = form.handleSubmit(values => {
    updateOrder(orderId, buildUpdates(values))
    router.push('/orders')
  })

  const handleCreateAndReview = form.handleSubmit(values => {
    updateOrder(orderId, buildUpdates(values))

    const confirmed = confirmOrder(orderId)

    if (confirmed) setShowSuccess(true)
  })

  const handleSaveChanges = form.handleSubmit(values => {
    saveOrderEdits(orderId, buildUpdates(values))
    router.push(`/orders/${orderId}`)
  })

  const sections = (
    <OrderFormSections
      control={form.control}
      setValue={form.setValue}
      clients={clientOptions}
      pickupLocations={pickupLocations}
      deliveryLocations={deliveryLocations}
    />
  )

  const sidebar = <OrderPreviewSidebar control={form.control} clients={clientOptions} />

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href={isEditing ? `/orders/${orderId}` : '/orders'} />}
      >
        <ArrowLeftIcon className='size-4' />
        {isEditing ? 'Back to order' : 'Back to orders'}
      </Button>

      {isNew ? (
        <AddOrderView
          sections={sections}
          sidebar={sidebar}
          onSaveDraft={handleSaveDraft}
          onCreate={handleCreateAndReview}
        />
      ) : order ? (
        <EditOrderView
          order={order}
          sections={sections}
          sidebar={sidebar}
          onSaveChanges={handleSaveChanges}
          onCancel={() => router.push(`/orders/${orderId}`)}
        />
      ) : null}

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className='max-w-md text-center'>
          <DialogTitle>Manual order created</DialogTitle>
          <p className='text-muted-foreground text-sm'>
            The order is saved as <strong>Pending review</strong>. Confirm it after validating client, route, goods and
            pricing.
          </p>
          <div className='mt-4 grid grid-cols-2 gap-3'>
            <Button variant='outline' onClick={() => setShowSuccess(false)}>
              Stay here
            </Button>
            <Button onClick={() => router.push(`/orders/${orderId}`)}>Review order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateOrderView
