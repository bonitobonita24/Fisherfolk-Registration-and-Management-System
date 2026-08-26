// Third-party Imports
import { CalendarDaysIcon, CircleDollarSignIcon, CreditCardIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

// Data Imports
import { PAYMENT_TERMS_LABEL } from '../client-badges'

type BillingTermsCardProps = {
  client: Client
}

const BillingTermsCard = ({ client }: BillingTermsCardProps) => {
  // Vars
  const creditLimit =
    typeof client.creditLimit === 'number'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: client.currency || 'USD',
          maximumFractionDigits: 0
        }).format(client.creditLimit)
      : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing &amp; Terms</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InfoRow
          icon={<CalendarDaysIcon />}
          label='Payment terms'
          value={client.paymentTerms && PAYMENT_TERMS_LABEL[client.paymentTerms]}
        />
        <InfoRow icon={<CircleDollarSignIcon />} label='Currency' value={client.currency} />
        <InfoRow icon={<CreditCardIcon />} label='Credit limit' value={creditLimit} />
      </CardContent>
    </Card>
  )
}

export default BillingTermsCard
