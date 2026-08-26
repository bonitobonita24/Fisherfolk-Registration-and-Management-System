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
  PencilIcon
} from 'lucide-react'

// Type Imports
import { toast } from 'sonner'

import type { StockAdjustment } from '@/types/entities/stock-adjustment'

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
import { checkAdjustmentIntake, useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'

// Util Imports
import { warnIfOverCapacity } from '@/lib/capacity-toast'

type AdjustmentRowActionsProps = {
  adjustment: StockAdjustment
}

const AdjustmentRowActions = ({ adjustment }: AdjustmentRowActionsProps) => {
  // States
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()

  // Vars
  const isDraft = adjustment.status === 'draft'

  const handlePost = () => {
    if (!warnIfOverCapacity(checkAdjustmentIntake(adjustment))) return

    const posted = useStockAdjustmentsStore.getState().postExistingDraft(adjustment.id)

    if (!posted) router.push(`/stock-adjustments/create/${adjustment.id}`)
  }

  const handleDuplicate = () => {
    const newId = useStockAdjustmentsStore.getState().duplicateAdjustment(adjustment.id)

    if (newId) router.push(`/stock-adjustments/create/${newId}`)
  }

  const handleCancel = () => {
    useStockAdjustmentsStore.getState().cancelAdjustment(adjustment.id)
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
          <DropdownMenuItem onClick={() => router.push(`/stock-adjustments/${adjustment.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View
          </DropdownMenuItem>
          {isDraft && (
            <DropdownMenuItem onClick={() => router.push(`/stock-adjustments/create/${adjustment.id}`)}>
              <PencilIcon data-icon='inline-start' />
              Edit
            </DropdownMenuItem>
          )}
          {isDraft && (
            <DropdownMenuItem onClick={handlePost}>
              <PackageCheckIcon data-icon='inline-start' />
              Post
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
          <DropdownMenuItem onClick={() => toast('Downloading adjustment')}>
            <DownloadIcon data-icon='inline-start' />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {adjustment.number || 'this adjustment'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling stops this adjustment from being posted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep adjustment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancel adjustment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default AdjustmentRowActions
