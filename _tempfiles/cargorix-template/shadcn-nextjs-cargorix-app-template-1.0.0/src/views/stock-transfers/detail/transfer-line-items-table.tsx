// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type TransferLineItemsTableProps = {
  t: StockTransfer
}

const TransferLineItemsTable = ({ t }: TransferLineItemsTableProps) => {
  // Vars
  const totals = t.lines.reduce(
    (acc, line) => {
      const remaining = Math.max(0, line.quantitySent - line.quantityReceived)

      return {
        sent: acc.sent + line.quantitySent,
        received: acc.received + line.quantityReceived,
        remaining: acc.remaining + remaining
      }
    },
    { sent: 0, received: 0, remaining: 0 }
  )

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='px-5 pt-5'>
        <CardTitle>Line items</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='overflow-x-auto rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className='text-right'>Quantity sent</TableHead>
                <TableHead className='text-right'>Quantity received</TableHead>
                <TableHead className='text-right'>Remaining</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.lines.map((line, index) => {
                const remaining = Math.max(0, line.quantitySent - line.quantityReceived)

                return (
                  <TableRow key={line.id}>
                    <TableCell className='text-muted-foreground tabular-nums'>{index + 1}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <img
                          src={line.primaryImage}
                          alt={line.name}
                          loading='lazy'
                          className='bg-muted size-10 shrink-0 rounded-md object-cover'
                        />
                        <span className='font-medium'>{line.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>{line.sku}</TableCell>
                    <TableCell className='text-right tabular-nums'>{line.quantitySent}</TableCell>
                    <TableCell className='text-right tabular-nums'>{line.quantityReceived}</TableCell>
                    <TableCell className='text-right tabular-nums'>{remaining}</TableCell>
                    <TableCell className='text-muted-foreground'>{line.unit}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className='font-semibold'>
                  Totals
                </TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.sent}</TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.received}</TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.remaining}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default TransferLineItemsTable
