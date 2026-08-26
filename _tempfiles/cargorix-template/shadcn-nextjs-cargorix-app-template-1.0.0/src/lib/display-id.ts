const DRAFT_SUFFIX = '-DRAFT'

export const stripDraftSuffix = (displayId: string): string =>
  displayId.endsWith(DRAFT_SUFFIX) ? displayId.slice(0, -DRAFT_SUFFIX.length) : displayId

export const toDraftDisplayId = (displayId: string): string => `${stripDraftSuffix(displayId)}${DRAFT_SUFFIX}`

export const nextDisplayId = (existing: string[], prefix: string, start: number): string => {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)

  const highest = existing.reduce((max, displayId) => {
    const match = stripDraftSuffix(displayId).match(pattern)

    return match ? Math.max(max, Number(match[1])) : max
  }, start - 1)

  return `${prefix}-${highest + 1}`
}
