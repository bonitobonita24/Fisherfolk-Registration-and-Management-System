'use client'

// Third-party Imports
import { CircleCheckIcon, CirclePauseIcon, UsersIcon, WalletIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useClientsStore } from '@/store/use-clients-store'
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Util Imports
import { getClientsSummary } from '@/lib/selectors/client-selectors'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const ClientKpiCards = () => {
  // Vars
  const clients = useClientsStore(state => state.clients)
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)

  const summary = getClientsSummary(clients, orders, shipments)

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        label='Total clients'
        value={summary.totalClients}
        icon={<UsersIcon />}
        iconClassName='bg-info-soft text-info'
      />
      <StatCard
        label='Active'
        value={summary.activeClients}
        icon={<CircleCheckIcon />}
        iconClassName='bg-success-soft text-success'
      />
      <StatCard
        label='On hold'
        value={summary.onHoldClients}
        icon={<CirclePauseIcon />}
        iconClassName='bg-warning-soft text-warning'
      />
      <StatCard
        label='Open order value'
        value={currency.format(summary.totalOutstanding)}
        caption='Across all accounts'
        icon={<WalletIcon />}
        iconClassName='bg-accent text-accent-foreground'
      />
    </div>
  )
}

export default ClientKpiCards
