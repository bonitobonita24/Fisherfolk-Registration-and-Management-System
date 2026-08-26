'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { CalendarPlusIcon } from 'lucide-react'
import { toast } from 'sonner'

// Type Imports
import type { DockDirection } from '@/types/entities/warehouse'

// Component Imports
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Props
type ScheduleDockButtonProps = {
  warehouseName?: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'default' | 'sm'
  className?: string
}

const DIRECTION_ITEMS: { label: string; value: DockDirection }[] = [
  { label: 'Inbound', value: 'inbound' },
  { label: 'Outbound', value: 'outbound' }
]

const ScheduleDockButton = ({
  warehouseName,
  variant = 'outline',
  size = 'default',
  className
}: ScheduleDockButtonProps) => {
  // States
  const [open, setOpen] = useState(false)
  const [direction, setDirection] = useState<DockDirection>('inbound')
  const [dock, setDock] = useState('')
  const [reference, setReference] = useState('')
  const [carrier, setCarrier] = useState('')
  const [window, setWindow] = useState('')

  const reset = () => {
    setDirection('inbound')
    setDock('')
    setReference('')
    setCarrier('')
    setWindow('')
  }

  const handleSchedule = () => {
    if (!dock.trim() || !carrier.trim()) {
      toast.error('Add a dock and carrier to schedule the appointment.')

      return
    }

    toast.success(`Dock appointment scheduled${warehouseName ? ` at ${warehouseName}` : ''}.`)
    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size={size} className={className} />}>
        <CalendarPlusIcon data-icon='inline-start' />
        Schedule dock
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Schedule dock</DialogTitle>
          <DialogDescription>Reserve a dock window for an inbound or outbound load.</DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='dock-direction'>Direction</Label>
            <Select
              items={DIRECTION_ITEMS}
              value={direction}
              onValueChange={value => setDirection(value as DockDirection)}
            >
              <SelectTrigger id='dock-direction' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className='w-auto max-w-(--available-width) min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {DIRECTION_ITEMS.map(item => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='dock-number'>Dock</Label>
              <Input id='dock-number' value={dock} onChange={e => setDock(e.target.value)} placeholder='Dock 3' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='dock-window'>Window</Label>
              <Input
                id='dock-window'
                value={window}
                onChange={e => setWindow(e.target.value)}
                placeholder='09:00 – 10:00'
              />
            </div>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='dock-reference'>Reference</Label>
              <Input
                id='dock-reference'
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder='PO-6021'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='dock-carrier'>Carrier</Label>
              <Input
                id='dock-carrier'
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                placeholder='DHL Logistics'
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant='outline' />}>Cancel</DialogClose>
          <Button onClick={handleSchedule}>Schedule dock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleDockButton
