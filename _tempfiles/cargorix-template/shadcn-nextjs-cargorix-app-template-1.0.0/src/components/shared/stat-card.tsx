// React Imports
import type { ReactNode } from 'react'

// Component Imports
import { Card, CardContent } from '@/components/ui/card'

// Util Imports
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  caption?: string
  icon: ReactNode
  iconClassName?: string
  valueClassName?: string
  valueTitle?: string
  className?: string
}

const StatCard = ({
  label,
  value,
  caption,
  icon,
  iconClassName,
  valueClassName,
  valueTitle,
  className
}: StatCardProps) => {
  return (
    <Card size='sm' className={className}>
      <CardContent className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-sm font-medium'>{label}</p>
          <p
            className={cn('mt-1 truncate text-3xl font-bold tabular-nums', valueClassName)}
            title={valueTitle ?? String(value)}
          >
            {value}
          </p>
          {caption && <p className='text-muted-foreground mt-1 truncate text-xs'>{caption}</p>}
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5', iconClassName)}>
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}

export default StatCard
