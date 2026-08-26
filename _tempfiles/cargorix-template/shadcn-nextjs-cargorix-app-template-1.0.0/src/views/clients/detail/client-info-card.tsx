// Third-party Imports
import { Building2Icon, IdCardIcon, UserRoundCogIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

type ClientInfoCardProps = {
  client: Client
}

const ClientInfoCard = ({ client }: ClientInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InfoRow icon={<IdCardIcon />} label='Client code' value={client.clientCode} />
        <InfoRow icon={<Building2Icon />} label='Industry' value={client.industry} />
        <InfoRow icon={<UserRoundCogIcon />} label='Account manager' value={client.accountManager} />
      </CardContent>
    </Card>
  )
}

export default ClientInfoCard
