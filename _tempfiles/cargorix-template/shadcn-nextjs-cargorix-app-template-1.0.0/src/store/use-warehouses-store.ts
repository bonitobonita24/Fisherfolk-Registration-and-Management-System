// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Warehouse, WarehouseStatus } from '@/types/entities/warehouse'

interface WarehousesState {
  warehouses: Warehouse[]

  initialize: (warehouses: Warehouse[]) => void
  getWarehouse: (id: string) => Warehouse | undefined
  createWarehouse: (warehouse: Warehouse) => void
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void
  setWarehouseStatus: (id: string, status: WarehouseStatus) => void
  deleteWarehouse: (id: string) => void
}

export const useWarehousesStore = create<WarehousesState>()((set, get) => ({
  warehouses: [],

  initialize: warehouses => {
    if (get().warehouses.length > 0) return
    set({ warehouses })
  },

  getWarehouse: id => get().warehouses.find(w => w.id === id),

  createWarehouse: warehouse =>
    set(state => {
      if (state.warehouses.some(w => w.id === warehouse.id)) return state

      return { warehouses: [warehouse, ...state.warehouses] }
    }),

  updateWarehouse: (id, updates) =>
    set(state => ({
      warehouses: state.warehouses.map(w => (w.id === id ? { ...w, ...updates } : w))
    })),

  setWarehouseStatus: (id, status) => get().updateWarehouse(id, { status }),

  deleteWarehouse: id => set(state => ({ warehouses: state.warehouses.filter(w => w.id !== id) }))
}))
