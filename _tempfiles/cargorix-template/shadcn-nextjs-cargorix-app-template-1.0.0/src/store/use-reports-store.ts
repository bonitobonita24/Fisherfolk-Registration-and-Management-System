// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { ServiceLevel } from '@/types/entities/order'
import type { VehicleType } from '@/types/entities/vehicle'
import type { ReportTab } from '@/types/pages/reports-types'

interface ReportsState {
  tab: ReportTab
  from: string | null
  to: string | null
  compare: boolean

  carrier: string
  serviceLevel: ServiceLevel | 'all'
  warehouseId: string
  vehicleType: VehicleType | 'all'

  setTab: (tab: ReportTab) => void
  setDateRange: (from: string | null, to: string | null) => void
  setCompare: (compare: boolean) => void
  setCarrier: (carrier: string) => void
  setServiceLevel: (serviceLevel: ServiceLevel | 'all') => void
  setWarehouseId: (warehouseId: string) => void
  setVehicleType: (vehicleType: VehicleType | 'all') => void
}

export const useReportsStore = create<ReportsState>()(set => ({
  tab: 'delivery',
  from: null,
  to: null,
  compare: false,

  carrier: 'all',
  serviceLevel: 'all',
  warehouseId: 'all',
  vehicleType: 'all',

  setTab: tab => set({ tab }),
  setDateRange: (from, to) => set({ from, to }),
  setCompare: compare => set({ compare }),
  setCarrier: carrier => set({ carrier }),
  setServiceLevel: serviceLevel => set({ serviceLevel }),
  setWarehouseId: warehouseId => set({ warehouseId }),
  setVehicleType: vehicleType => set({ vehicleType })
}))
