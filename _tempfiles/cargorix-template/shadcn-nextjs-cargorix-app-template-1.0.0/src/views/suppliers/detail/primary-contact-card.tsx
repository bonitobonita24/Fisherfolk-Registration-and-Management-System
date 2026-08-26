// Third-party Imports
import { MailIcon, PhoneIcon, UserRoundIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

type PrimaryContactCardProps = {
  supplier: Supplier
}

const PrimaryContactCard = ({ supplier }: PrimaryContactCardProps) => {
  // Vars
  const contact = supplier.contactPerson ? (
    <span title={supplier.contactPerson}>
      {supplier.contactPerson}
      {supplier.contactJobTitle && (
        <span className='text-muted-foreground block truncate text-xs font-normal' title={supplier.contactJobTitle}>
          {supplier.contactJobTitle}
        </span>
      )}
    </span>
  ) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Contact</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InfoRow icon={<UserRoundIcon />} label='Contact' value={contact} />
        <InfoRow icon={<MailIcon />} label='Email' value={supplier.email} />
        <InfoRow icon={<PhoneIcon />} label='Phone' value={supplier.phone} />
      </CardContent>
    </Card>
  )
}

export default PrimaryContactCard
