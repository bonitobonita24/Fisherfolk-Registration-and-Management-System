// Third-party Imports
import { ArrowDownIcon, ArrowUpIcon, ListChecksIcon, ScaleIcon } from 'lucide-react'

// Type Imports
import type { StockAdjustment } from '@/types/entities/stock-adjustment'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { computeAdjustmentTotals } from '@/lib/selectors/stock-adjustments-selectors'

type AdjustmentKpiCardsProps = {
  a: StockAdjustment
}

const AdjustmentKpiCards = ({ a }: AdjustmentKpiCardsProps) => {
  // Vars
  const totals = computeAdjustmentTotals(a)
  const netSign = totals.netChange > 0 ? '+' : totals.netChange < 0 ? '−' : ''

  const netClassName = totals.netChange > 0 ? 'text-success' : totals.netChange < 0 ? 'text-destructive' : ''

  const cards = [
    {
      label: 'Total lines',
      value: totals.lineCount.toLocaleString(),
      caption: 'Line items on this adjustment',
      valueClassName: '',
      icon: ListChecksIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Total added',
      value: `+${totals.totalAdded.toLocaleString()}`,
      caption: 'Units added',
      valueClassName: 'text-success',
      icon: ArrowUpIcon,
      className: 'bg-success-soft text-success'
    },
    {
      label: 'Total removed',
      value: `−${totals.totalRemoved.toLocaleString()}`,
      caption: 'Units removed',
      valueClassName: 'text-destructive',
      icon: ArrowDownIcon,
      className: 'bg-destructive/10 text-destructive'
    },
    {
      label: 'Net change',
      value: `${netSign}${Math.abs(totals.netChange).toLocaleString()}`,
      caption: 'On-hand delta',
      valueClassName: netClassName,
      icon: ScaleIcon,
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
            valueClassName={card.valueClassName}
          />
        )
      })}
    </div>
  )
}

export default AdjustmentKpiCards
