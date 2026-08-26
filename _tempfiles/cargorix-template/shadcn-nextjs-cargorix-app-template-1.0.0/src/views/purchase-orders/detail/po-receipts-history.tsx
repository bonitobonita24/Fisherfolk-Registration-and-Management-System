// Third-party Imports
import { format } from 'date-fns'
import { PackageSearchIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type PoReceiptsHistoryProps = {
  po: PurchaseOrder
}

const PoReceiptsHistory = ({ po }: PoReceiptsHistoryProps) => {
  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Receipts history</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        {po.receipts.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-center text-sm'>
            <PackageSearchIcon className='size-8 stroke-1' />
            <p>No receipts logged yet.</p>
          </div>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Received by</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className='text-right'>Total quantity</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.receipts.map(receipt => {
                  const totalQuantity = receipt.lines.reduce((sum, line) => sum + line.quantity, 0)

                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className='font-medium'>{receipt.id}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {format(new Date(receipt.date), 'd MMM yyyy, HH:mm')}
                      </TableCell>
                      <TableCell>{receipt.receivedBy}</TableCell>
                      <TableCell className='text-muted-foreground'>
                        {receipt.lines.length} of {po.lines.length} items
                      </TableCell>
                      <TableCell className='text-right font-medium tabular-nums'>{totalQuantity}</TableCell>
                      <TableCell className='text-muted-foreground truncate'>{receipt.note || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PoReceiptsHistory
