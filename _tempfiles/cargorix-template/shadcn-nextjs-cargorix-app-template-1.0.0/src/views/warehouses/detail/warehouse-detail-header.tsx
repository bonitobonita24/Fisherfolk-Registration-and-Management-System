'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { MoreHorizontalIcon, PencilIcon, PowerIcon, Trash2Icon, WarehouseIcon } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'
import ScheduleDockButton from '@/components/shared/schedule-dock-button'

// Store Imports
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Data Imports
import { WAREHOUSE_STATUS_BADGE } from '../warehouse-badges'

type WarehouseDetailHeaderProps = {
  warehouse: Warehouse
}

const WarehouseDetailHeader = ({ warehouse }: WarehouseDetailHeaderProps) => {
  // States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const setWarehouseStatus = useWarehousesStore(state => state.setWarehouseStatus)
  const deleteWarehouse = useWarehousesStore(state => state.deleteWarehouse)

  // Vars
  const statusBadge = WAREHOUSE_STATUS_BADGE[warehouse.status]
  const isActive = warehouse.status === 'active'

  const handleToggleStatus = () => {
    setWarehouseStatus(warehouse.id, isActive ? 'inactive' : 'active')
  }

  const handleDelete = () => {
    deleteWarehouse(warehouse.id)
    router.push('/warehouses')
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb parentLabel='Warehouses' parentHref='/warehouses' current={warehouse.name} />

      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex items-start gap-4'>
          <div className='bg-muted flex size-12 shrink-0 items-center justify-center rounded-lg'>
            <WarehouseIcon className='size-6' />
          </div>
          <div>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='text-2xl font-bold tracking-tight lg:text-3xl'>{warehouse.name}</h1>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {warehouse.code} • {warehouse.location}
            </p>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='secondary'
            className='gap-2'
            render={<Link href={`/warehouses/create/${warehouse.id}`} />}
            nativeButton={false}
          >
            <PencilIcon data-icon='inline-start' />
            Edit warehouse
          </Button>
          <ScheduleDockButton warehouseName={warehouse.name} variant='secondary' />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='Warehouse actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={handleToggleStatus}>
                <PowerIcon data-icon='inline-start' />
                {isActive ? 'Set inactive' : 'Set active'}
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => setIsDeleteOpen(true)}>
                <Trash2Icon data-icon='inline-start' />
                Delete warehouse
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {warehouse.name} from the warehouse list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete warehouse</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default WarehouseDetailHeader
