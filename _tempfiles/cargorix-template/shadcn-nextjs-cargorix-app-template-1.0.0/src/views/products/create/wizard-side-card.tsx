'use client'

// React Imports
import type { ReactNode } from 'react'
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

// Util Imports
import { cn } from '@/lib/utils'

type WizardSideCardProps = {
  title: string
  icon: LucideIcon
  defaultOpen?: boolean
  children: ReactNode
}

const WizardSideCard = ({ title, icon: Icon, defaultOpen = true, children }: WizardSideCardProps) => {
  // States
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className='h-fit gap-0 py-0'>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className='flex flex-wrap items-center justify-between gap-2 py-4'>
          <CardTitle className='flex items-center gap-2'>
            <Icon className='text-muted-foreground size-4' />
            {title}
          </CardTitle>
          <CollapsibleTrigger
            render={
              <Button variant='ghost' size='icon' className='size-7' aria-label={isOpen ? 'Collapse' : 'Expand'} />
            }
          >
            <ChevronDownIcon className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className='pb-4'>{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default WizardSideCard
