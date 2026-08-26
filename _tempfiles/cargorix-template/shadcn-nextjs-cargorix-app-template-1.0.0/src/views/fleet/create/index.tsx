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

import type { Driver } from '@/types/entities/driver'
import type {
  ComplianceDoc,
  ComplianceDocType,
  FuelType,
  Transmission,
  Vehicle,
  VehicleOperationalStatus,
  VehicleType
} from '@/types/entities/vehicle'
import type { Warehouse } from '@/types/entities/warehouse'
import type { VehicleFormPatch } from '@/store/use-vehicles-store'
import type { CreateVehicleFormInput, CreateVehicleFormValues } from './vehicle-form-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AddVehicleView from './add/add-vehicle-view'
import EditVehicleView from './edit/edit-vehicle-view'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { isDraftId } from '@/lib/is-draft-id'
import { VEHICLE_TYPE_LABEL } from '../vehicle-badges'

// Data Imports
import { vehicleFormSchema } from './vehicle-form-schema'

const vehicleResolver = zodResolver as unknown as (
  schema: typeof vehicleFormSchema
) => Resolver<CreateVehicleFormInput, unknown, CreateVehicleFormValues>

const EMPTY_VALUES: CreateVehicleFormInput = {
  vehicleId: '',
  type: '',
  registrationNo: '',
  make: '',
  model: '',
  year: '' as unknown as number,
  name: '',
  vin: '',
  engineNo: '',
  fuelType: '',
  operationalStatus: '',
  homeWarehouseId: '',
  assignedDriverId: '',
  capacityKg: '' as unknown as number,
  cargoVolumeM3: '' as unknown as number,
  palletCapacity: '' as unknown as number,
  refrigerated: false,
  tempRangeC: '',
  fuelTankCapacityL: '' as unknown as number,
  transmission: '',
  emissionStandard: '',
  dimensions: '',
  odometerKm: '' as unknown as number,
  seatingCapacity: '' as unknown as number,
  axleConfig: '',
  defaultRegion: '',
  operatingZone: '',
  defaultRouteType: '',
  workingHours: '',
  insuranceProvider: '',
  insurancePolicyNo: '',
  insuranceExpiry: '',
  registrationExpiry: '',
  inspectionExpiry: '',
  inspectionCertNumber: '',
  emissionsCertNumber: '',
  emissionsExpiry: '',
  permitExpiry: '',
  permitNumber: ''
}

const mapVehicleToForm = (vehicle: Vehicle): CreateVehicleFormInput => {
  const insurance = vehicle.complianceDocs?.find(doc => doc.type === 'insurance')
  const registration = vehicle.complianceDocs?.find(doc => doc.type === 'registration')
  const inspection = vehicle.complianceDocs?.find(doc => doc.type === 'inspection')
  const permit = vehicle.complianceDocs?.find(doc => doc.type === 'permit')
  const emissions = vehicle.complianceDocs?.find(doc => doc.type === 'emissions')

  return {
    vehicleId: vehicle.id,
    type: vehicle.type ?? '',
    registrationNo: vehicle.registrationNo ?? '',
    make: vehicle.make ?? '',
    model: vehicle.model ?? '',
    year: vehicle.year ?? ('' as unknown as number),
    name: vehicle.name ?? '',
    vin: vehicle.vin ?? '',
    engineNo: vehicle.engineNo ?? '',
    fuelType: vehicle.fuelType ?? '',
    operationalStatus:
      vehicle.operationalStatus && vehicle.operationalStatus !== 'draft' ? vehicle.operationalStatus : '',
    homeWarehouseId: vehicle.homeWarehouseId ?? '',
    assignedDriverId: vehicle.assignedDriverId ?? '',
    capacityKg: vehicle.capacityTons ? Math.round(vehicle.capacityTons * 1000) : ('' as unknown as number),
    cargoVolumeM3: vehicle.cargoVolumeM3 ?? ('' as unknown as number),
    palletCapacity: vehicle.palletCapacity ?? ('' as unknown as number),
    refrigerated: vehicle.refrigerated ?? false,
    tempRangeC: vehicle.tempRangeC ?? '',
    fuelTankCapacityL: vehicle.fuelTankCapacityL ?? ('' as unknown as number),
    transmission: vehicle.transmission ?? '',
    emissionStandard: vehicle.emissionStandard ?? '',
    dimensions: vehicle.dimensions ?? '',
    odometerKm: vehicle.odometerKm ?? ('' as unknown as number),
    seatingCapacity: vehicle.seatingCapacity ?? ('' as unknown as number),
    axleConfig: vehicle.axleConfig ?? '',
    defaultRegion: vehicle.defaultRegion ?? '',
    operatingZone: vehicle.operatingZone ?? '',
    defaultRouteType: vehicle.defaultRouteType ?? '',
    workingHours: vehicle.workingHours ?? '',
    insuranceProvider: vehicle.insuranceProvider ?? '',
    insurancePolicyNo: vehicle.insurancePolicyNo ?? insurance?.number ?? '',
    insuranceExpiry: insurance?.expiry ?? '',
    registrationExpiry: registration?.expiry ?? '',
    inspectionExpiry: inspection?.expiry ?? '',
    inspectionCertNumber: inspection?.number ?? '',
    emissionsCertNumber: emissions?.number ?? '',
    emissionsExpiry: emissions?.expiry ?? '',
    permitExpiry: permit?.expiry ?? '',
    permitNumber: permit?.number ?? ''
  }
}

