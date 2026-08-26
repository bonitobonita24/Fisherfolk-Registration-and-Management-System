// Third-party Imports
import { MailIcon, PhoneIcon, UserRoundIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

type PrimaryContactCardProps = {
  client: Client
}

const PrimaryContactCard = ({ client }: PrimaryContactCardProps) => {
  // Vars
  const contact = client.contactName ? (
    <span title={client.contactName}>
      {client.contactName}
      {client.contactJobTitle && (
        <span className='text-muted-foreground block truncate text-xs font-normal' title={client.contactJobTitle}>
          {client.contactJobTitle}
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
        <InfoRow icon={<MailIcon />} label='Email' value={client.email} />
        <InfoRow icon={<PhoneIcon />} label='Phone' value={client.phone} />
      </CardContent>
    </Card>
  )
}

export default PrimaryContactCard
