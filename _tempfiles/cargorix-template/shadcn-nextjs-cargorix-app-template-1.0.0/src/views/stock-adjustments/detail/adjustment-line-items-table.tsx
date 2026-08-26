// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AdjustmentLineItemsTableProps = {
  a: StockAdjustment
}

const formatSigned = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

const signedClassName = (n: number) => (n > 0 ? 'text-success' : n < 0 ? 'text-destructive' : '')

const AdjustmentLineItemsTable = ({ a }: AdjustmentLineItemsTableProps) => {
  // Vars
  const totals = a.lines.reduce(
    (acc, line) => ({
      current: acc.current + line.currentQty,
      adjustment: acc.adjustment + line.adjustmentQty,
      newQty: acc.newQty + line.currentQty + line.adjustmentQty
    }),
    { current: 0, adjustment: 0, newQty: 0 }
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
                <TableHead className='text-right'>Current qty</TableHead>
                <TableHead className='text-right'>Adjustment</TableHead>
                <TableHead className='text-right'>New qty</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.lines.map((line, index) => {
                const newQty = line.currentQty + line.adjustmentQty

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
                    <TableCell className='text-right tabular-nums'>{line.currentQty}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${signedClassName(line.adjustmentQty)}`}>
                      {formatSigned(line.adjustmentQty)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{newQty}</TableCell>
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
                <TableCell className='text-right font-semibold tabular-nums'>{totals.current}</TableCell>
                <TableCell className={`text-right font-semibold tabular-nums ${signedClassName(totals.adjustment)}`}>
                  {formatSigned(totals.adjustment)}
                </TableCell>
                <TableCell className='text-right font-semibold tabular-nums'>{totals.newQty}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default AdjustmentLineItemsTable
