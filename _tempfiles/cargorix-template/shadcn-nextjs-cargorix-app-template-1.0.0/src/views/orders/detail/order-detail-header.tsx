'use client'

// Third-party Imports
import { format } from 'date-fns'
import { BanIcon, ChevronDownIcon, CopyIcon, PauseIcon, PencilIcon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { Order } from '@/types/entities/order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Util Imports
import { isOrderEditable } from '@/lib/selectors/orders-selectors'

// Data Imports
import { ORDER_SOURCE_BADGE, ORDER_STATUS_BADGE } from '../order-badges'

type OrderDetailHeaderProps = {
  order: Order
  primaryAction?: React.ReactNode
  onEdit: () => void
  onDuplicate: () => void
  onCancel: () => void
  onHold: () => void
}

const OrderDetailHeader = ({ order, primaryAction, onEdit, onDuplicate, onCancel, onHold }: OrderDetailHeaderProps) => {
  // Vars
  const createdAt = new Date(order.createdAt)
  const isClosed = order.status === 'completed' || order.status === 'cancelled'

  const canHold =
    order.status === 'pending_review' || order.status === 'order_received' || order.status === 'ready_for_shipment'

  const canEdit = isOrderEditable(order)
  const editBlockedReason = order.status === 'in_fulfilment' ? 'A shipment has been created' : 'This order is closed'

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Orders' parentHref='/orders' current={`${order.displayId}`} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>Order {order.displayId}</h1>
            <Badge className={ORDER_STATUS_BADGE[order.status].className}>
              {ORDER_STATUS_BADGE[order.status].label}
            </Badge>
            <Badge className={ORDER_SOURCE_BADGE[order.source].className}>
              {ORDER_SOURCE_BADGE[order.source].label}
            </Badge>
          </div>
          <p className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm'>
            <span>Created on {format(createdAt, 'd MMM yyyy')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>{format(createdAt, 'HH:mm')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>By {order.createdBy}</span>
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {primaryAction}
          <Button variant='secondary' className='gap-2' onClick={() => toast('Exporting order')}>
            <UploadIcon data-icon='inline-start' />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button className='gap-2' />}>
              Actions
              <ChevronDownIcon data-icon='inline-end' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem disabled={!canEdit} onClick={canEdit ? onEdit : undefined}>
                <PencilIcon data-icon='inline-start' />
                <span className='flex flex-col items-start'>
                  Edit order
                  {!canEdit && <span className='text-muted-foreground text-xs'>{editBlockedReason}</span>}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <CopyIcon data-icon='inline-start' />
                Duplicate order
              </DropdownMenuItem>
              {canHold && (
                <DropdownMenuItem onClick={onHold}>
                  <PauseIcon data-icon='inline-start' />
                  Put on hold
                </DropdownMenuItem>
              )}
              {!isClosed && (
                <DropdownMenuItem variant='destructive' onClick={onCancel}>
                  <BanIcon data-icon='inline-start' />
                  Cancel order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailHeader
