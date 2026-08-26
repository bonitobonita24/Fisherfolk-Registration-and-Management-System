// Third-party Imports
import { format } from 'date-fns'

// Type Imports
import type { Driver } from '@/types/entities/driver'
import type { Shipment, ShipmentStatus } from '@/types/entities/shipment'
import type { Vehicle } from '@/types/entities/vehicle'

// Util Imports
import { excludeUnsavedDrafts } from '@/lib/exclude-drafts'

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  returned: 'Returned'
}

export const getShipmentKpis = (shipments: Shipment[]) => {
  const live = excludeUnsavedDrafts(shipments)

  return {
    total: live.length,
    scheduled: live.filter(s => s.status === 'scheduled').length,
    inTransit: live.filter(s => s.status === 'in_transit').length,
    outForDelivery: live.filter(s => s.status === 'out_for_delivery').length
  }
}

export interface ShipmentTrackingSummary {
  statusLabel: string
  driverVehicleLabel: string
  scheduleLabel: string
}

export const getShipmentTrackingSummary = (
  shipment: Shipment,
  driver?: Driver,
  vehicle?: Vehicle
): ShipmentTrackingSummary => {
  const driverVehicleLabel = driver && vehicle ? `${driver.name} · ${vehicle.id}` : 'Driver and vehicle needed'

  let scheduleLabel: string

  switch (shipment.status) {
    case 'draft':
      scheduleLabel = 'Draft — not yet scheduled'
      break
    case 'scheduled':
      scheduleLabel = `Pickup ${format(new Date(shipment.pickupWindowStart), 'd MMM · HH:mm')}`
      break
    case 'in_transit':

    case 'out_for_delivery': {
      const remainingKm = Math.round(shipment.distanceKm * (1 - shipment.progressPercent / 100))

      scheduleLabel = `${remainingKm} km remaining`
      break
    }

    case 'delivered':
      scheduleLabel = 'Proof of delivery received'
      break
    case 'returned':
      scheduleLabel = 'Returned to origin'
      break
  }

  return { statusLabel: STATUS_LABEL[shipment.status], driverVehicleLabel, scheduleLabel }
}
