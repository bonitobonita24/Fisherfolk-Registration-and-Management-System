'use client'

// Third-party Imports
import { ClipboardListIcon, FileTextIcon, PackageCheckIcon, SlidersHorizontalIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'

// Util Imports
import { getAdjustmentKpis } from '@/lib/selectors/stock-adjustments-selectors'

const percentOf = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100))

const signed = (value: number) => (value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString())

const AdjustmentsKpiCards = () => {
  // Vars
  const adjustments = useStockAdjustmentsStore(state => state.adjustments)
  const kpis = getAdjustmentKpis(adjustments)

  const cards = [
    {
      label: 'Total adjustments',
      value: kpis.total.toLocaleString(),
      caption: 'All stock adjustments',
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
      label: 'Posted',
      value: kpis.posted.toLocaleString(),
      caption: `${percentOf(kpis.posted, kpis.total)}% of total`,
      icon: PackageCheckIcon,
      className: 'bg-success-soft text-success'
    },
    {
      label: 'Net units changed',
      value: signed(kpis.netUnits),
      caption: 'From posted adjustments',
      icon: SlidersHorizontalIcon,
      className: 'bg-info-soft text-info'
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

export default AdjustmentsKpiCards
