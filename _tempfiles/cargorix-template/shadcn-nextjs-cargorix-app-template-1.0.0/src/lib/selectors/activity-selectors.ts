// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { ExportTable } from '@/types'
import type { ActivityBounds, ActivityEvent, ActivityFilters, ActivityStats } from '@/types/pages/activity-log'

// Util Imports
import { ACTIVITY_RESULT_LABEL } from '@/types/pages/activity-log'

const dayKey = (value: string) => format(new Date(value), 'yyyy-MM-dd')

export const getActivityBounds = (events: ActivityEvent[]): ActivityBounds => {
  if (events.length === 0) {
    const fallback = new Date()

    return { first: fallback, last: fallback }
  }

  let first = Number.POSITIVE_INFINITY
  let last = 0

  for (const event of events) {
    const time = new Date(event.at).getTime()

    first = Math.min(first, time)
    last = Math.max(last, time)
  }

  return { first: new Date(first), last: new Date(last) }
}

export const getActivityStats = (events: ActivityEvent[], anchorDay: string): ActivityStats => {
  const moduleCounts = new Map<string, number>()

  let totalToday = 0
  let failedToday = 0

  for (const event of events) {
    moduleCounts.set(event.module, (moduleCounts.get(event.module) ?? 0) + 1)

    if (dayKey(event.at) !== anchorDay) continue

    totalToday++

    if (event.result === 'failed') failedToday++
  }

  let topModule = '—'
  let topCount = 0

  for (const [module, count] of moduleCounts) {
    if (count > topCount) {
      topCount = count
      topModule = module
    }
  }

  return { totalToday, failedToday, topModule }
}

export const filterActivityEvents = (events: ActivityEvent[], filters: ActivityFilters): ActivityEvent[] => {
  const search = filters.search.trim().toLowerCase()

  return events.filter(event => {
    if (filters.from || filters.to) {
      const day = dayKey(event.at)

      if (filters.from && day < filters.from) return false
      if (filters.to && day > filters.to) return false
    }

    if (!search) return true

    return [event.userName, event.action, event.module, event.record].join(' ').toLowerCase().includes(search)
  })
}

export const buildActivityExport = (events: ActivityEvent[]): ExportTable => ({
  headers: ['Date & Time', 'User', 'Action', 'Module', 'Record', 'Result'],
  rows: events.map(event => [
    format(new Date(event.at), 'MMM d, yyyy HH:mm'),
    event.userName,
    event.action,
    event.module,
    event.record,
    ACTIVITY_RESULT_LABEL[event.result]
  ])
})
