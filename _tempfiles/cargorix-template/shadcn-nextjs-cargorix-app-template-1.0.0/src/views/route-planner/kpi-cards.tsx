'use client'

// Third-party Imports
import { CircleCheckBigIcon, FlagIcon, RouteIcon, TruckIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

// Util Imports
import { getRouteKpis } from '@/lib/selectors/route-selectors'

const RoutePlannerKpiCards = () => {
  // Vars
  const routes = useRoutesStore(state => state.routes)
  const kpis = getRouteKpis(routes)

  const cards = [
    {
      label: 'Total routes',
      value: kpis.totalRoutes,
      caption: 'All planned routes',
      icon: RouteIcon,
      className: 'bg-info-soft text-info'
    },
    {
      label: 'In progress',
      value: kpis.inProgress,
      caption: 'Out on the road',
      icon: TruckIcon,
      className: 'bg-warning-soft text-warning'
    },
    {
      label: 'Ready to dispatch',
      value: kpis.readyToDispatch,
      caption: 'Vehicle and driver assigned',
      icon: CircleCheckBigIcon,
      className: 'bg-accent text-accent-foreground'
    },
    {
      label: 'Completed',
      value: kpis.completed,
      caption: 'All stops delivered',
      icon: FlagIcon,
      className: 'bg-success-soft text-success'
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

export default RoutePlannerKpiCards
