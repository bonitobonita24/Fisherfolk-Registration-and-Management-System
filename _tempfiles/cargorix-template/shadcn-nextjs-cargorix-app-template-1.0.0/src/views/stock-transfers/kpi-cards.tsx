'use client'

// Third-party Imports
import { ClipboardListIcon, FileTextIcon, PackageCheckIcon, TruckIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useStockTransfersStore } from '@/store/use-stock-transfers-store'

// Util Imports
import { getTransferKpis } from '@/lib/selectors/stock-transfers-selectors'

const percentOf = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100))

const TransfersKpiCards = () => {
  // Vars
  const transfers = useStockTransfersStore(state => state.transfers)
  const kpis = getTransferKpis(transfers)

  const cards = [
    {
      label: 'Total transfers',
      value: kpis.total.toLocaleString(),
      caption: 'All stock transfers',
      icon: ClipboardListIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Draft',
      value: kpis.draft.toLocaleString(),
      caption: `${percentOf(kpis.draft, kpis.total)}% of total`,
      icon: FileTextIcon,
      className: 'bg-muted text-muted-foreground'
    },
    {
      label: 'In Transit',
      value: kpis.inTransit.toLocaleString(),
      caption: `${percentOf(kpis.inTransit, kpis.total)}% of total`,
      icon: TruckIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'Completed',
      value: kpis.completed.toLocaleString(),
      caption: `${percentOf(kpis.completed, kpis.total)}% of total`,
      icon: PackageCheckIcon,
      className: 'bg-success-soft text-success'
    }
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
          />
        )
      })}
    </div>
  )
}

export default TransfersKpiCards