const toDateOnly = (value?: string) => (value ? value.slice(0, 10) : '')

const buildComplianceDocs = (
  values: CreateVehicleFormValues | CreateVehicleFormInput,
  existing: ComplianceDoc[] = []
): ComplianceDoc[] => {
  const docs: ComplianceDoc[] = []
  const prior = (type: ComplianceDocType) => existing.find(doc => doc.type === type)

  const push = (type: ComplianceDocType, number: string | undefined, expiry: string) => {
    const before = prior(type)

    docs.push({
      type,
      number: number || before?.number || '',
      issuedOn: before?.issuedOn ?? '',
      expiry
    })
  }

  if (values.insuranceExpiry) {
    push('insurance', prior('insurance')?.number || values.insurancePolicyNo, toDateOnly(values.insuranceExpiry))
  }

  if (values.registrationExpiry) push('registration', undefined, toDateOnly(values.registrationExpiry))
  if (values.inspectionExpiry) push('inspection', values.inspectionCertNumber, toDateOnly(values.inspectionExpiry))
  if (values.permitNumber) push('permit', values.permitNumber, toDateOnly(values.permitExpiry))
  if (values.emissionsExpiry) push('emissions', values.emissionsCertNumber, toDateOnly(values.emissionsExpiry))

  return docs
}

const mapFormToPatch = (
  values: CreateVehicleFormValues | CreateVehicleFormInput,
  existingDocs: ComplianceDoc[] = []
): VehicleFormPatch => {
  const type = (values.type as VehicleType) || 'van'
  const capacityKg = Number(values.capacityKg) || 0

  return {
    type,
    label: VEHICLE_TYPE_LABEL[type],
    registrationNo: values.registrationNo ?? '',
    make: values.make ?? '',
    model: values.model ?? '',
    year: Number(values.year) || undefined,
    name: values.name || undefined,
    vin: values.vin || undefined,
    engineNo: values.engineNo || undefined,
    fuelType: (values.fuelType as FuelType) || undefined,
    operationalStatus: (values.operationalStatus as VehicleOperationalStatus) || 'available',
    homeWarehouseId: values.homeWarehouseId ?? '',
    assignedDriverId: values.assignedDriverId || undefined,
    odometerKm: Number(values.odometerKm) || undefined,
    capacityTons: capacityKg / 1000,
    cargoVolumeM3: Number(values.cargoVolumeM3) || undefined,
    palletCapacity: Number(values.palletCapacity) || undefined,
    refrigerated: Boolean(values.refrigerated),
    tempRangeC: values.tempRangeC || undefined,
    fuelTankCapacityL: Number(values.fuelTankCapacityL) || undefined,
    transmission: (values.transmission as Transmission) || undefined,
    emissionStandard: values.emissionStandard || undefined,
    dimensions: values.dimensions || undefined,
    seatingCapacity: Number(values.seatingCapacity) || undefined,
    axleConfig: values.axleConfig || undefined,
    defaultRegion: values.defaultRegion || undefined,
    operatingZone: values.operatingZone || undefined,
    defaultRouteType: values.defaultRouteType || undefined,
    workingHours: values.workingHours || undefined,
    insuranceProvider: values.insuranceProvider || undefined,
    insurancePolicyNo: values.insurancePolicyNo || undefined,
    complianceDocs: buildComplianceDocs(values, existingDocs)
  }
}

