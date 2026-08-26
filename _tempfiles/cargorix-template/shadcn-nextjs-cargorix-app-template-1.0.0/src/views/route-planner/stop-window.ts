// Third-party Imports
import { format, isSameDay } from 'date-fns'

export const formatStopWindow = (start: string, end: string, forceDate = false) => {
  const from = new Date(start)
  const to = new Date(end)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '—'

  return isSameDay(from, to) && !forceDate
    ? `${format(from, 'HH:mm')} – ${format(to, 'HH:mm')}`
    : `${format(from, 'd MMM · HH:mm')} – ${format(to, 'd MMM · HH:mm')}`
}

export const spansMultipleDays = (starts: string[]) => {
  const days = new Set(starts.map(start => start.slice(0, 10)).filter(Boolean))

  return days.size > 1
}
