'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { CircleCheckBigIcon, DownloadIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { checkAdjustmentIntake, useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'

// Util Imports
import { warnIfOverCapacity } from '@/lib/capacity-toast'
import { ADJUSTMENT_STATUS_BADGE } from '../adjustment-badges'

type AdjustmentDetailHeaderProps = {
  a: StockAdjustment
}

const AdjustmentDetailHeader = ({ a }: AdjustmentDetailHeaderProps) => {
  // Hooks
  const router = useRouter()

  // Vars
  const createdAt = new Date(a.createdAt)
  const statusBadge = ADJUSTMENT_STATUS_BADGE[a.status]
  const isDraft = a.status === 'draft'

  const handlePost = () => {
    if (!warnIfOverCapacity(checkAdjustmentIntake(a))) return

    const posted = useStockAdjustmentsStore.getState().postExistingDraft(a.id)

    if (!posted) router.push(`/stock-adjustments/create/${a.id}`)
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Stock Adjustment' parentHref='/stock-adjustments' current={a.number || 'Draft'} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>Adjustment {a.number || 'Draft'}</h1>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
          <p className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm'>
            <span>Created on {format(createdAt, 'd MMM yyyy')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>{format(createdAt, 'HH:mm')}</span>
            <span className='bg-muted-foreground/40 size-1 rounded-full' />
            <span>By {a.createdBy}</span>
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {isDraft && (
            <Button
              variant='secondary'
              className='gap-2'
              render={<Link href={`/stock-adjustments/create/${a.id}`} />}
              nativeButton={false}
            >
              <PencilIcon data-icon='inline-start' />
              Edit adjustment
            </Button>
          )}

          <Button variant='secondary' className='gap-2' onClick={() => toast('Downloading adjustment')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </Button>
          {isDraft && (
            <Button className='gap-2' onClick={handlePost}>
              <CircleCheckBigIcon data-icon='inline-start' />
              Post adjustment
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdjustmentDetailHeader
