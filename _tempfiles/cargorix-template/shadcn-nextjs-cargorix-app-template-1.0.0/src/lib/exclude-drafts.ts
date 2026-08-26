type MaybeDraft = { isDraft?: boolean; status?: string }

export const excludeDrafts = <T extends MaybeDraft>(list: T[]): T[] =>
  list.filter(item => item.isDraft !== true && item.status !== 'draft')

// Drops only wizard records that were never saved. Domains where `draft` is a real workflow
// status (transfers, adjustments, purchase orders, shipments) must use this, not excludeDrafts.
export const excludeUnsavedDrafts = <T extends { isDraft?: boolean }>(list: T[]): T[] =>
  list.filter(item => item.isDraft !== true)
