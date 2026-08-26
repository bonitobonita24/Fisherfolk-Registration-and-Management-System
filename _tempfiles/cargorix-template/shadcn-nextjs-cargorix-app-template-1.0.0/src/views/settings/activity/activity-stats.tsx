'use client'

// Third-party Imports
import { AlertCircleIcon, LayersIcon, TrendingUpIcon } from 'lucide-react'

// Type Imports
import type { ActivityStats as ActivityStatsType } from '@/types/pages/activity-log'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Props
type ActivityStatsProps = {
  stats: ActivityStatsType
}

const ActivityStats = ({ stats }: ActivityStatsProps) => {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
      <StatCard
        label='Total Events Today'
        value={stats.totalToday}
        icon={<TrendingUpIcon />}
        iconClassName='bg-accent text-accent-foreground'
      />
      <StatCard
        label='Failed Actions Today'
        value={stats.failedToday}
        icon={<AlertCircleIcon />}
        iconClassName='bg-destructive/10 text-destructive'
      />
      <StatCard
        label='Most Active Module'
        value={stats.topModule}
        icon={<LayersIcon />}
        iconClassName='bg-accent text-accent-foreground'
        valueTitle={String(stats.topModule)}
      />
    </div>
  )
}

export default ActivityStats
