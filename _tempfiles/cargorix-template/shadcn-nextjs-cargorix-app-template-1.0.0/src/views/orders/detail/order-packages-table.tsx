'use client'

// Third-party Imports
import { BoxesIcon, InfoIcon, PencilIcon, ScalingIcon, WeightIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Util Imports
import { isOrderEditable } from '@/lib/selectors/orders-selectors'

const HANDLING_LABEL: Record<Order['handlingRequirement'], string> = {
  standard: 'Standard',
  fragile: 'Fragile',
  temperature_controlled: 'Temp. controlled',
  hazardous: 'Hazardous'
}

const PACKAGE_TYPE_LABEL = { carton: 'Carton', pallet: 'Pallet', container: 'Container' } as const

type OrderPackagesTableProps = {
  order: Order
  onEdit: () => void
}

const OrderPackagesTable = ({ order, onEdit }: OrderPackagesTableProps) => {
  const totalQty = order.packages.reduce((sum, p) => sum + p.quantity, 0)
  const totalWeight = order.packages.reduce((sum, p) => sum + p.weightKg, 0)
  const totalVolume = order.packages.reduce((sum, p) => sum + p.volumeM3, 0)

  const totals = [
    { icon: BoxesIcon, label: 'Total quantity', value: `${totalQty}` },
    { icon: WeightIcon, label: 'Total weight', value: `${totalWeight} kg` },
    { icon: ScalingIcon, label: 'Total volume', value: `${Number(totalVolume.toFixed(2))} m³` }
  ]

  return (
    <Card className='py-0'>
      <CardHeader className='flex justify-between gap-4 border-b p-4 max-sm:flex-col'>
        <div>
          <CardTitle>Goods &amp; packages</CardTitle>
          <p className='text-muted-foreground text-sm'>Commercial package information from the client request</p>
        </div>
        <CardAction className='flex items-center gap-2'>
          <Badge variant='outline'>
            {totalQty} package{totalQty === 1 ? '' : 's'}
          </Badge>
          {isOrderEditable(order) && (
            <Button variant='outline' size='sm' className='gap-2' onClick={onEdit}>
              <PencilIcon data-icon='inline-start' />
              Edit
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Package type</TableHead>
              <TableHead>Qty.</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Handling</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.packages.map(pkg => (
              <TableRow key={pkg.id}>
                <TableCell className='font-semibold'>{pkg.itemName}</TableCell>
                <TableCell>{PACKAGE_TYPE_LABEL[pkg.packageType]}</TableCell>
                <TableCell>{pkg.quantity}</TableCell>
                <TableCell>{pkg.weightKg} kg</TableCell>
                <TableCell>{pkg.volumeM3} m³</TableCell>
                <TableCell>
                  <Badge variant='outline'>{HANDLING_LABEL[order.handlingRequirement]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardContent className='bg-muted/50 grid gap-4 border-t p-4 sm:grid-cols-3'>
        {totals.map(total => (
          <div key={total.label} className='flex items-center gap-3'>
            <span className='bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-lg'>
              <total.icon className='size-4' />
            </span>
            <div>
              <p className='text-muted-foreground text-xs'>{total.label}</p>
              <p className='text-sm font-semibold'>{total.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
      {order.customerInstructions && (
        <CardContent className='border-t p-4'>
          <div className='border-warning bg-warning-soft text-warning flex items-start gap-2 rounded-xl border p-3 text-sm'>
            <InfoIcon className='mt-0.5 size-4 shrink-0' />
            <p>
              <span className='font-semibold'>Customer instructions.</span> {order.customerInstructions}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default OrderPackagesTable