// Props
type CreateVehicleViewProps = {
  vehicleId: string
  vehicles: Vehicle[]
  warehouses: Warehouse[]
  drivers: Driver[]
}

const CreateVehicleView = ({ vehicleId, vehicles, warehouses, drivers }: CreateVehicleViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const createDraftVehicle = useVehiclesStore(state => state.createDraftVehicle)
  const saveVehicleDraft = useVehiclesStore(state => state.saveVehicleDraft)
  const commitVehicle = useVehiclesStore(state => state.commitVehicle)
  const updateVehicle = useVehiclesStore(state => state.updateVehicle)
  const vehicle = useVehiclesStore(state => state.getVehicle(vehicleId))
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const storeDrivers = useDriversStore(state => state.drivers)
  const assignVehicle = useDriversStore(state => state.assignVehicle)
  const refreshAssignedVehicles = useDriversStore(state => state.refreshAssignedVehicles)

  // Vars
  const isNew = Boolean(vehicle?.isDraft)
  const selectableDrivers = storeDrivers.filter(driver => !driver.isDraft)

  const form = useForm<CreateVehicleFormInput, unknown, CreateVehicleFormValues>({
    resolver: vehicleResolver(vehicleFormSchema),
    defaultValues: EMPTY_VALUES
  })

  const syncDriverAssignment = (driverId: string | undefined, targetVehicleId: string) => {
    if (driverId) assignVehicle(driverId, targetVehicleId)
    else refreshAssignedVehicles()
  }

  const handleSaveDraft = () => {
    const values = form.getValues()
    const requestedId = values.vehicleId.trim().toUpperCase()

    if (requestedId && useVehiclesStore.getState().vehicles.some(v => v.id === requestedId && v.id !== vehicleId)) {
      form.setError('vehicleId', { message: 'That vehicle ID is already in use' })

      return
    }

    saveVehicleDraft(vehicleId, mapFormToPatch(values, vehicle?.complianceDocs), requestedId)
    router.push('/fleet')
  }

  const handleAdd = form.handleSubmit(values => {
    const requestedId = values.vehicleId.trim().toUpperCase()

    if (useVehiclesStore.getState().vehicles.some(v => v.id === requestedId && v.id !== vehicleId)) {
      form.setError('vehicleId', { message: 'That vehicle ID is already in use' })

      return
    }

    const finalId = commitVehicle(vehicleId, mapFormToPatch(values, vehicle?.complianceDocs), requestedId)

    syncDriverAssignment(values.assignedDriverId, finalId)
    router.push(`/fleet/${finalId}`)
  })

  const handleSaveChanges = form.handleSubmit(values => {
    updateVehicle(vehicleId, mapFormToPatch(values, vehicle?.complianceDocs))
    syncDriverAssignment(values.assignedDriverId, vehicleId)
    router.push(`/fleet/${vehicleId}`)
  })

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  useEffect(() => {
    createDraftVehicle(vehicleId)
  }, [createDraftVehicle, vehicleId])

  useEffect(() => {
    if (vehicle) form.reset({ ...mapVehicleToForm(vehicle), vehicleId: isDraftId(vehicle.id) ? '' : vehicle.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/fleet' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to fleet
      </Button>

      {isNew ? (
        <AddVehicleView
          control={form.control}
          warehouses={storeWarehouses}
          drivers={selectableDrivers}
          onSaveDraft={handleSaveDraft}
          onAdd={handleAdd}
        />
      ) : vehicle ? (
        <EditVehicleView
          control={form.control}
          vehicle={vehicle}
          warehouses={storeWarehouses}
          drivers={selectableDrivers}
          onSaveChanges={handleSaveChanges}
        />
      ) : null}
    </div>
  )
}

export default CreateVehicleView
