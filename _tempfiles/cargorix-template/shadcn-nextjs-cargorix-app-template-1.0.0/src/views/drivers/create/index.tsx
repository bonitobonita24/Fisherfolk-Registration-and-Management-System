'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type {
  Driver,
  DriverEmploymentStatus,
  DriverGender,
  DriverShift,
  DriverType,
  HomeTime,
  LicenseClass,
  PayType
} from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'
import type { DriverFormPatch } from '@/store/use-drivers-store'
import type { CreateDriverFormInput, CreateDriverFormValues } from './driver-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AddDriverView from './add/add-driver-view'
import EditDriverView from './edit/edit-driver-view'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { isDraftId } from '@/lib/is-draft-id'

// Data Imports
import { driverFormSchema } from './driver-form-schema'

const driverResolver = zodResolver as unknown as (
  schema: typeof driverFormSchema
) => Resolver<CreateDriverFormInput, unknown, CreateDriverFormValues>

const EMPTY_VALUES: CreateDriverFormInput = {
  driverId: '',
  avatarUrl: '',
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  nationality: '',
  languages: [],
  hireDate: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  licenseNumber: '',
  licenseClass: '',
  licenseState: '',
  licenseExpiry: '',
  endorsements: [],
  medicalCardExpiry: '',
  drugTestDue: '',
  homeHubId: '',
  assignedVehicleId: '',
  operatingZone: '',
  shift: '',
  driverType: '',
  homeTime: '',
  payType: '',
  employmentStatus: 'active',
  safetyScore: undefined,
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  emergencyAltPhone: '',
  notes: ''
}

const toDateOnly = (value?: string) => (value ? value.slice(0, 10) : '')

const mapDriverToForm = (driver: Driver): CreateDriverFormInput => ({
  driverId: driver.id,
  avatarUrl: driver.avatarUrl ?? '',
  firstName: driver.firstName ?? '',
  lastName: driver.lastName ?? '',
  dob: driver.dob ?? '',
  gender: driver.gender ?? '',
  nationality: driver.nationality ?? '',
  languages: driver.languages ?? [],
  hireDate: driver.hireDate ?? '',
  phone: driver.phone ?? '',
  email: driver.email ?? '',
  address: driver.address ?? '',
  city: driver.city ?? '',
  state: driver.state ?? '',
  zip: driver.zip ?? '',
  licenseNumber: driver.licenseNumber ?? '',
  licenseClass: driver.licenseClass ?? '',
  licenseState: driver.licenseState ?? '',
  licenseExpiry: driver.licenseExpiry ?? '',
  endorsements: driver.endorsements ?? [],
  medicalCardExpiry: driver.medicalCardExpiry ?? '',
  drugTestDue: driver.drugTestDue ?? '',
  homeHubId: driver.homeHubId ?? '',
  assignedVehicleId: driver.assignedVehicle?.vehicleId ?? '',
  operatingZone: driver.operatingZone ?? '',
  shift: driver.shift ?? '',
  driverType: driver.driverType ?? '',
  homeTime: driver.homeTime ?? '',
  payType: driver.payType ?? '',
  employmentStatus: driver.employmentStatus ?? 'active',
  safetyScore: driver.safetyScore,
  emergencyName: driver.emergencyContact?.name ?? '',
  emergencyRelationship: driver.emergencyContact?.relationship ?? '',
  emergencyPhone: driver.emergencyContact?.phone ?? '',
  emergencyAltPhone: driver.emergencyContact?.altPhone ?? '',
  notes: driver.notes ?? ''
})

