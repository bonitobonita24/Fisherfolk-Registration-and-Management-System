'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PowerIcon, TrashIcon } from 'lucide-react'

// Type Imports
import type { Warehouse } from '@/types/entities/warehouse'

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
import { useWarehousesStore } from '@/store/use-warehouses-store'

type WarehouseRowActionsProps = {
  warehouse: Warehouse
}

const WarehouseRowActions = ({ warehouse }: WarehouseRowActionsProps) => {
  // States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const setWarehouseStatus = useWarehousesStore(state => state.setWarehouseStatus)
  const deleteWarehouse = useWarehousesStore(state => state.deleteWarehouse)

  // Vars
  const isActive = warehouse.status === 'active'

  const handleToggleStatus = () => {
    setWarehouseStatus(warehouse.id, isActive ? 'inactive' : 'active')
  }

  const handleDelete = () => {
    deleteWarehouse(warehouse.id)
    setIsDeleteConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant='ghost' size='icon' className='size-8' aria-label='Warehouse actions' />}
        >
          <MoreHorizontalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-fit'>
          <DropdownMenuItem onClick={() => router.push(`/warehouses/${warehouse.id}`)}>
            <EyeIcon data-icon='inline-start' />
            View warehouse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/warehouses/create/${warehouse.id}`)}>
            <PencilIcon data-icon='inline-start' />
            Edit warehouse
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleStatus}>
            <PowerIcon data-icon='inline-start' />
            {isActive ? 'Set inactive' : 'Set active'}
          </DropdownMenuItem>
          <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteConfirmOpen(true)}>
            <TrashIcon data-icon='inline-start' />
            Delete warehouse
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {warehouse.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the warehouse and its dock schedule from the list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete warehouse</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default WarehouseRowActions
