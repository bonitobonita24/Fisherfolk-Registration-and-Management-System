// Third-party Imports
import { create } from 'zustand'

const DEFAULT_PINNED_PRODUCT_IDS = ['prod-018', 'prod-001', 'prod-019']

interface ProductsTableState {
  pinnedProductIds: string[]

  pinProduct: (id: string) => void
  unpinProduct: (id: string) => void
  unpinAll: () => void
}

export const useProductsTableStore = create<ProductsTableState>()(set => ({
  pinnedProductIds: DEFAULT_PINNED_PRODUCT_IDS,

  pinProduct: id =>
    set(state => (state.pinnedProductIds.includes(id) ? state : { pinnedProductIds: [...state.pinnedProductIds, id] })),

  unpinProduct: id => set(state => ({ pinnedProductIds: state.pinnedProductIds.filter(pid => pid !== id) })),

  unpinAll: () => set({ pinnedProductIds: [] })
}))
