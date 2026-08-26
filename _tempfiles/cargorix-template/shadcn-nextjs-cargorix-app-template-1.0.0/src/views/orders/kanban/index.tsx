'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import { toast } from 'sonner'

// Type Imports
import type { KanbanMoveEvent } from '@/components/ui/kanban'
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { OrderKanbanColumnId } from '@/lib/selectors/orders-selectors'

// Component Imports
import { Kanban, KanbanBoard, KanbanOverlay } from '@/components/ui/kanban'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import KanbanToolbar from './kanban-toolbar'
import OrderKanbanCard from './order-kanban-card'
import OrderKanbanColumn from './order-kanban-column'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Util Imports
import {
  DRAGGABLE_KANBAN_COLUMNS,
  ORDER_KANBAN_COLUMNS,
  ORDER_KANBAN_COLUMN_LABEL,
  getOrderKanbanColumn,
  groupOrdersByKanbanColumn
} from '@/lib/selectors/orders-selectors'

type OrdersKanbanProps = {
  clients: Client[]
}

const OrdersKanban = ({ clients }: OrdersKanbanProps) => {
  // States
  const [search, setSearch] = useState('')
  const [column, setColumn] = useState<OrderKanbanColumnId | 'all'>('all')

  // Vars
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)
  const receiveOrder = useOrdersStore(state => state.receiveOrder)
  const approveOrder = useOrdersStore(state => state.approveOrder)
  const revertOrderTo = useOrdersStore(state => state.revertOrderTo)

  const visibleColumns = column === 'all' ? ORDER_KANBAN_COLUMNS : [column]

  const matchesSearch = (order: Order) => {
    const term = search.trim().toLowerCase()

    if (!term) return true

    const client = clients.find(c => c.id === order.clientId)

    return (
      order.displayId.toLowerCase().includes(term) ||
      (client?.name.toLowerCase().includes(term) ?? false) ||
      order.pickupAddress.toLowerCase().includes(term) ||
      order.deliveryAddress.toLowerCase().includes(term)
    )
  }

  const columns = useMemo(
    () => groupOrdersByKanbanColumn(orders.filter(matchesSearch), shipments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, shipments, clients, search]
  )

  const handleMove = ({ event, overContainer }: KanbanMoveEvent) => {
    const target = overContainer as OrderKanbanColumnId
    const order = orders.find(o => o.id === event.active.id)

    if (!order) return

    if (!DRAGGABLE_KANBAN_COLUMNS.includes(target)) {
      toast.error(`${ORDER_KANBAN_COLUMN_LABEL[target]} is driven by the shipment, not the order.`)

      return
    }

    const shipment = shipments.find(s => s.orderId === order.id)
    const current = getOrderKanbanColumn(order, shipment)

    if (current === target) return

    if (target === 'order_received' && current === 'pending_review') {
      receiveOrder(order.id)
      toast.success(`${order.displayId} marked as received`)

      return
    }

    if (target === 'ready_for_shipment' && current === 'order_received') {
      approveOrder(order.id)
      toast.success(`${order.displayId} confirmed`)

      return
    }

    if (target === 'pending_review' || target === 'order_received') {
      revertOrderTo(order.id, target)
      toast.success(`${order.displayId} moved back to ${ORDER_KANBAN_COLUMN_LABEL[target].toLowerCase()}`)

      return
    }

    toast.error(`${order.displayId} cannot skip straight to ${ORDER_KANBAN_COLUMN_LABEL[target].toLowerCase()}.`)
  }

  return (
    <div className='min-w-0 space-y-4'>
      <KanbanToolbar search={search} onSearchChange={setSearch} column={column} onColumnChange={setColumn} />

      <Kanban value={columns} onValueChange={() => {}} getItemValue={order => order.id} onMove={handleMove}>
        <ScrollArea className='w-full'>
          <KanbanBoard className='items-start gap-4 p-0 pb-3'>
            {visibleColumns.map(columnId => (
              <OrderKanbanColumn key={columnId} column={columnId} orders={columns[columnId]} clients={clients} />
            ))}
          </KanbanBoard>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>

        <KanbanOverlay dropAnimation={null}>
          {({ value }) => {
            const order = orders.find(o => o.id === value)

            if (!order) return null

            return <OrderKanbanCard order={order} client={clients.find(c => c.id === order.clientId)} isOverlay />
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  )
}

export default OrdersKanban
