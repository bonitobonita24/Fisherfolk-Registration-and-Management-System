'use client'

// Third-party Imports
import { FileTextIcon, PackageIcon, RouteIcon, UserIcon } from 'lucide-react'

// Type Imports
import type { Control, UseFormSetValue } from 'react-hook-form'

import type { Client } from '@/types/entities/client'
import type { OrderLocationOption } from '@/lib/selectors/orders-selectors'
import type { CreateOrderFormInput } from './create-order-schema'

// Component Imports
import { Card } from '@/components/ui/card'
import ClientBillingSection from './client-billing-section'
import FormSection from './form-section'
import ManualEntrySection from './manual-entry-section'
import PackagesSection from './packages-section'
import PickupDeliverySection from './pickup-delivery-section'

type OrderFormSectionsProps = {
  control: Control<CreateOrderFormInput>
  setValue: UseFormSetValue<CreateOrderFormInput>
  clients: Client[]
  pickupLocations: OrderLocationOption[]
  deliveryLocations: OrderLocationOption[]
}

const OrderFormSections = ({
  control,
  setValue,
  clients,
  pickupLocations,
  deliveryLocations
}: OrderFormSectionsProps) => {
  return (
    <Card className='gap-0 divide-y py-0'>
      <FormSection
        icon={FileTextIcon}
        title='Order details'
        description='How the request came in, plus any internal context.'
      >
        <ManualEntrySection control={control} />
      </FormSection>
      <FormSection
        icon={UserIcon}
        title='Client information'
        description='Who the order is for. Picking an account fills the contact and billing fields.'
      >
        <ClientBillingSection control={control} setValue={setValue} clients={clients} />
      </FormSection>
      <FormSection
        icon={RouteIcon}
        title='Route & schedule'
        description='Where the goods are collected, where they go, by when, and how fast.'
      >
        <PickupDeliverySection
          control={control}
          pickupLocations={pickupLocations}
          deliveryLocations={deliveryLocations}
        />
      </FormSection>
      <div id='packages'>
        <FormSection
          icon={PackageIcon}
          title='Packages'
          description='What is being moved. Total weight drives the price estimate and the vehicle capacity check.'
        >
          <PackagesSection control={control} />
        </FormSection>
      </div>
    </Card>
  )
}

export default OrderFormSections
