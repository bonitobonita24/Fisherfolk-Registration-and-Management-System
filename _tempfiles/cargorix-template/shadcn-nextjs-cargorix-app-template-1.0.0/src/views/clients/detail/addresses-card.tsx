// Third-party Imports
import { MapPinIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type AddressesCardProps = {
  client: Client
}

type AddressBlockProps = {
  label: string
  address?: string
}

const AddressBlock = ({ label, address }: AddressBlockProps) => (
  <div className='flex items-start gap-3'>
    <span className='bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
      <MapPinIcon className='size-4' />
    </span>
    <div className='min-w-0'>
      <p className='text-sm font-medium'>{label}</p>
      {address ? (
        <p className='text-muted-foreground mt-1 text-sm whitespace-pre-line'>{address}</p>
      ) : (
        <p className='text-muted-foreground mt-1 text-sm'>—</p>
      )}
    </div>
  </div>
)

const AddressesCard = ({ client }: AddressesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Addresses</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <AddressBlock label='Billing address' address={client.billingAddress} />
        <Separator />
        <AddressBlock label='Shipping address' address={client.shippingAddress} />
      </CardContent>
    </Card>
  )
}

export default AddressesCard
