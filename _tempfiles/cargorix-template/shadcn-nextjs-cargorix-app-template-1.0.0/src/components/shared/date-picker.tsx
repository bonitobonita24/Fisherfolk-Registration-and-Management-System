'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { addYears, format, isValid, subYears } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Util Imports
import { earlierOf, laterOf, toDate, toDateOnly, todayDate } from '@/lib/date-bounds'
import { cn } from '@/lib/utils'

// Props
type DatePickerProps = {
  id: string

  value?: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
}

// Vars
const DEFAULT_TIME = '09:00'
const DROPDOWN_SPAN_YEARS = 10

const parseValue = (value?: string) => {
  if (!value) return undefined

  const parsed = new Date(value)

  return isValid(parsed) ? parsed : undefined
}

const DatePicker = ({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'Select a date',
  invalid,
  disabled,
  className
}: DatePickerProps) => {
  // States
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState<string | null>(null)

  // Vars
  const selected = parseValue(value)
  const minDate = min ? earlierOf(min, loaded ?? undefined) : undefined
  const maxDate = max ? laterOf(max, loaded ?? undefined) : undefined
  const startMonth = toDate(minDate) ?? subYears(toDate(maxDate) ?? new Date(), DROPDOWN_SPAN_YEARS)
  const endMonth = toDate(maxDate) ?? addYears(toDate(minDate) ?? new Date(), DROPDOWN_SPAN_YEARS)
  const focusDate = toDate(laterOf(earlierOf(todayDate(), maxDate), minDate))

  const disabledDays = [
    ...(minDate ? [{ before: toDate(minDate)! }] : []),
    ...(maxDate ? [{ after: toDate(maxDate)! }] : [])
  ]

  const handleSelect = (date: Date | undefined) => {
    if (!date) return

    const time = selected ? format(selected, 'HH:mm') : DEFAULT_TIME

    onChange(`${format(date, 'yyyy-MM-dd')}T${time}`)
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (next && loaded === null) setLoaded(toDateOnly(value) ?? '')

    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type='button'
            variant='outline'
            aria-invalid={invalid}
            disabled={disabled}
            className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
          />
        }
      >
        {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        <CalendarIcon className='size-4 opacity-60' />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto gap-0 p-0'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected ?? focusDate}
          captionLayout='dropdown'
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
