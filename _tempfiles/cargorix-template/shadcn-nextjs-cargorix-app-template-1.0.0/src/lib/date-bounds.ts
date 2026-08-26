// Third-party Imports
import { format } from 'date-fns'

export const DOB_MIN_DATE = '1950-01-01'
export const MIN_DRIVING_AGE = 18

export const toDateOnly = (value?: string) => (value ? value.slice(0, 10) || undefined : undefined)

export const toDate = (value?: string) => (value ? new Date(`${toDateOnly(value)}T00:00:00`) : undefined)

export const todayDate = () => format(new Date(), 'yyyy-MM-dd')

export const dobMaxDate = () => `${new Date().getFullYear() - MIN_DRIVING_AGE}-12-31`

const compare = (keepLater: boolean, values: (string | undefined)[]) => {
  const dates = values.map(toDateOnly).filter((value): value is string => Boolean(value))

  if (!dates.length) return undefined

  return dates.reduce((acc, value) => (value > acc === keepLater ? value : acc))
}

export const laterOf = (...values: (string | undefined)[]) => compare(true, values)

export const earlierOf = (...values: (string | undefined)[]) => compare(false, values)

export const isBeforeDate = (value?: string, floor?: string) => {
  const left = toDateOnly(value)
  const right = toDateOnly(floor)

  return Boolean(left && right) && left! < right!
}
