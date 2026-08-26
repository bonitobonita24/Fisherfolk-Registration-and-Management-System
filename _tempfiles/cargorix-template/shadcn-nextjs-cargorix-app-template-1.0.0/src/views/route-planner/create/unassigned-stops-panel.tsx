'use client'

// React Imports
import { useMemo, useState } from 'react'

// Third-party Imports
import { format } from 'date-fns'
import { toast } from 'sonner'
import { PackageSearchIcon, PlusIcon, SearchIcon } from 'lucide-react'

// Type Imports
import type { Order } from '@/types/entities/order'
import type { RouteStop } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

// Util Imports
import { getUnassignedOrders } from '@/lib/selectors/route-selectors'
import { cn } from '@/lib/utils'

const DEFAULT_SERVICE_MINUTES = 15

const formatWindow = (value: string) => {
  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'MMM d, HH:mm')
}

const toStop = (order: Order, index: number): RouteStop => ({
  id: crypto.randomUUID(),
  orderId: order.id,
  sequence: index + 1,
  displayId: order.displayId,
  customerName: order.contactName,
  address: order.deliveryAddress,
  lat: order.deliveryLat,
  lng: order.deliveryLng,
  windowStart: order.requestedPickupAt,
  windowEnd: order.requiredDeliveryAt,
  serviceMinutes: DEFAULT_SERVICE_MINUTES,
  etaAt: '',
  status: 'pending',
  weightKg: order.packages.reduce((sum, p) => sum + p.weightKg, 0),
  packageCount: order.packages.reduce((sum, p) => sum + p.quantity, 0)
})

// Props
type UnassignedStopsPanelProps = {
  routeId: string
  orders: Order[]
  warehouse?: Warehouse
}

const UnassignedStopsPanel = ({ routeId, orders, warehouse }: UnassignedStopsPanelProps) => {
  // States
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  // Hooks
  const routes = useRoutesStore(state => state.routes)
  const addStops = useRoutesStore(state => state.addStops)

  // Vars
  const available = useMemo(() => getUnassignedOrders(orders, routes), [orders, routes])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return available

    return available.filter(order =>
      [order.displayId, order.contactName, order.deliveryAddress].some(field => field.toLowerCase().includes(query))
    )
  }, [available, search])

  const toggle = (orderId: string, checked: boolean) =>
    setSelected(prev => (checked ? [...prev, orderId] : prev.filter(id => id !== orderId)))

  const handleAddSelected = () => {
    const picked = available.filter(order => selected.includes(order.id))

    if (picked.length === 0) return

    addStops(routeId, picked.map(toStop), warehouse)
    setSelected([])
    toast.success(`${picked.length} ${picked.length === 1 ? 'stop' : 'stops'} added to the route`)
  }

  return (
    <Card className='h-fit gap-0 py-0'>
      <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
        <CardTitle>Unassigned orders</CardTitle>
        <Badge variant='secondary'>{available.length}</Badge>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <InputGroup>
          <InputGroupInput
            className='input-default'
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search orders...'
            aria-label='Search unassigned orders'
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        {filtered.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-center'>
            <div className='bg-muted flex size-11 items-center justify-center rounded-full'>
              <PackageSearchIcon className='text-muted-foreground size-5' />
            </div>
            <p className='text-sm font-medium'>No orders to assign</p>
            <p className='text-muted-foreground text-xs'>
              {available.length === 0 ? 'Every ready order is already on a route.' : 'No order matches this search.'}
            </p>
          </div>
        ) : (
          <ScrollArea className='-mr-2 h-[26rem] pr-2'>
            <ul className='space-y-2'>
              {filtered.map(order => {
                const isSelected = selected.includes(order.id)

                return (
                  <li
                    key={order.id}
                    onClick={() => toggle(order.id, !isSelected)}
                    className={cn(
                      'hover:border-primary/40 flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                  >
                    <Checkbox
                      className='mt-0.5'
                      aria-label={`Select order ${order.displayId}`}
                      checked={isSelected}
                      onCheckedChange={checked => toggle(order.id, checked === true)}
                      onClick={event => event.stopPropagation()}
                    />
                    <div className='min-w-0 flex-1 space-y-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='truncate text-sm font-medium'>{order.displayId}</span>
                        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                          {order.packages.reduce((sum, p) => sum + p.quantity, 0)} pkg
                        </span>
                      </div>
                      <p className='truncate text-sm'>{order.contactName}</p>
                      <p className='text-muted-foreground truncate text-xs'>{order.deliveryAddress}</p>
                      <p className='text-muted-foreground text-xs tabular-nums'>
                        {formatWindow(order.requestedPickupAt)} → {formatWindow(order.requiredDeliveryAt)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}

        <Button className='w-full gap-2' disabled={selected.length === 0} onClick={handleAddSelected}>
          <PlusIcon className='size-4' />
          Add selected{selected.length > 0 ? ` (${selected.length})` : ''}
        </Button>
      </CardContent>
    </Card>
  )
}

export default UnassignedStopsPanel
