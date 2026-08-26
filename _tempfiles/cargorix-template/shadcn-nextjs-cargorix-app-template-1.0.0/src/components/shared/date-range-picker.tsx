'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { addYears, format, subMonths, subYears } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange, Matcher } from 'react-day-picker'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Props
type DateRangePickerProps = {
  id: string

  from: Date
  to: Date
  min?: Date
  max?: Date
  onChange: (from: string, to: string) => void
}

// Vars
const DROPDOWN_SPAN_YEARS = 10

const DateRangePicker = ({ id, from, to, min, max, onChange }: DateRangePickerProps) => {
  // States
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>({ from, to })
  const [picking, setPicking] = useState(false)

  // Vars
  const label = `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`
  const startMonth = min ?? subYears(max ?? to, DROPDOWN_SPAN_YEARS)
  const endMonth = max ?? addYears(min ?? to, DROPDOWN_SPAN_YEARS)
  const disabledDays: Matcher[] = [...(min ? [{ before: min }] : []), ...(max ? [{ after: max }] : [])]

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft({ from, to })
      setPicking(false)
    }

    setOpen(next)
  }

  const handleSelect = (range: DateRange | undefined, day: Date) => {
    if (!picking) {
      setPicking(true)
      setDraft({ from: day, to: undefined })

      return
    }

    setDraft(range)

    if (range?.from && range.to) {
      onChange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<Button id={id} type='button' variant='outline' className='mt-1 w-full justify-between font-normal' />}
      >
        <span className='truncate'>{label}</span>
        <CalendarIcon className='size-4 opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto gap-0 p-0'>
        <Calendar
          mode='range'
          selected={draft}
          onSelect={handleSelect}
          defaultMonth={subMonths(to, 1)}
          numberOfMonths={2}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DateRangePicker
