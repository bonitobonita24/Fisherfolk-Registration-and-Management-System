// Third-party Imports
import { BellIcon, Clock3Icon, TrendingUpIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Util Imports
import { getFleetKpis } from '@/lib/selectors/fleet-selectors'

type LiveMapKpiCardsProps = {
  vehicles: Vehicle[]
}

const LiveMapKpiCards = ({ vehicles }: LiveMapKpiCardsProps) => {
  // Vars
  const kpis = getFleetKpis(vehicles)

  const cards = [
    {
      label: 'Active vehicles',
      value: kpis.activeVehicles,
      caption: 'Across all regions',
      icon: TruckIcon,
      iconClassName: 'bg-info-soft text-info'
    },
    {
      label: 'On route',
      value: kpis.onRoute,
      caption: 'En route to next stop',
      icon: TrendingUpIcon,
      iconClassName: 'bg-success-soft text-success'
    },
    {
      label: 'Delayed',
      value: kpis.delayed,
      caption: 'Require attention',
      icon: Clock3Icon,
      iconClassName: 'bg-warning-soft text-warning'
    },
    {
      label: 'Alerts',
      value: kpis.alerts,
      caption: 'Active alerts',
      icon: BellIcon,
      iconClassName: 'bg-destructive/10 text-destructive'
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
            iconClassName={card.iconClassName}
          />
        )
      })}
    </div>
  )
}

export default LiveMapKpiCards
