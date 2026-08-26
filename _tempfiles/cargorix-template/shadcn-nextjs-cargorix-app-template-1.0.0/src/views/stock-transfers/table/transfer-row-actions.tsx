'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  BanIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PackageCheckIcon,
  PencilIcon,
  TruckIcon
} from 'lucide-react'

// Type Imports
import { toast } from 'sonner'

import type { StockTransfer } from '@/types/entities/stock-transfer'

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
import { checkTransferDestination, useStockTransfersStore } from '@/store/use-stock-transfers-store'

// Util Imports
import { warnIfOverCapacity } from '@/lib/capacity-toast'

type TransferRowActionsProps = {
  transfer: StockTransfer
}

const TransferRowActions = ({ transfer }: TransferRowActionsProps) => {
  // States
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()

  // Vars
  const isDraft = transfer.status === 'draft'
  const isInTransit = transfer.status === 'in_transit'

  const handleDispatch = () => {
    if (!warnIfOverCapacity(checkTransferDestination(transfer, transfer.id, true))) return

    const dispatched = useStockTransfersStore.getState().dispatchExistingDraft(transfer.id)

    if (!dispatched) router.push(`/stock-transfers/create/${transfer.id}`)
  }

  const handleMarkReceived = () => {
    if (!warnIfOverCapacity(checkTransferDestination(transfer, transfer.id, false))) return

    useStockTransfersStore.getState().markReceived(transfer.id)
  }

  const handleDuplicate = () => {
    const newId = useStockTransfersStore.getState().duplicateTransfer(transfer.id)

    if (newId) router.push(`/stock-transfers/create/${newId}`)
  }

  const handleCancel = () => {
    useStockTransfersStore.getState().cancelTransfer(transfer.id)
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
          <DropdownMenuItem onClick={() => router.push(`/stock-transfers/${transfer.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View
          </DropdownMenuItem>
          {isDraft && (
            <DropdownMenuItem onClick={() => router.push(`/stock-transfers/create/${transfer.id}`)}>
              <PencilIcon data-icon='inline-start' />
              Edit
            </DropdownMenuItem>
          )}
          {isDraft && (
            <DropdownMenuItem onClick={handleDispatch}>
              <TruckIcon data-icon='inline-start' />
              Dispatch
            </DropdownMenuItem>
          )}
          {isInTransit && (
            <DropdownMenuItem onClick={handleMarkReceived}>
              <PackageCheckIcon data-icon='inline-start' />
              Mark received
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon data-icon='inline-start' />
            Duplicate
          </DropdownMenuItem>
          {isDraft && (
            <DropdownMenuItem variant='destructive' onClick={() => setIsCancelConfirmOpen(true)}>
              <BanIcon data-icon='inline-start' />
              Cancel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => toast('Downloading transfer')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {transfer.number || 'this transfer'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling stops this transfer from being dispatched further. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep transfer</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default TransferRowActions
