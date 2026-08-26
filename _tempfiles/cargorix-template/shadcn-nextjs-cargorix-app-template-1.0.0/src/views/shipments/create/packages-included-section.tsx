'use client'

// Third-party Imports
import { PinIcon, PinOffIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Store Imports
import { useShipmentsStore } from '@/store/use-shipments-store'

const PACKAGE_TYPE_LABEL = { carton: 'Carton', pallet: 'Pallet', container: 'Container' } as const

type PackagesIncludedSectionProps = {
  shipmentId: string
  order: Order
  priorityPackageIds: string[]
}

const PackagesIncludedSection = ({ shipmentId, order, priorityPackageIds }: PackagesIncludedSectionProps) => {
  // Hooks
  const togglePriorityPackage = useShipmentsStore(state => state.togglePriorityPackage)

  // Vars
  const sortedPackages = [...order.packages].sort((a, b) => {
    const aPinned = priorityPackageIds.includes(a.id)
    const bPinned = priorityPackageIds.includes(b.id)

    if (aPinned === bPinned) return 0

    return aPinned ? -1 : 1
  })

  return (
    <Card className='py-0 lg:max-xl:col-span-2'>
      <CardHeader className='flex flex-wrap items-center justify-between border-b p-4'>
        <div>
          <CardTitle>Packages</CardTitle>
          <p className='text-muted-foreground text-sm'>
            Every package on the source order is included in this shipment
          </p>
        </div>
        <Badge variant='outline'>
          {priorityPackageIds.length} priority package{priorityPackageIds.length === 1 ? '' : 's'}
        </Badge>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12' />
              <TableHead>Package</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Dimensions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPackages.map(pkg => {
              const isPinned = priorityPackageIds.includes(pkg.id)

              return (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-8'
                      aria-label={isPinned ? 'Unpin package' : 'Pin package as priority'}
                      onClick={() => togglePriorityPackage(shipmentId, pkg.id)}
                    >
                      {isPinned ? (
                        <PinIcon className='fill-primary text-primary size-4' />
                      ) : (
                        <PinOffIcon className='text-muted-foreground size-4' />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className='font-semibold'>{pkg.itemName}</TableCell>
                  <TableCell>{PACKAGE_TYPE_LABEL[pkg.packageType]}</TableCell>
                  <TableCell>{pkg.weightKg} kg</TableCell>
                  <TableCell>{pkg.dimensions}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default PackagesIncludedSection
