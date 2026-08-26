// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { Driver } from '@/types/entities/driver'

// Store Imports
import { useVehiclesStore } from '@/store/use-vehicles-store'

// Util Imports
import { toDriverAssignedVehicle } from '@/lib/selectors/drivers-selectors'

export type DriverFormPatch = Partial<
  Pick<
    Driver,
    | 'name'
    | 'initials'
    | 'avatarUrl'
    | 'firstName'
    | 'lastName'
    | 'dob'
    | 'gender'
    | 'nationality'
    | 'languages'
    | 'hireDate'
    | 'phone'
    | 'email'
    | 'address'
    | 'city'
    | 'state'
    | 'zip'
    | 'homeHubId'
    | 'shift'
    | 'shiftHours'
    | 'driverType'
    | 'homeTime'
    | 'payType'
    | 'operatingZone'
    | 'safetyScore'
    | 'employmentStatus'
    | 'licenseNumber'
    | 'licenseClass'
    | 'licenseState'
    | 'licenseExpiry'
    | 'endorsements'
    | 'medicalCardExpiry'
    | 'drugTestDue'
    | 'emergencyContact'
    | 'assignedVehicle'
    | 'documents'
  >
>

const buildEmptyDriver = (id: string): Driver => ({
  id,
  name: '',
  initials: '',
  status: 'offline',
  isDraft: true,
  employmentStatus: 'active',
  languages: [],
  endorsements: [],
  documents: [],
  tripHistory: [],
  activity: []
})

interface DriversState {
  drivers: Driver[]

  initialize: (drivers: Driver[]) => void
  getDriver: (id: string) => Driver | undefined
  updateDriver: (id: string, updates: Partial<Driver>) => void
  createDraftDriver: (id: string) => void
  saveDriverDraft: (id: string, patch: DriverFormPatch, nextId?: string) => string
  commitDriver: (id: string, patch: DriverFormPatch, nextId?: string) => string
  assignVehicle: (driverId: string, vehicleId?: string) => void
  deleteDriver: (id: string) => void
  releaseVehicleFrom: (driverId: string) => void
  refreshAssignedVehicles: () => void
}

export const useDriversStore = create<DriversState>()((set, get) => ({
  drivers: [],

  initialize: drivers => {
    if (get().drivers.length > 0) return
    set({ drivers })
  },

  getDriver: id => get().drivers.find(d => d.id === id),

  updateDriver: (id, updates) =>
    set(state => ({ drivers: state.drivers.map(d => (d.id === id ? { ...d, ...updates } : d)) })),

  createDraftDriver: id => {
    if (get().drivers.some(d => d.id === id)) return
    set(state => ({ drivers: [buildEmptyDriver(id), ...state.drivers] }))
  },

  saveDriverDraft: (id, patch, nextId) => {
    const finalId = nextId && !get().drivers.some(d => d.id === nextId && d.id !== id) ? nextId : id

    set(state => ({
      drivers: state.drivers.map(d => (d.id === id ? { ...d, ...patch, id: finalId, isDraft: true } : d))
    }))

    return finalId
  },

  commitDriver: (id, patch, nextId) => {
    const finalId = nextId && !get().drivers.some(d => d.id === nextId && d.id !== id) ? nextId : id

    if (finalId !== id) get().releaseVehicleFrom(id)

    set(state => ({
      drivers: state.drivers.map(d => (d.id === id ? { ...d, ...patch, id: finalId, isDraft: false } : d))
    }))

    return finalId
  },

  assignVehicle: (driverId, vehicleId) => {
    const vehiclesStore = useVehiclesStore.getState()
    const driver = get().getDriver(driverId)

    if (driver?.isDraft) return

    for (const vehicle of vehiclesStore.vehicles) {
      if (vehicle.isDraft) continue

      const shouldOwn = Boolean(vehicleId) && vehicle.id === vehicleId
      const currentlyOwns = vehicle.assignedDriverId === driverId

      if (shouldOwn && !currentlyOwns) vehiclesStore.updateVehicle(vehicle.id, { assignedDriverId: driverId })
      else if (!shouldOwn && currentlyOwns) vehiclesStore.updateVehicle(vehicle.id, { assignedDriverId: undefined })
    }

    get().refreshAssignedVehicles()
  },

  deleteDriver: id => {
    get().releaseVehicleFrom(id)
    set(state => ({ drivers: state.drivers.filter(d => d.id !== id) }))
  },

  releaseVehicleFrom: driverId => {
    const vehiclesStore = useVehiclesStore.getState()

    for (const vehicle of vehiclesStore.vehicles) {
      if (vehicle.assignedDriverId === driverId)
        vehiclesStore.updateVehicle(vehicle.id, { assignedDriverId: undefined })
    }
  },

  refreshAssignedVehicles: () => {
    const vehicles = useVehiclesStore.getState().vehicles

    set(state => ({
      drivers: state.drivers.map(driver => {
        const vehicle = vehicles.find(v => !v.isDraft && v.assignedDriverId === driver.id)
        const next = vehicle ? toDriverAssignedVehicle(vehicle) : undefined

        if (next?.vehicleId === driver.assignedVehicle?.vehicleId) return driver

        return { ...driver, assignedVehicle: next }
      })
    }))
  }
}))
