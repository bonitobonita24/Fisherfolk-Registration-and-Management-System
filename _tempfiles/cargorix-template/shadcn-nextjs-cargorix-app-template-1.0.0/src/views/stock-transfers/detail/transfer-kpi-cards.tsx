// Third-party Imports
import { BoxesIcon, ListChecksIcon, PackageCheckIcon, PackageOpenIcon } from 'lucide-react'

// Type Imports
import type { StockTransfer } from '@/types/entities/stock-transfer'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { computeTransferTotals } from '@/lib/selectors/stock-transfers-selectors'

type TransferKpiCardsProps = {
  t: StockTransfer
}

const TransferKpiCards = ({ t }: TransferKpiCardsProps) => {
  // Vars
  const totals = computeTransferTotals(t)

  const receivedPercent =
    totals.totalUnitsSent === 0 ? 0 : Math.round((totals.totalReceived / totals.totalUnitsSent) * 100)

  const remainingPercent =
    totals.totalUnitsSent === 0 ? 0 : Math.round((totals.totalRemaining / totals.totalUnitsSent) * 100)

  const cards = [
    {
      label: 'Total items',
      value: t.lines.length.toLocaleString(),
      caption: 'Line items on this transfer',
      icon: ListChecksIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Total units',
      value: totals.totalUnitsSent.toLocaleString(),
      caption: 'Units sent',
      icon: BoxesIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'Received units',
      value: totals.totalReceived.toLocaleString(),
      caption: `${receivedPercent}% of sent`,
      icon: PackageCheckIcon,
      className: 'bg-success-soft text-success'
    },
    {
      label: 'Remaining units',
      value: totals.totalRemaining.toLocaleString(),
      caption: `${remainingPercent}% of sent`,
      icon: PackageOpenIcon,
      className: 'bg-warning-soft text-warning'
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

export default TransferKpiCards