const mapFormToPatch = (values: CreateDriverFormValues | CreateDriverFormInput): DriverFormPatch => {
  const name = `${values.firstName ?? ''} ${values.lastName ?? ''}`.trim()
  const initials = `${values.firstName?.[0] ?? ''}${values.lastName?.[0] ?? ''}`.toUpperCase()

  return {
    name,
    initials,
    avatarUrl: values.avatarUrl || undefined,
    firstName: values.firstName,
    lastName: values.lastName,
    dob: toDateOnly(values.dob),
    gender: values.gender ? (values.gender as DriverGender) : undefined,
    nationality: values.nationality || undefined,
    languages: values.languages ?? [],
    hireDate: toDateOnly(values.hireDate) || undefined,
    phone: values.phone,
    email: values.email,
    address: values.address,
    city: values.city,
    state: values.state,
    zip: values.zip || undefined,
    homeHubId: values.homeHubId,
    shift: values.shift ? (values.shift as DriverShift) : undefined,
    shiftHours: values.shift === 'night' ? '6 PM – 6 AM' : values.shift === 'day' ? '6 AM – 6 PM' : undefined,
    driverType: values.driverType ? (values.driverType as DriverType) : undefined,
    homeTime: values.homeTime ? (values.homeTime as HomeTime) : undefined,
    payType: values.payType ? (values.payType as PayType) : undefined,
    operatingZone: values.operatingZone || undefined,
    safetyScore: values.safetyScore ? Number(values.safetyScore) : undefined,
    employmentStatus: values.employmentStatus ? (values.employmentStatus as DriverEmploymentStatus) : undefined,
    licenseNumber: values.licenseNumber,
    licenseClass: values.licenseClass ? (values.licenseClass as LicenseClass) : undefined,
    licenseState: values.licenseState || undefined,
    licenseExpiry: toDateOnly(values.licenseExpiry) || undefined,
    endorsements: values.endorsements ?? [],
    medicalCardExpiry: toDateOnly(values.medicalCardExpiry) || undefined,
    drugTestDue: toDateOnly(values.drugTestDue) || undefined,
    emergencyContact: {
      name: values.emergencyName ?? '',
      relationship: values.emergencyRelationship ?? '',
      phone: values.emergencyPhone ?? '',
      altPhone: values.emergencyAltPhone || undefined
    }
  }
}

// Props
type CreateDriverViewProps = {
  driverId: string
  drivers: Driver[]
  vehicles: Vehicle[]
  warehouses: Warehouse[]
}

const CreateDriverView = ({ driverId, drivers, vehicles, warehouses }: CreateDriverViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeDrivers = useDriversStore(state => state.initialize)
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const createDraftDriver = useDriversStore(state => state.createDraftDriver)
  const saveDriverDraft = useDriversStore(state => state.saveDriverDraft)
  const commitDriver = useDriversStore(state => state.commitDriver)
  const updateDriver = useDriversStore(state => state.updateDriver)
  const assignVehicle = useDriversStore(state => state.assignVehicle)
  const driver = useDriversStore(state => state.getDriver(driverId))
  const storeVehicles = useVehiclesStore(state => state.vehicles)
  const storeDrivers = useDriversStore(state => state.drivers)
  const storeWarehouses = useWarehousesStore(state => state.warehouses)

  // Vars
  const isNew = Boolean(driver?.isDraft)
  const selectableVehicles = storeVehicles.filter(vehicle => !vehicle.isDraft)
  const hubOptions = storeWarehouses.length > 0 ? storeWarehouses : warehouses

  const form = useForm<CreateDriverFormInput, unknown, CreateDriverFormValues>({
    resolver: driverResolver(driverFormSchema),
    defaultValues: EMPTY_VALUES
  })

  const handleSaveDraft = () => {
    const values = form.getValues()
    const requestedId = values.driverId.trim().toUpperCase()

    if (requestedId && useDriversStore.getState().drivers.some(d => d.id === requestedId && d.id !== driverId)) {
      form.setError('driverId', { message: 'That driver ID is already in use' })

      return
    }

    saveDriverDraft(driverId, mapFormToPatch(values), requestedId)
    router.push('/drivers')
  }

  const handleAdd = form.handleSubmit(values => {
    const requestedId = values.driverId.trim().toUpperCase()

    if (useDriversStore.getState().drivers.some(d => d.id === requestedId && d.id !== driverId)) {
      form.setError('driverId', { message: 'That driver ID is already in use' })

      return
    }

    const finalId = commitDriver(driverId, mapFormToPatch(values), requestedId)

    assignVehicle(finalId, values.assignedVehicleId || undefined)
    router.push(`/drivers/${finalId}`)
  })

  const handleSaveChanges = form.handleSubmit(values => {
    updateDriver(driverId, mapFormToPatch(values))
    assignVehicle(driverId, values.assignedVehicleId || undefined)
    router.push(`/drivers/${driverId}`)
  })

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    createDraftDriver(driverId)
  }, [createDraftDriver, driverId])

  useEffect(() => {
    if (driver) form.reset({ ...mapDriverToForm(driver), driverId: isDraftId(driver.id) ? '' : driver.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/drivers' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to drivers
      </Button>

      {isNew ? (
        <AddDriverView
          control={form.control}
          vehicles={selectableVehicles}
          drivers={storeDrivers}
          warehouses={hubOptions}
          onSaveDraft={handleSaveDraft}
          onAdd={handleAdd}
        />
      ) : driver ? (
        <EditDriverView
          control={form.control}
          driver={driver}
          vehicles={selectableVehicles}
          drivers={storeDrivers}
          warehouses={hubOptions}
          onSaveChanges={handleSaveChanges}
        />
      ) : null}
    </div>
  )
}

export default CreateDriverView
