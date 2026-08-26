'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  BanIcon,
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PackageCheckIcon,
  PencilIcon,
  TruckIcon
} from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import { CANCELLABLE_STATUSES, RECEIVABLE_STATUSES, TERMINAL_STATUSES } from '@/types/entities/purchase-order'

// Component Imports
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

type PoRowActionsProps = {
  po: PurchaseOrder
}

const PoRowActions = ({ po }: PoRowActionsProps) => {
  // States
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()

  // Vars
  const isDraft = po.status === 'draft'
  const isEditable = !TERMINAL_STATUSES.includes(po.status)
  const isReceivable = RECEIVABLE_STATUSES.includes(po.status)
  const isCancellable = CANCELLABLE_STATUSES.includes(po.status) && po.lines.every(line => line.receivedQty === 0)
  const canMarkInTransit = po.status === 'confirmed'

  const handleConfirm = () => {
    const confirmed = usePurchaseOrdersStore.getState().confirmDraft(po.id)

    if (!confirmed) router.push(`/purchase-orders/create/${po.id}`)
  }

  const handleDuplicate = () => {
    const newId = usePurchaseOrdersStore.getState().duplicatePurchaseOrder(po.id)

    if (newId) router.push(`/purchase-orders/create/${newId}`)
  }

  const handleMarkInTransit = () => {
    usePurchaseOrdersStore.getState().markInTransit(po.id)
  }

  const handleCancel = () => {
    usePurchaseOrdersStore.getState().cancelPurchaseOrder(po.id)
    setIsCancelConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' size='icon' className='size-8' aria-label='Row actions' />}
        >
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          <DropdownMenuItem onClick={() => router.push(`/purchase-orders/${po.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View
          </DropdownMenuItem>
          {isEditable && (
            <DropdownMenuItem onClick={() => router.push(`/purchase-orders/create/${po.id}`)}>
              <PencilIcon data-icon='inline-start' />
              Edit
            </DropdownMenuItem>
          )}
          {isDraft && (
            <DropdownMenuItem onClick={handleConfirm}>
              <CheckCircle2Icon data-icon='inline-start' />
              Confirm
            </DropdownMenuItem>
          )}
          {isReceivable && (
            <DropdownMenuItem onClick={() => router.push(`/purchase-orders/${po.id}`)}>
              <PackageCheckIcon data-icon='inline-start' />
              Receive items
            </DropdownMenuItem>
          )}
          {canMarkInTransit && (
            <DropdownMenuItem onClick={handleMarkInTransit}>
              <TruckIcon data-icon='inline-start' />
              Mark in transit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon data-icon='inline-start' />
            Duplicate
          </DropdownMenuItem>
          {isCancellable && (
            <DropdownMenuItem variant='destructive' onClick={() => setIsCancelConfirmOpen(true)}>
              <BanIcon data-icon='inline-start' />
              Cancel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => toast('Downloading purchase order')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {po.number || 'this purchase order'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling stops this purchase order from being confirmed or received further. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep PO</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel purchase order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PoRowActions
