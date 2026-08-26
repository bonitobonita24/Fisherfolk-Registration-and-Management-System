'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import {
  CircleDollarSignIcon,
  CircleMinusIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  ClipboardListIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TimerIcon
} from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier } from '@/types/entities/supplier'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useSuppliersStore } from '@/store/use-suppliers-store'

// Util Imports
import { getSupplierRollup } from '@/lib/selectors/supplier-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { SUPPLIER_STATUS_BADGE } from '../supplier-badges'

type SupplierDetailHeaderProps = {
  supplier: Supplier
  purchaseOrders: PurchaseOrder[]
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const SupplierDetailHeader = ({ supplier, purchaseOrders }: SupplierDetailHeaderProps) => {
  // Hooks
  const updateSupplier = useSuppliersStore(state => state.updateSupplier)
  const router = useRouter()

  // Vars
  const status = SUPPLIER_STATUS_BADGE[supplier.status ?? 'inactive']
  const isLimited = supplier.status === 'limited'
  const rollup = getSupplierRollup(supplier, purchaseOrders)

  const handleCreatePurchaseOrder = () => {
    router.push(`/purchase-orders/create/${crypto.randomUUID()}`)
  }

  return (
    <div className='space-y-6'>
      <PageBreadcrumb parentLabel='Suppliers' parentHref='/suppliers' current={supplier.name} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>{supplier.name}</h1>
            <Badge className={cn('gap-1.5', status.className)}>
              <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
              {status.label}
            </Badge>
          </div>
          {supplier.description && <p className='text-muted-foreground mt-1 text-sm'>{supplier.description}</p>}
        </div>

        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='More actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              <DropdownMenuItem onClick={handleCreatePurchaseOrder}>
                <PlusIcon data-icon='inline-start' />
                Create purchase order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/purchase-orders')}>
                <ListIcon data-icon='inline-start' />
                View all POs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateSupplier(supplier.id, { status: isLimited ? 'active' : 'limited' })}
              >
                {isLimited ? <CirclePlayIcon data-icon='inline-start' /> : <CirclePauseIcon data-icon='inline-start' />}
                {isLimited ? 'Set active' : 'Set limited'}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => updateSupplier(supplier.id, { status: 'inactive' })}
              >
                <CircleMinusIcon data-icon='inline-start' />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className='gap-2' render={<Link href={`/suppliers/create/${supplier.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit supplier
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <StatCard
          label='Open POs'
          value={rollup.openPOs}
          caption='Placed and not yet closed'
          icon={<ClipboardListIcon />}
          iconClassName='bg-info-soft text-info'
        />
        <StatCard
          label='Total POs'
          value={rollup.poCount}
          caption='Lifetime to date'
          icon={<ListIcon />}
          iconClassName='bg-accent text-accent-foreground'
        />
        <StatCard
          label='Lead time'
          value={typeof supplier.leadTimeDays === 'number' ? `${supplier.leadTimeDays} days` : '—'}
          caption='Quoted delivery window'
          icon={<TimerIcon />}
          iconClassName='bg-warning-soft text-warning'
        />
        <StatCard
          label='Total purchased'
          value={currency.format(rollup.totalPurchased)}
          caption='Billable spend to date'
          icon={<CircleDollarSignIcon />}
          iconClassName='bg-success-soft text-success'
        />
      </div>
    </div>
  )
}

export default SupplierDetailHeader
