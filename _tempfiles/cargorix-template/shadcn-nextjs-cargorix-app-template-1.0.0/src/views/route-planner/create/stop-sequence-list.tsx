'use client'

// React Imports
import { useMemo } from 'react'

// Third-party Imports
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { ClockIcon, GripVerticalIcon, MapPinIcon, RouteIcon, XIcon } from 'lucide-react'

// Type Imports
import type { Route, RouteStop } from '@/types/entities/route'
import type { Warehouse } from '@/types/entities/warehouse'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Store Imports
import { useRoutesStore } from '@/store/use-routes-store'

// Util Imports
import { computeEtas } from '@/lib/selectors/route-selectors'
import { formatStopWindow, spansMultipleDays } from '../stop-window'

const formatTime = (value: string) => {
  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'HH:mm')
}

// Props
type SortableStopRowProps = {
  showDate: boolean
  stop: RouteStop
  onRemove: (stopId: string) => void
}

const SortableStopRow = ({ stop, onRemove, showDate }: SortableStopRowProps) => {
  // Hooks
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id
  })

  // Vars
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-card flex items-start gap-3 rounded-2xl border p-3 ${isDragging ? 'z-10 shadow-lg' : ''}`}
    >
      <Button
        ref={setActivatorNodeRef}
        variant='ghost'
        size='icon'
        className='text-muted-foreground mt-0.5 shrink-0 cursor-grab active:cursor-grabbing'
        {...attributes}
        {...listeners}
        aria-label={`Reorder stop ${stop.sequence}: ${stop.displayId}`}
      >
        <GripVerticalIcon className='size-4' />
      </Button>

      <span className='bg-foreground text-background mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums'>
        {stop.sequence}
      </span>

      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex items-center justify-between gap-2'>
          <span className='truncate text-sm font-medium'>{stop.displayId}</span>
          <Badge variant='secondary' className='shrink-0 tabular-nums'>
            ETA {formatTime(stop.etaAt)}
          </Badge>
        </div>
        <p className='truncate text-sm'>{stop.customerName}</p>
        <p className='text-muted-foreground truncate text-xs'>{stop.address}</p>
        <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums'>
          <span className='inline-flex items-center gap-1'>
            <ClockIcon className='size-3' />
            {formatStopWindow(stop.windowStart, stop.windowEnd, showDate)}
          </span>
          <span>{stop.serviceMinutes} min service</span>
          <span>{stop.weightKg.toLocaleString()} kg</span>
        </div>
      </div>

      <Button
        variant='ghost'
        size='icon'
        className='text-muted-foreground hover:text-destructive mt-0.5 shrink-0'
        aria-label={`Remove stop ${stop.displayId}`}
        onClick={() => onRemove(stop.id)}
      >
        <XIcon className='size-4' />
      </Button>
    </li>
  )
}

// Props
type StopSequenceListProps = {
  route: Route
  warehouse?: Warehouse
}

const StopSequenceList = ({ route, warehouse }: StopSequenceListProps) => {
  // Hooks
  const reorderStops = useRoutesStore(state => state.reorderStops)
  const removeStop = useRoutesStore(state => state.removeStop)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const stops = useMemo(
    () => computeEtas(route.stops, warehouse, route.date, route.startTime),
    [route.stops, route.date, route.startTime, warehouse]
  )

  const stopIds = stops.map(stop => stop.id)
  const showDate = spansMultipleDays(stops.map(stop => stop.windowStart))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const from = stopIds.indexOf(String(active.id))
    const to = stopIds.indexOf(String(over.id))

    if (from === -1 || to === -1) return

    reorderStops(route.id, arrayMove(stopIds, from, to), warehouse)
  }

  const handleRemove = (stopId: string) => removeStop(route.id, stopId, warehouse)

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='flex flex-wrap items-center justify-between px-5 pt-5'>
        <CardTitle>Stop sequence</CardTitle>
        <span className='text-muted-foreground text-sm tabular-nums'>
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
        </span>
      </CardHeader>
      <CardContent className='p-4'>
        {stops.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-12 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <RouteIcon className='text-muted-foreground size-6' />
            </div>
            <p className='font-medium'>No stops sequenced yet</p>
            <p className='text-muted-foreground text-sm'>
              Pick orders from the unassigned list to build this route&apos;s sequence.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <MapPinIcon className='size-3.5' />
              Drag a handle, or focus it and use the arrow keys, to reorder stops.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stopIds} strategy={verticalListSortingStrategy}>
                <ul className='space-y-2'>
                  {stops.map(stop => (
                    <SortableStopRow key={stop.id} stop={stop} onRemove={handleRemove} showDate={showDate} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StopSequenceList
