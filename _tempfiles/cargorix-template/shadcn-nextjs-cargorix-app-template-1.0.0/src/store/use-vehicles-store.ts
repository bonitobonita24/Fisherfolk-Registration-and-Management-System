// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Vehicle } from '@/types/entities/vehicle'

export type VehicleFormPatch = Partial<
  Pick<
    Vehicle,
    | 'type'
    | 'label'
    | 'registrationNo'
    | 'make'
    | 'model'
    | 'year'
    | 'name'
    | 'vin'
    | 'engineNo'
    | 'fuelType'
    | 'operationalStatus'
    | 'homeWarehouseId'
    | 'assignedDriverId'
    | 'odometerKm'
    | 'capacityTons'
    | 'cargoVolumeM3'
    | 'palletCapacity'
    | 'refrigerated'
    | 'tempRangeC'
    | 'fuelTankCapacityL'
    | 'transmission'
    | 'emissionStandard'
    | 'dimensions'
    | 'seatingCapacity'
    | 'axleConfig'
    | 'defaultRegion'
    | 'operatingZone'
    | 'defaultRouteType'
    | 'workingHours'
    | 'insuranceProvider'
    | 'insurancePolicyNo'
    | 'complianceDocs'
  >
>

const buildEmptyVehicle = (id: string): Vehicle => ({
  id,
  type: 'van',
  label: 'Van',
  capacityTons: 0,
  trackingStatus: 'idle',
  lat: 0,
  lng: 0,
  path: [],
  stops: [],
  stopsCompleted: 0,
  stopsTotal: 0,
  isDraft: true,
  operationalStatus: 'draft',
  registrationNo: '',
  make: '',
  model: '',
  odometerKm: 0,
  homeWarehouseId: '',
  assignedDriverId: '',
  refrigerated: false,
  complianceDocs: [],
  maintenanceHistory: [],
  activity: []
})

interface VehiclesState {
  vehicles: Vehicle[]

  initialize: (vehicles: Vehicle[]) => void
  getVehicle: (id: string) => Vehicle | undefined
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  createDraftVehicle: (id: string) => void
  saveVehicleDraft: (id: string, patch: VehicleFormPatch, nextId?: string) => string
  commitVehicle: (id: string, patch: VehicleFormPatch, nextId?: string) => string
}

export const useVehiclesStore = create<VehiclesState>()((set, get) => ({
  vehicles: [],

  initialize: vehicles => {
    if (get().vehicles.length > 0) return
    set({ vehicles })
  },

  getVehicle: id => get().vehicles.find(v => v.id === id),

  updateVehicle: (id, updates) =>
    set(state => ({ vehicles: state.vehicles.map(v => (v.id === id ? { ...v, ...updates } : v)) })),

  createDraftVehicle: id => {
    if (get().vehicles.some(v => v.id === id)) return
    set(state => ({ vehicles: [buildEmptyVehicle(id), ...state.vehicles] }))
  },

  saveVehicleDraft: (id, patch, nextId) => {
    const finalId = nextId && !get().vehicles.some(v => v.id === nextId && v.id !== id) ? nextId : id

    set(state => ({
      vehicles: state.vehicles.map(v =>
        v.id === id ? { ...v, ...patch, id: finalId, assignedDriverId: undefined, isDraft: true } : v
      )
    }))

    return finalId
  },

  commitVehicle: (id, patch, nextId) => {
    const finalId = nextId && !get().vehicles.some(v => v.id === nextId && v.id !== id) ? nextId : id

    set(state => ({
      vehicles: state.vehicles.map(v =>
        v.id === id
          ? {
              ...v,
              ...patch,
              id: finalId,
              isDraft: false,
              operationalStatus: patch.operationalStatus ?? 'available'
            }
          : v
      )
    }))

    return finalId
  }
}))
