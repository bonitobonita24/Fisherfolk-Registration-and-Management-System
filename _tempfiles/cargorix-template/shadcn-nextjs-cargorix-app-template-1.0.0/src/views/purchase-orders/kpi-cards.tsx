'use client'

// Third-party Imports
import { ClipboardListIcon, DollarSignIcon, PackageCheckIcon, TruckIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

// Util Imports
import { getPurchaseOrderKpis } from '@/lib/selectors/purchase-orders-selectors'

const percentOf = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100))

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatKpiCurrency = (value: number) =>
  value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(2)}M` : formatCurrency(value)

const PurchaseOrdersKpiCards = () => {
  // Vars
  const purchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)
  const kpis = getPurchaseOrderKpis(purchaseOrders)

  const cards = [
    {
      label: 'Total POs',
      value: kpis.total.toLocaleString(),
      caption: 'All purchase orders',
      icon: ClipboardListIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'In Transit',
      value: kpis.inTransit.toLocaleString(),
      caption: `${percentOf(kpis.inTransit, kpis.total)}% of total`,
      icon: TruckIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'Received',
      value: kpis.received.toLocaleString(),
      caption: `${percentOf(kpis.received, kpis.total)}% of total`,
      icon: PackageCheckIcon,
      className: 'bg-success-soft text-success'
    },
    {
      label: 'Total Value',
      value: formatKpiCurrency(kpis.totalValue),
      title: formatCurrency(kpis.totalValue),
      caption: 'Excludes cancelled POs',
      icon: DollarSignIcon,
      className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400'
    }
  ]

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {cards.map(card => {
        const Icon = card.icon

        return (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.caption}
            icon={<Icon />}
            iconClassName={card.className}
            valueTitle={'title' in card ? card.title : undefined}
          />
        )
      })}
    </div>
  )
}

export default PurchaseOrdersKpiCards
