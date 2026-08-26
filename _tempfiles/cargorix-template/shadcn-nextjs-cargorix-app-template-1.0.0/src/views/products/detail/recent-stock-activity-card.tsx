// Third-party Imports
import { format } from 'date-fns'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ArrowUpRightIcon, HistoryIcon, RotateCcwIcon } from 'lucide-react'

// Type Imports
import type { StockMovementRow } from '@/types/entities/stock-movement'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type RecentStockActivityCardProps = {
  rows: StockMovementRow[]
}

const getMovementLabel = (row: StockMovementRow) => {
  switch (row.type) {
    case 'receipt':
      return { label: 'Purchase', Icon: ArrowUpIcon }
    case 'sale':
      return { label: 'Sale', Icon: ArrowDownIcon }
    case 'adjustment':
      return { label: 'Adjustment', Icon: ArrowUpDownIcon }
    case 'transfer':
      return { label: row.quantity > 0 ? 'Transfer In' : 'Transfer Out', Icon: ArrowUpRightIcon }
    case 'return':
      return { label: 'Return', Icon: RotateCcwIcon }
  }
}

const RecentStockActivityCard = ({ rows }: RecentStockActivityCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <HistoryIcon className='text-muted-foreground size-4' />
          Recent stock activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No recent activity</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Movement type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => {
                const { label, Icon } = getMovementLabel(row)

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>{format(new Date(row.date), 'MMM dd, yyyy')}</div>
                      <div className='text-muted-foreground text-xs'>{format(new Date(row.date), 'hh:mm a')}</div>
                    </TableCell>
                    <TableCell>
                      <span className='flex items-center gap-2'>
                        <Icon className='text-muted-foreground size-4' />
                        {label}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`font-medium tabular-nums ${row.quantity > 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      {row.quantity > 0 ? '+' : ''}
                      {row.quantity}
                    </TableCell>
                    <TableCell>
                      <span className='text-muted-foreground text-sm'>{row.reference}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentStockActivityCard
