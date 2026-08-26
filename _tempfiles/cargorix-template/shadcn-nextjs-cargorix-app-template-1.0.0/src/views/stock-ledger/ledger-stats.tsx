'use client'

// Third-party Imports
import { ArrowDownToLineIcon, ArrowUpFromLineIcon, ListChecksIcon, ScaleIcon } from 'lucide-react'

// Type Imports
import type { StockMovementRow } from '@/types/entities/stock-movement'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { getLedgerKpis } from '@/lib/selectors/stock-ledger-selectors'

type LedgerStatsProps = {
  rows: StockMovementRow[]
}

const LedgerStats = ({ rows }: LedgerStatsProps) => {
  // Vars
  const { totalIn, totalOut, netChange, count } = getLedgerKpis(rows)

  const cards = [
    {
      label: 'Total in',
      value: `+${totalIn.toLocaleString()}`,
      caption: 'Units received',
      icon: ArrowDownToLineIcon,
      iconClassName: 'bg-success-soft text-success',
      valueClassName: 'text-success'
    },
    {
      label: 'Total out',
      value: `-${totalOut.toLocaleString()}`,
      caption: 'Units shipped',
      icon: ArrowUpFromLineIcon,
      iconClassName: 'bg-destructive/10 text-destructive',
      valueClassName: 'text-destructive'
    },
    {
      label: 'Net change',
      value: `${netChange > 0 ? '+' : ''}${netChange.toLocaleString()}`,
      caption: 'Inbound − outbound',
      icon: ScaleIcon,
      iconClassName: 'bg-info-soft text-info',
      valueClassName: netChange < 0 ? 'text-destructive' : ''
    },
    {
      label: 'Movements',
      value: count.toLocaleString(),
      caption: 'Ledger entries',
      icon: ListChecksIcon,
      iconClassName: 'bg-accent text-accent-foreground',
      valueClassName: ''
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
            iconClassName={card.iconClassName}
            valueClassName={card.valueClassName}
          />
        )
      })}
    </div>
  )
}

export default LedgerStats
