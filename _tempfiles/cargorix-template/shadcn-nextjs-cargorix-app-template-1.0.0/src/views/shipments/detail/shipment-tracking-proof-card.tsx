// Third-party Imports
import { LinkIcon, ScanBarcodeIcon, SignatureIcon } from 'lucide-react'

// Type Imports
import type { Shipment } from '@/types/entities/shipment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ShipmentTrackingProofCardProps = {
  shipment: Shipment
}

const ShipmentTrackingProofCard = ({ shipment }: ShipmentTrackingProofCardProps) => {
  return (
    <Card className='h-full'>
      <CardHeader className='gap-2'>
        <CardTitle>Tracking &amp; proof</CardTitle>
        <Badge className='bg-success-soft text-success w-fit'>Enabled</Badge>
      </CardHeader>
      <CardContent className='space-y-3 text-sm'>
        {shipment.generateLabels && (
          <p className='flex items-center gap-2.5'>
            <ScanBarcodeIcon className='text-primary size-4' />
            Package labels generated
          </p>
        )}
        {shipment.sendTrackingLink && (
          <p className='flex items-center gap-2.5'>
            <LinkIcon className='text-primary size-4' />
            Customer tracking link active
          </p>
        )}
        {shipment.requireProofOfDelivery && (
          <p className='flex items-center gap-2.5'>
            <SignatureIcon className='text-primary size-4' />
            Signature and photo required
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default ShipmentTrackingProofCard
