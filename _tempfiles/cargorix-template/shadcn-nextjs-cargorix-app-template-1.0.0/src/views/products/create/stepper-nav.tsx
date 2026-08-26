'use client'

// React Imports
import { Fragment } from 'react'

import { ChevronRightIcon, ClipboardListIcon, ImagesIcon, SquareCheckBigIcon, WalletIcon } from 'lucide-react'

// Third-party Imports
import type { StepperType } from './index'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

// Util Imports
import { cn } from '@/lib/utils'

const STEP_ICONS: Record<string, React.ReactNode> = {
  'product-details': <ClipboardListIcon />,
  'inventory-pricing': <WalletIcon />,
  'media-organization': <ImagesIcon />,
  'review-publish': <SquareCheckBigIcon />
}

const StepperNav = ({ stepper }: { stepper: StepperType }) => {
  return (
    <nav aria-label='Create product steps'>
      <ScrollArea className='w-full'>
        <ol className='flex items-start justify-between gap-4 pb-3 max-md:flex-col md:items-center'>
          {stepper.steps.map((step, index, array) => {
            const isComplete = index < stepper.index
            const isCurrent = index === stepper.index

            return (
              <Fragment key={step.id}>
                <li className='flex shrink-0 items-center gap-4'>
                  <Button
                    type='button'
                    variant='ghost'
                    className='h-auto shrink-0 cursor-pointer gap-3 rounded-md bg-transparent! p-0! hover:bg-transparent!'
                    onClick={() => stepper.goTo(step.id)}
                  >
                    <Avatar className='size-9.5 after:border-none'>
                      <AvatarFallback
                        className={cn('text-foreground *:[svg]:size-4', {
                          'bg-primary text-primary-foreground shadow-sm': isCurrent || isComplete
                        })}
                      >
                        {STEP_ICONS[step.id]}
                      </AvatarFallback>
                    </Avatar>
                    <span className='flex flex-col items-start'>
                      <span className='text-sm font-medium'>{step.title}</span>
                      <span className='text-muted-foreground text-xs'>{step.description}</span>
                    </span>
                  </Button>
                </li>
                {index < array.length - 1 && (
                  <li className='max-md:hidden'>
                    <ChevronRightIcon className='text-foreground size-4' />
                  </li>
                )}
              </Fragment>
            )
          })}
        </ol>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </nav>
  )
}

export default StepperNav
