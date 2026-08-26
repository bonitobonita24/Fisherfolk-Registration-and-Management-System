const LOCALE = 'en-US'

export const formatCurrency = (value: number): string =>
  `$${Math.round(value).toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`

export const formatCompactCurrency = (value: number): string =>
  value >= 1000 ? `$${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k` : `$${Math.round(value)}`

export const formatNumber = (value: number): string => value.toLocaleString(LOCALE)

export const formatPercent = (value: number, digits = 1): string => `${value.toFixed(digits)}%`
