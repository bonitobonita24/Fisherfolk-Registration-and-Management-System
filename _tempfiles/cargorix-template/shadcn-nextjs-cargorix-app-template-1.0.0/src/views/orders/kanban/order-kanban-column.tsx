'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { PlusIcon } from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { OrderKanbanColumnId } from '@/lib/selectors/orders-selectors'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KanbanColumn, KanbanColumnContent, KanbanItem } from '@/components/ui/kanban'
import { ScrollArea } from '@/components/ui/scroll-area'
import OrderKanbanCard from './order-kanban-card'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'

// Util Imports
import { DRAGGABLE_KANBAN_COLUMNS, ORDER_KANBAN_COLUMN_LABEL } from '@/lib/selectors/orders-selectors'

const COLUMN_DOT: Record<OrderKanbanColumnId, string> = {
  pending_review: 'bg-warning',
  order_received: 'bg-info',
  ready_for_shipment: 'bg-primary',
  create_shipment: 'bg-info',
  in_transit: 'bg-info',
  delivered: 'bg-success'
}

type OrderKanbanColumnProps = {
  column: OrderKanbanColumnId
  orders: Order[]
  clients: Client[]
}

const OrderKanbanColumn = ({ column, orders, clients }: OrderKanbanColumnProps) => {
  // Hooks
  const router = useRouter()
  const createDraftOrder = useOrdersStore(state => state.createDraftOrder)

  // Vars
  const label = ORDER_KANBAN_COLUMN_LABEL[column]
  const isDraggable = DRAGGABLE_KANBAN_COLUMNS.includes(column)

  const handleAddOrder = () => {
    const id = crypto.randomUUID()

    createDraftOrder(id)
    router.push(`/orders/create/${id}`)
  }

  return (
    <KanbanColumn value={column} className='w-72 shrink-0 p-1'>
      <Card className='bg-sidebar h-[calc(100vh-28rem)] min-h-96 gap-0 py-0'>
        <CardHeader className='shrink-0 gap-1 px-3.5 pt-3.5'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className={`size-2 shrink-0 rounded-full ${COLUMN_DOT[column]}`} />
              <CardTitle className='truncate text-sm'>{label}</CardTitle>
              <span className='bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs font-medium'>
                {orders.length}
              </span>
            </div>
            {isDraggable && (
              <Button
                variant='outline'
                size='icon'
                onClick={handleAddOrder}
                aria-label={`Add order to ${label}`}
                className='border-dashed'
              >
                <PlusIcon data-icon='inline-start bg-transparent!' />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className='min-h-0 flex-1 p-0'>
          <ScrollArea className='h-full'>
            <KanbanColumnContent value={column} className='flex flex-col gap-3 p-3.5'>
              {orders.map(order => (
                <KanbanItem
                  key={order.id}
                  value={order.id}
                  disabled={!isDraggable}
                  className={isDraggable ? undefined : 'cursor-default opacity-100'}
                >
                  <OrderKanbanCard order={order} client={clients.find(c => c.id === order.clientId)} />
                </KanbanItem>
              ))}

              {isDraggable && (
                <Button variant='outline' onClick={handleAddOrder} className='border-dashed'>
                  <PlusIcon data-icon='inline-start bg-transparent!' />
                  Add order
                </Button>
              )}
            </KanbanColumnContent>
          </ScrollArea>
        </CardContent>
      </Card>
    </KanbanColumn>
  )
}

export default OrderKanbanColumn
