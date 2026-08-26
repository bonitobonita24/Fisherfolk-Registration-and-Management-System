'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { CheckCircle2Icon, DownloadIcon, PackageCheckIcon, PencilIcon, TruckIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import { RECEIVABLE_STATUSES, TERMINAL_STATUSES } from '@/types/entities/purchase-order'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

// Util Imports
import { computeReceivingProgress } from '@/lib/selectors/purchase-orders-selectors'
import { PO_STATUS_BADGE } from '../po-badges'

type PoDetailHeaderProps = {
  po: PurchaseOrder
  onReceive: () => void
}

const PoDetailHeader = ({ po, onReceive }: PoDetailHeaderProps) => {
  // Hooks
  const router = useRouter()

  // Vars
  const createdAt = new Date(po.createdAt)
  const statusBadge = PO_STATUS_BADGE[po.status]
  const isDraft = po.status === 'draft'
  const isTerminal = TERMINAL_STATUSES.includes(po.status)
  const canReceive = RECEIVABLE_STATUSES.includes(po.status) && computeReceivingProgress(po).totalRemaining > 0

  const handleMarkInTransit = () => usePurchaseOrdersStore.getState().markInTransit(po.id)

  const handleConfirm = () => {
    const confirmed = usePurchaseOrdersStore.getState().confirmDraft(po.id)

    if (!confirmed) router.push(`/purchase-orders/create/${po.id}`)
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Purchase Orders' parentHref='/purchase-orders' current={po.number || 'Draft'} />

      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
        <div>
          <div className='flex gap-3 max-sm:flex-col sm:items-center'>
            <h1 className='text-3xl font-bold tracking-tight'>Purchase Order {po.number || 'Draft'}</h1>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm'>
            <span>Created on {format(createdAt, 'd MMM yyyy')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>{format(createdAt, 'HH:mm')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>By {po.createdBy}</span>
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {!isTerminal && (
            <Button
              variant='secondary'
              className='gap-2'
              render={<Link href={`/purchase-orders/create/${po.id}`} />}
              nativeButton={false}
            >
              <PencilIcon data-icon='inline-start' />
              Edit PO
            </Button>
          )}

          <Button variant='secondary' className='gap-2' onClick={() => toast('Downloading purchase order')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </Button>
          {po.status === 'confirmed' && (
            <Button variant='secondary' className='gap-2' onClick={handleMarkInTransit}>
              <TruckIcon data-icon='inline-start' />
              Mark in transit
            </Button>
          )}
          {isDraft ? (
            <Button className='gap-2' onClick={handleConfirm}>
              <CheckCircle2Icon data-icon='inline-start' />
              Confirm PO
            </Button>
          ) : (
            <Button className='gap-2' disabled={!canReceive} onClick={onReceive}>
              <PackageCheckIcon data-icon='inline-start' />
              Receive items
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PoDetailHeader
