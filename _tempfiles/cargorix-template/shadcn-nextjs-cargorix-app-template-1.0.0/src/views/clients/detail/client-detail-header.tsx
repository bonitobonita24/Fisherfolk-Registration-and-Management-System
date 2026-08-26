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
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShoppingCartIcon,
  TruckIcon,
  WalletIcon
} from 'lucide-react'

// Type Imports
import type { Client } from '@/types/entities/client'
import type { Order } from '@/types/entities/order'
import type { Shipment } from '@/types/entities/shipment'

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
import { useClientsStore } from '@/store/use-clients-store'

// Util Imports
import { getClientRollup } from '@/lib/selectors/client-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { CLIENT_STATUS_BADGE } from '../client-badges'

type ClientDetailHeaderProps = {
  client: Client
  orders: Order[]
  shipments: Shipment[]
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const ClientDetailHeader = ({ client, orders, shipments }: ClientDetailHeaderProps) => {
  // Hooks
  const updateClient = useClientsStore(state => state.updateClient)
  const router = useRouter()

  // Vars
  const status = CLIENT_STATUS_BADGE[client.status ?? 'inactive']
  const isOnHold = client.status === 'on_hold'
  const rollup = getClientRollup(client, orders, shipments)

  const handleCreateOrder = () => {
    router.push(`/orders/create/${crypto.randomUUID()}`)
  }

  return (
    <div className='space-y-6'>
      <PageBreadcrumb parentLabel='Clients' parentHref='/clients' current={client.name} />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>{client.name}</h1>
            <Badge className={cn('gap-1.5', status.className)}>
              <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
              {status.label}
            </Badge>
          </div>
          {client.description && <p className='text-muted-foreground mt-1 text-sm'>{client.description}</p>}
        </div>

        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='More actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={handleCreateOrder}>
                <PlusIcon data-icon='inline-start' />
                Create order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/orders')}>
                <ListIcon data-icon='inline-start' />
                View all orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => updateClient(client.id, { status: isOnHold ? 'active' : 'on_hold' })}>
                {isOnHold ? <CirclePlayIcon data-icon='inline-start' /> : <CirclePauseIcon data-icon='inline-start' />}
                {isOnHold ? 'Set active' : 'Set on hold'}
              </DropdownMenuItem>
              <DropdownMenuItem variant='destructive' onClick={() => updateClient(client.id, { status: 'inactive' })}>
                <CircleMinusIcon data-icon='inline-start' />
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className='gap-2' render={<Link href={`/clients/create/${client.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit client
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <StatCard
          label='Total orders'
          value={rollup.ordersCount}
          caption='Lifetime to date'
          icon={<ShoppingCartIcon />}
          iconClassName='bg-info-soft text-info'
        />
        <StatCard
          label='Active shipments'
          value={rollup.activeShipments}
          caption='Shipments in progress'
          icon={<TruckIcon />}
          iconClassName='bg-accent text-accent-foreground'
        />
        <StatCard
          label='Open order value'
          value={currency.format(rollup.outstandingBalance)}
          caption='Orders in progress'
          icon={<WalletIcon />}
          iconClassName='bg-warning-soft text-warning'
        />
        <StatCard
          label='Lifetime value'
          value={currency.format(rollup.lifetimeValue)}
          caption='Billable revenue to date'
          icon={<CircleDollarSignIcon />}
          iconClassName='bg-success-soft text-success'
        />
      </div>
    </div>
  )
}

export default ClientDetailHeader
