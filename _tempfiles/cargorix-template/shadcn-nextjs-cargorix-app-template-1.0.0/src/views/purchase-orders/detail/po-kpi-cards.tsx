// Third-party Imports
import { BoxesIcon, DollarSignIcon, PackageCheckIcon, PackageOpenIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { computePurchaseOrderTotals, computeReceivingProgress } from '@/lib/selectors/purchase-orders-selectors'

type PoKpiCardsProps = {
  po: PurchaseOrder
}

const PoKpiCards = ({ po }: PoKpiCardsProps) => {
  // Vars
  const progress = computeReceivingProgress(po)
  const totals = computePurchaseOrderTotals(po)

  const receivedPercent = progress.totalOrdered === 0 ? 0 : Math.round(progress.receivedPercent)
  const remainingPercent = progress.totalOrdered === 0 ? 0 : 100 - receivedPercent

  const cards = [
    {
      label: 'Total quantity',
      value: progress.totalOrdered.toLocaleString(),
      caption: `${po.lines.length.toLocaleString()} line items`,
      icon: BoxesIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Received',
      value: progress.totalReceived.toLocaleString(),
      caption: `${receivedPercent}% of ordered`,
      icon: PackageCheckIcon,
      className: 'bg-success-soft text-success'
    },
    {
      label: 'Remaining',
      value: progress.totalRemaining.toLocaleString(),
      caption: `${remainingPercent}% of ordered`,
      icon: PackageOpenIcon,
      className: 'bg-warning-soft text-warning'
    },
    {
      label: 'Total PO value',
      value: `$${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      caption: 'Grand total incl. tax & shipping',
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
          />
        )
      })}
    </div>
  )
}

export default PoKpiCards
