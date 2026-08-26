'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Vehicle } from '@/types/entities/vehicle'

// Component Imports
import FleetList from './fleet-list'
import FleetMap from './fleet-map'
import LiveMapHeader from './live-map-header'
import LiveMapKpiCards from './live-map-kpi-cards'
import VehicleDetailBar from './vehicle-detail-bar'

// Store Imports
import { useDriversStore } from '@/store/use-drivers-store'
import { useVehiclesStore } from '@/store/use-vehicles-store'

type LiveMapViewProps = {
  vehicles: Vehicle[]
  drivers: Driver[]
  selectedVehicleId?: string
}

const LiveMapView = ({ vehicles, drivers, selectedVehicleId }: LiveMapViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeVehicles = useVehiclesStore(state => state.initialize)
  const initializeDrivers = useDriversStore(state => state.initialize)
  const storeVehicles = useVehiclesStore(state => state.vehicles)
  const storeDrivers = useDriversStore(state => state.drivers)

  useEffect(() => {
    initializeVehicles(vehicles)
  }, [initializeVehicles, vehicles])

  useEffect(() => {
    initializeDrivers(drivers)
  }, [initializeDrivers, drivers])

  // Vars
  const listVehicles = (storeVehicles.length > 0 ? storeVehicles : vehicles).filter(v => !v.isDraft)
  const listDrivers = (storeDrivers.length > 0 ? storeDrivers : drivers).filter(d => !d.isDraft)
  const activeId = selectedVehicleId ?? listVehicles[0]?.id

  useEffect(() => {
    if (!selectedVehicleId && activeId) router.replace(`/live-map/${activeId}`)
  }, [router, selectedVehicleId, activeId])

  const selectedVehicle = listVehicles.find(v => v.id === activeId)

  const selectedDriver = listDrivers.find(d => d.id === selectedVehicle?.assignedDriverId)

  return (
    <div className='space-y-6'>
      <LiveMapHeader />
      <LiveMapKpiCards vehicles={listVehicles} />
      {selectedVehicle && <VehicleDetailBar vehicle={selectedVehicle} driver={selectedDriver} />}
      <div className='grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]'>
        <div className='relative max-md:h-[70svh]'>
          <FleetList vehicles={listVehicles} drivers={listDrivers} selectedVehicleId={activeId} />
        </div>
        <FleetMap
          vehicles={listVehicles}
          selectedVehicleId={activeId}
          onSelectVehicle={id => router.push(`/live-map/${id}`)}
          height={702}
          className='overflow-hidden rounded-2xl border'
        />
      </div>
    </div>
  )
}

export default LiveMapView
