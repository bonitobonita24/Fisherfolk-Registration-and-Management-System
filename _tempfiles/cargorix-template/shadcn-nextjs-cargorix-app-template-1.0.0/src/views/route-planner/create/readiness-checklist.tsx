'use client'

// Third-party Imports
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { Route } from '@/types/entities/route'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Util Imports
import { getRouteReadiness } from '@/lib/selectors/route-selectors'

// Props
type ReadinessChecklistProps = {
  route: Route
}

const ReadinessChecklist = ({ route }: ReadinessChecklistProps) => {
  // Vars
  const checklist = getRouteReadiness(route)
  const done = checklist.filter(item => item.done).length
  const complete = done === checklist.length

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
        <CardTitle>Readiness</CardTitle>
        <Badge className={complete ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}>
          {done} / {checklist.length}
        </Badge>
      </CardHeader>
      <CardContent className='p-4 text-sm'>
        <ul className='space-y-2'>
          {checklist.map(item => (
            <li key={item.label} className='flex items-center gap-2'>
              {item.done ? (
                <CheckCircle2Icon className='text-success size-4 shrink-0' />
              ) : (
                <CircleIcon className='text-muted-foreground size-4 shrink-0' />
              )}
              <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default ReadinessChecklist
