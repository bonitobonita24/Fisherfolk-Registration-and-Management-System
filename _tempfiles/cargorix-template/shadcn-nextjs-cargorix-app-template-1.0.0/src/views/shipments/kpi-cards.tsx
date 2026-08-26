// Third-party Imports
import { CalendarClockIcon, NavigationIcon, PackageIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Shipment } from '@/types/entities/shipment'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { getShipmentKpis } from '@/lib/selectors/shipments-selectors'

type ShipmentsKpiCardsProps = {
  shipments: Shipment[]
}

const ShipmentsKpiCards = ({ shipments }: ShipmentsKpiCardsProps) => {
  // Vars
  const kpis = getShipmentKpis(shipments)

  const cards = [
    {
      label: 'Total shipments',
      value: kpis.total,
      caption: 'All shipments',
      icon: PackageIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Scheduled',
      value: kpis.scheduled,
      caption: 'Upcoming',
      icon: CalendarClockIcon,
      className: 'bg-violet-600/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400'
    },
    {
      label: 'In transit',
      value: kpis.inTransit,
      caption: 'On the way',
      icon: TruckIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'Out for delivery',
      value: kpis.outForDelivery,
      caption: 'With driver',
      icon: NavigationIcon,
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

export default ShipmentsKpiCards
