'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { CopyIcon, EyeIcon, MoreHorizontalIcon } from 'lucide-react'

// Type Imports
import type { StockMovementRow } from '@/types/entities/stock-movement'

// Component Imports
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type LedgerRowActionsProps = {
  movement: StockMovementRow
}

const LedgerRowActions = ({ movement }: LedgerRowActionsProps) => {
  // Hooks
  const router = useRouter()

  const handleCopyReference = () => {
    navigator.clipboard?.writeText(movement.reference)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='size-8' aria-label='Movement actions' />}
      >
        <MoreHorizontalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        <DropdownMenuItem onClick={() => router.push(`/products/${movement.productId}`)}>
          <EyeIcon data-icon='inline-start' />
          View product
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyReference}>
          <CopyIcon data-icon='inline-start' />
          Copy reference
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LedgerRowActions
