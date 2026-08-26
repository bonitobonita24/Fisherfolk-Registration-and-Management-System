// Next Imports
import Link from 'next/link'

// Third-party Imports
import { WarehouseIcon } from 'lucide-react'

// Type Imports
import type { ProductWarehouseInventory } from '@/lib/selectors/products-selectors'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type InventoryByWarehouseCardProps = {
  rows: ProductWarehouseInventory[]
}

const InventoryByWarehouseCard = ({ rows }: InventoryByWarehouseCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <WarehouseIcon className='text-muted-foreground size-4' />
          Inventory by warehouse
        </CardTitle>
        <CardAction>
          <Button variant='outline' className='w-fit' render={<Link href='/warehouses' />} nativeButton={false}>
            View all warehouses
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>On hand</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reorder point</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.warehouseId}>
                <TableCell className='font-medium'>{row.warehouseName}</TableCell>
                <TableCell className='tabular-nums'>{row.onHand}</TableCell>
                <TableCell className='tabular-nums'>{row.reserved}</TableCell>
                <TableCell className='font-semibold tabular-nums'>{row.available}</TableCell>
                <TableCell className='tabular-nums'>{row.reorderPoint}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default InventoryByWarehouseCard
