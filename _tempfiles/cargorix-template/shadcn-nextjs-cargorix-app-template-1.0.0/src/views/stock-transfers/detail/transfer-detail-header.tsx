'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { DownloadIcon, PackageCheckIcon, PencilIcon, TruckIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { checkTransferDestination, useStockTransfersStore } from '@/store/use-stock-transfers-store'

// Util Imports
import { warnIfOverCapacity } from '@/lib/capacity-toast'
import { TRANSFER_STATUS_BADGE } from '../transfer-badges'

type TransferDetailHeaderProps = {
  t: StockTransfer
}

const TransferDetailHeader = ({ t }: TransferDetailHeaderProps) => {
  // Hooks
  const router = useRouter()

  // Vars
  const createdAt = new Date(t.createdAt)
  const statusBadge = TRANSFER_STATUS_BADGE[t.status]
  const isDraft = t.status === 'draft'
  const isInTransit = t.status === 'in_transit'

  const handleDispatch = () => {
    if (!warnIfOverCapacity(checkTransferDestination(t, t.id, true))) return

    const dispatched = useStockTransfersStore.getState().dispatchExistingDraft(t.id)

    if (!dispatched) router.push(`/stock-transfers/create/${t.id}`)
  }

  const handleMarkReceived = () => {
    if (!warnIfOverCapacity(checkTransferDestination(t, t.id, false))) return

    useStockTransfersStore.getState().markReceived(t.id)
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Stock Transfer' parentHref='/stock-transfers' current={t.number || 'Draft'} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>Transfer {t.number || 'Draft'}</h1>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm'>
            <span>Created on {format(createdAt, 'd MMM yyyy')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>{format(createdAt, 'HH:mm')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>By {t.createdBy}</span>
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {isDraft && (
            <Button
              variant='secondary'
              className='gap-2'
              render={<Link href={`/stock-transfers/create/${t.id}`} />}
              nativeButton={false}
            >
              <PencilIcon data-icon='inline-start' />
              Edit transfer
            </Button>
          )}

          <Button variant='secondary' className='gap-2' onClick={() => toast('Downloading transfer')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </Button>
          {isDraft && (
            <Button className='gap-2' onClick={handleDispatch}>
              <TruckIcon data-icon='inline-start' />
              Dispatch
            </Button>
          )}
          {isInTransit && (
            <Button className='gap-2' onClick={handleMarkReceived}>
              <PackageCheckIcon data-icon='inline-start' />
              Mark received
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransferDetailHeader
