// Third-party Imports
import { Building2Icon, IdCardIcon, UserRoundCogIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Shared Imports
import InfoRow from '@/components/shared/info-row'

type SupplierInfoCardProps = {
  supplier: Supplier
}

const SupplierInfoCard = ({ supplier }: SupplierInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Information</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <InfoRow icon={<IdCardIcon />} label='Supplier code' value={supplier.supplierCode} />
        <InfoRow icon={<Building2Icon />} label='Category' value={supplier.category} />
        <InfoRow icon={<UserRoundCogIcon />} label='Account owner' value={supplier.accountOwner} />
      </CardContent>
    </Card>
  )
}

export default SupplierInfoCard
