'use client'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  BanIcon,
  CalendarIcon,
  CopyIcon,
  DownloadIcon,
  MapIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TruckIcon
} from 'lucide-react'

// Type Imports
import type { Route } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// Shared Imports
import PageBreadcrumb from '@/components/shared/page-breadcrumb'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

// Data Imports
import { ROUTE_STATUS_BADGE } from '../route-badges'

type RouteDetailHeaderProps = {
  route: Route
  warehouse?: Warehouse
}

const RouteDetailHeader = ({ route, warehouse }: RouteDetailHeaderProps) => {
  // Vars
  const badge = ROUTE_STATUS_BADGE[route.status]
  const lastStop = route.stops[route.stops.length - 1]
  const origin = warehouse?.name ?? '—'
  const destination = route.returnToStart ? (warehouse?.name ?? '—') : (lastStop?.customerName ?? '—')
  const dateLabel = route.date ? format(new Date(route.date), 'dd MMM yyyy') : '—'
  const canDispatch = route.status === 'ready'
  const canCancel = route.status === 'draft' || route.status === 'planned' || route.status === 'ready'

  // Hooks
  const router = useRouter()
  const duplicateRoute = useRoutesStore(state => state.duplicateRoute)
  const dispatchRoute = useRoutesStore(state => state.dispatchRoute)
  const cancelRoute = useRoutesStore(state => state.cancelRoute)

  const handleDuplicate = () => {
    const newId = duplicateRoute(route.id)

    if (!newId) {
      toast.error('Could not duplicate this route')

      return
    }

    toast.success(`${route.number} duplicated`)
    router.push(`/route-planner/create/${newId}`)
  }

  const handleDispatch = () => {
    if (!dispatchRoute(route.id)) {
      toast.error(`${route.number} is not ready to dispatch`)

      return
    }

    toast.success(`${route.number} dispatched`)
  }

  const handleCancel = () => {
    cancelRoute(route.id)
    toast.success(`${route.number} cancelled`)
  }

  return (
    <div className='space-y-4'>
      <PageBreadcrumb
        parentLabel='Route Planner'
        parentHref='/route-planner'
        current={route.number || 'Untitled route'}
      />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs font-semibold tracking-widest uppercase'>Route detail</p>
          <div className='mt-1 flex flex-wrap items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight lg:text-3xl'>{route.number || 'Untitled route'}</h1>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
          <div className='text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
            <CalendarIcon className='size-4' />
            <span>
              {dateLabel} · Departs {route.startTime || '—'}
            </span>
            <span aria-hidden='true'>·</span>
            <span className='truncate'>
              {origin} → {destination}
            </span>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {route.vehicleId && (
            <Button
              variant='secondary'
              className='gap-2'
              render={<Link href={`/live-map/${route.vehicleId}`} />}
              nativeButton={false}
            >
              <MapIcon data-icon='inline-start' />
              Live map
            </Button>
          )}
          <Button className='gap-2' render={<Link href={`/route-planner/create/${route.id}`} />} nativeButton={false}>
            <PencilIcon data-icon='inline-start' />
            Edit route
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='secondary' size='icon' aria-label='More actions' />}>
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem onClick={handleDuplicate}>
                <CopyIcon data-icon='inline-start' />
                Duplicate
              </DropdownMenuItem>
              {canDispatch && (
                <DropdownMenuItem onClick={handleDispatch}>
                  <TruckIcon data-icon='inline-start' />
                  Dispatch
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => toast('Export started')}>
                <DownloadIcon data-icon='inline-start' />
                Export
              </DropdownMenuItem>
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant='destructive' onClick={handleCancel}>
                    <BanIcon data-icon='inline-start' />
                    Cancel route
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default RouteDetailHeader
