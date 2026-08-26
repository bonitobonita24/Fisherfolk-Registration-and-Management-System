'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { RefreshCwIcon, RouteIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'

const LiveMapHeader = () => {
  // Hooks
  const router = useRouter()

  return (
    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Live Map</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Monitor active vehicles, routes and operational alerts in real time.
        </p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button variant='secondary' className='gap-2' onClick={() => router.refresh()}>
          <RefreshCwIcon data-icon='inline-start' />
          Refresh
        </Button>
        <Button className='gap-2' render={<Link href='/route-planner' />} nativeButton={false}>
          <RouteIcon data-icon='inline-start' />
          Route planner
        </Button>
      </div>
    </div>
  )
}

export default LiveMapHeader
