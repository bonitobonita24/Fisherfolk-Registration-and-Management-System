// Third-party Imports
import { CalendarDaysIcon, CircleDollarSignIcon, CreditCardIcon, ShipIcon, TimerIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

// Data Imports
import { INCOTERMS_LABEL } from '../supplier-badges'

type ProcurementTermsCardProps = {
  supplier: Supplier
}

const ProcurementTermsCard = ({ supplier }: ProcurementTermsCardProps) => {
  // Vars
  const minimumOrder =
    typeof supplier.minimumOrderValue === 'number'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: supplier.currency || 'USD',
          maximumFractionDigits: 0
        }).format(supplier.minimumOrderValue)
      : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurement &amp; Terms</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InfoRow icon={<CalendarDaysIcon />} label='Payment terms' value={supplier.paymentTerms} />
        <InfoRow icon={<CircleDollarSignIcon />} label='Currency' value={supplier.currency} />
        <InfoRow
          icon={<TimerIcon />}
          label='Lead time'
          value={typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} days` : undefined}
        />
        <InfoRow icon={<CreditCardIcon />} label='Minimum order' value={minimumOrder} />
        <InfoRow
          icon={<ShipIcon />}
          label='Incoterms'
          value={supplier.incoterms && INCOTERMS_LABEL[supplier.incoterms]}
        />
      </CardContent>
    </Card>
  )
}

export default ProcurementTermsCard
