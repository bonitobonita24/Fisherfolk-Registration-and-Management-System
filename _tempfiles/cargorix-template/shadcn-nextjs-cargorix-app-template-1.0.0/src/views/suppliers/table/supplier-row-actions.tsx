'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { CircleMinusIcon, CirclePauseIcon, CirclePlayIcon, EyeIcon, MoreVerticalIcon, PencilIcon } from 'lucide-react'

// Type Imports
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Store Imports
import { useSuppliersStore } from '@/store/use-suppliers-store'

type SupplierRowActionsProps = {
  supplier: Supplier
}

const SupplierRowActions = ({ supplier }: SupplierRowActionsProps) => {
  // Vars
  const updateSupplier = useSuppliersStore(state => state.updateSupplier)
  const isLimited = supplier.status === 'limited'

  // Hooks
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='size-8' aria-label='Supplier actions' />}
      >
        <MoreVerticalIcon className='size-4' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit'>
        <DropdownMenuItem onClick={() => router.push(`/suppliers/${supplier.id}`)}>
          <EyeIcon data-icon='inline-start' />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/suppliers/create/${supplier.id}`)}>
          <PencilIcon data-icon='inline-start' />
          Edit supplier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updateSupplier(supplier.id, { status: isLimited ? 'active' : 'limited' })}>
          {isLimited ? <CirclePlayIcon data-icon='inline-start' /> : <CirclePauseIcon data-icon='inline-start' />}
          {isLimited ? 'Set active' : 'Set limited'}
        </DropdownMenuItem>
        <DropdownMenuItem variant='destructive' onClick={() => updateSupplier(supplier.id, { status: 'inactive' })}>
          <CircleMinusIcon data-icon='inline-start' />
          Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SupplierRowActions
