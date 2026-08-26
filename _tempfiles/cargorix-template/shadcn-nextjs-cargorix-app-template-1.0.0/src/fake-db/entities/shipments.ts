// Type Imports
import type { Shipment } from '@/types/entities/shipment'

// Data Imports
import { db as orders } from '@/fake-db/entities/orders'

const orderById = new Map(orders.map(order => [order.id, order]))

const authoredBase: Omit<Shipment, 'originHub'>[] = [
  {
    id: 'shp-3017',
    displayId: 'SHP-3017',
    orderId: 'ord-2042',
    status: 'returned',
    createdAt: '2026-07-06T10:00:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-07T09:00:00',
    pickupWindowEnd: '2026-07-07T10:00:00',
    deliveryDeadline: '2026-07-08T14:00:00',
    routeType: 'Fastest route',
    distanceKm: 14.2,
    etaMinutes: 26,
    driverId: 'drv-003',
    vehicleId: 'BIKE-028',
    carrier: 'Internal Fleet',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Handle grocery items with care.',
    progressPercent: 100,
    failureReason: 'Customer not available',
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3017-1', label: 'Shipment created', timestamp: '2026-07-06T10:00:00', state: 'done' },
      { id: 'tl-3017-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-06T10:05:00', state: 'done' },
      { id: 'tl-3017-3', label: 'Pickup scheduled', timestamp: '2026-07-07T09:00:00', state: 'done' },
      { id: 'tl-3017-4', label: 'In transit', timestamp: '2026-07-07T09:30:00', state: 'done' },
      { id: 'tl-3017-5', label: 'Returned to hub', timestamp: '2026-07-08T13:40:00', state: 'done' }
    ]
  },
  {
    id: 'shp-3018',
    displayId: 'SHP-3018',
    orderId: 'ord-2043',
    status: 'delivered',
    createdAt: '2026-07-08T14:00:00',
    serviceLevel: 'same_day',
    pickupWindowStart: '2026-07-09T09:00:00',
    pickupWindowEnd: '2026-07-09T09:45:00',
    deliveryDeadline: '2026-07-09T18:00:00',
    routeType: 'Fastest route',
    distanceKm: 9.8,
    etaMinutes: 18,
    driverId: 'drv-003',
    vehicleId: 'BIKE-028',
    carrier: 'Internal Fleet',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Keep spice jars upright.',
    progressPercent: 100,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3018-1', label: 'Shipment created', timestamp: '2026-07-08T14:00:00', state: 'done' },
      { id: 'tl-3018-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-08T14:10:00', state: 'done' },
      { id: 'tl-3018-3', label: 'Pickup scheduled', timestamp: '2026-07-09T09:00:00', state: 'done' },
      { id: 'tl-3018-4', label: 'In transit', timestamp: '2026-07-09T09:45:00', state: 'done' },
      { id: 'tl-3018-5', label: 'Delivered', timestamp: '2026-07-09T17:20:00', state: 'done' }
    ]
  },
  {
    id: 'shp-3019',
    displayId: 'SHP-3019',
    orderId: 'ord-2044',
    status: 'out_for_delivery',
    createdAt: '2026-07-18T09:00:00',
    serviceLevel: 'express',
    pickupWindowStart: '2026-07-21T08:00:00',
    pickupWindowEnd: '2026-07-21T08:45:00',
    deliveryDeadline: '2026-07-22T12:00:00',
    routeType: 'Fastest route',
    distanceKm: 24.5,
    etaMinutes: 42,
    driverId: 'drv-002',
    vehicleId: 'VAN-014',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1046',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'High priority — deliver before noon.',
    progressPercent: 85,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3019-1', label: 'Shipment created', timestamp: '2026-07-18T09:00:00', state: 'done' },
      { id: 'tl-3019-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-18T09:10:00', state: 'done' },
      { id: 'tl-3019-3', label: 'Pickup scheduled', timestamp: '2026-07-21T08:00:00', state: 'done' },
      { id: 'tl-3019-4', label: 'In transit', timestamp: '2026-07-21T08:45:00', state: 'current' },
      { id: 'tl-3019-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3020',
    displayId: 'SHP-3020',
    orderId: 'ord-2045',
    status: 'scheduled',
    createdAt: '2026-07-19T12:00:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-23T09:00:00',
    pickupWindowEnd: '2026-07-23T10:00:00',
    deliveryDeadline: '2026-07-24T17:00:00',
    routeType: 'Fastest route',
    distanceKm: 19.3,
    etaMinutes: 33,
    driverId: 'drv-001',
    vehicleId: 'TRK-208',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1045',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Call spa reception on arrival.',
    progressPercent: 0,
    priorityPackageIds: ['pkg-2045-01'],
    timeline: [
      { id: 'tl-3020-1', label: 'Shipment created', timestamp: '2026-07-19T12:00:00', state: 'done' },
      { id: 'tl-3020-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-19T12:05:00', state: 'done' },
      { id: 'tl-3020-3', label: 'Pickup scheduled', timestamp: '2026-07-23T09:00:00', state: 'current' },
      { id: 'tl-3020-4', label: 'In transit', state: 'pending' },
      { id: 'tl-3020-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3021',
    displayId: 'SHP-3021',
    orderId: 'ord-2046',
    status: 'in_transit',
    createdAt: '2026-07-16T09:00:00',
    serviceLevel: 'express',
    pickupWindowStart: '2026-07-20T09:00:00',
    pickupWindowEnd: '2026-07-20T09:45:00',
    deliveryDeadline: '2026-07-21T16:00:00',
    routeType: 'Fastest route',
    distanceKm: 18.6,
    etaMinutes: 31,
    driverId: 'drv-002',
    vehicleId: 'VAN-014',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1046',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Fragile furniture — handle with care.',
    progressPercent: 62,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3021-1', label: 'Shipment created', timestamp: '2026-07-16T09:00:00', state: 'done' },
      { id: 'tl-3021-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-16T09:10:00', state: 'done' },
      { id: 'tl-3021-3', label: 'Pickup scheduled', timestamp: '2026-07-20T09:00:00', state: 'done' },
      { id: 'tl-3021-4', label: 'In transit', timestamp: '2026-07-20T09:45:00', state: 'current' },
      { id: 'tl-3021-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3022',
    displayId: 'SHP-3022',
    orderId: 'ord-2052',
    status: 'scheduled',
    createdAt: '2026-07-21T09:00:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-24T08:30:00',
    pickupWindowEnd: '2026-07-24T09:30:00',
    deliveryDeadline: '2026-07-25T14:00:00',
    routeType: 'Fastest route',
    distanceKm: 19.8,
    etaMinutes: 34,
    driverId: 'drv-001',
    vehicleId: 'TRK-208',
    carrier: 'Internal Fleet',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Depot closes at 18:00 — arrive before 17:30.',
    progressPercent: 0,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3022-1', label: 'Shipment created', timestamp: '2026-07-21T09:00:00', state: 'done' },
      { id: 'tl-3022-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-21T09:10:00', state: 'done' },
      { id: 'tl-3022-3', label: 'Pickup scheduled', timestamp: '2026-07-24T08:30:00', state: 'current' },
      { id: 'tl-3022-4', label: 'In transit', state: 'pending' },
      { id: 'tl-3022-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3023',
    displayId: 'SHP-3023',
    orderId: 'ord-2053',
    status: 'in_transit',
    createdAt: '2026-07-21T11:20:00',
    serviceLevel: 'express',
    pickupWindowStart: '2026-07-23T10:00:00',
    pickupWindowEnd: '2026-07-23T11:00:00',
    deliveryDeadline: '2026-07-24T16:00:00',
    routeType: 'Fastest route',
    distanceKm: 8.6,
    etaMinutes: 19,
    driverId: 'drv-003',
    vehicleId: 'VAN-022',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1051',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Fragile ceramics — avoid kerb drops.',
    progressPercent: 45,
    priorityPackageIds: ['pkg-2053-01'],
    timeline: [
      { id: 'tl-3023-1', label: 'Shipment created', timestamp: '2026-07-21T11:20:00', state: 'done' },
      { id: 'tl-3023-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-21T11:35:00', state: 'done' },
      { id: 'tl-3023-3', label: 'Pickup scheduled', timestamp: '2026-07-23T10:00:00', state: 'done' },
      { id: 'tl-3023-4', label: 'In transit', timestamp: '2026-07-23T10:25:00', state: 'current' },
      { id: 'tl-3023-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3024',
    displayId: 'SHP-3024',
    orderId: 'ord-2054',
    status: 'out_for_delivery',
    createdAt: '2026-07-22T08:00:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-24T09:30:00',
    pickupWindowEnd: '2026-07-24T10:30:00',
    deliveryDeadline: '2026-07-25T13:00:00',
    routeType: 'Fastest route',
    distanceKm: 11.3,
    etaMinutes: 23,
    driverId: 'drv-002',
    vehicleId: 'VAN-014',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1046',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    progressPercent: 78,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3024-1', label: 'Shipment created', timestamp: '2026-07-22T08:00:00', state: 'done' },
      { id: 'tl-3024-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-22T08:15:00', state: 'done' },
      { id: 'tl-3024-3', label: 'Pickup scheduled', timestamp: '2026-07-24T09:30:00', state: 'done' },
      { id: 'tl-3024-4', label: 'In transit', timestamp: '2026-07-24T10:05:00', state: 'done' },
      { id: 'tl-3024-5', label: 'Delivered', state: 'current' }
    ]
  },
  {
    id: 'shp-3025',
    displayId: 'SHP-3025',
    orderId: 'ord-2055',
    status: 'scheduled',
    createdAt: '2026-07-22T10:15:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-25T08:00:00',
    pickupWindowEnd: '2026-07-25T09:00:00',
    deliveryDeadline: '2026-07-26T15:00:00',
    routeType: 'Shortest route',
    distanceKm: 16.7,
    etaMinutes: 30,
    driverId: 'drv-004',
    vehicleId: 'TRK-115',
    carrier: 'Internal Fleet',
    generateLabels: true,
    sendTrackingLink: false,
    requireProofOfDelivery: true,
    progressPercent: 0,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3025-1', label: 'Shipment created', timestamp: '2026-07-22T10:15:00', state: 'done' },
      { id: 'tl-3025-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-22T10:30:00', state: 'done' },
      { id: 'tl-3025-3', label: 'Pickup scheduled', timestamp: '2026-07-25T08:00:00', state: 'current' },
      { id: 'tl-3025-4', label: 'In transit', state: 'pending' },
      { id: 'tl-3025-5', label: 'Delivered', state: 'pending' }
    ]
  },
  {
    id: 'shp-3026',
    displayId: 'SHP-3026',
    orderId: 'ord-2056',
    status: 'delivered',
    createdAt: '2026-07-14T09:30:00',
    serviceLevel: 'regular',
    pickupWindowStart: '2026-07-15T08:00:00',
    pickupWindowEnd: '2026-07-15T09:00:00',
    deliveryDeadline: '2026-07-16T12:00:00',
    routeType: 'Fastest route',
    distanceKm: 13.9,
    etaMinutes: 25,
    driverId: 'drv-001',
    vehicleId: 'TRK-208',
    carrier: 'Internal Fleet',
    trackingDeviceId: 'GPS-1045',
    generateLabels: true,
    sendTrackingLink: true,
    requireProofOfDelivery: true,
    driverInstructions: 'Chilled load — keep below 6 °C.',
    progressPercent: 100,
    priorityPackageIds: [],
    timeline: [
      { id: 'tl-3026-1', label: 'Shipment created', timestamp: '2026-07-14T09:30:00', state: 'done' },
      { id: 'tl-3026-2', label: 'Driver and vehicle assigned', timestamp: '2026-07-14T09:40:00', state: 'done' },
      { id: 'tl-3026-3', label: 'Pickup scheduled', timestamp: '2026-07-15T08:00:00', state: 'done' },
      { id: 'tl-3026-4', label: 'In transit', timestamp: '2026-07-15T08:35:00', state: 'done' },
      { id: 'tl-3026-5', label: 'Delivered', timestamp: '2026-07-16T11:10:00', state: 'done' }
    ]
  }
]

const authored: Shipment[] = authoredBase.map(shipment => {
  const order = orderById.get(shipment.orderId)

  return {
    ...shipment,
    originHub: order?.pickupAddress ?? 'Newark Hub',
    distanceKm: order?.distanceKm ?? shipment.distanceKm,
    etaMinutes: order?.etaMinutes ?? shipment.etaMinutes
  }
})

const CARRIERS = [
  { name: 'Internal Fleet', slots: 5, lateEvery: 25 },
  { name: 'DHL', slots: 3, lateEvery: 25 },
  { name: 'FedEx', slots: 3, lateEvery: 16 },
  { name: 'UPS', slots: 2, lateEvery: 11 },
  { name: 'USPS', slots: 2, lateEvery: 8 }
]

const CARRIER_CYCLE = CARRIERS.flatMap(carrier => Array(carrier.slots).fill(carrier) as typeof CARRIERS)

const FAILURE_REASONS = ['Customer not available', 'Incorrect address', 'Damaged in transit', 'Refused on delivery']

const DRIVER_IDS = ['drv-001', 'drv-002', 'drv-003', 'drv-004', 'drv-005', 'drv-006', 'drv-007', 'drv-008']

const VEHICLE_IDS = [
  'TRK-208',
  'TRK-115',
  'VAN-022',
  'VAN-014',
  'BIKE-028',
  'VAN-101',
  'TRK-301',
  'VAN-102',
  'BIKE-029',
  'VAN-103',
  'TRK-302',
  'VAN-104',
  'BIKE-030',
  'VAN-105',
  'TRK-303',
  'VAN-106',
  'VAN-107',
  'TRK-304',
  'BIKE-031',
  'VAN-021',
  'TRK-305',
  'VAN-109'
]

const pickVehicle = (i: number): string => VEHICLE_IDS[(i * 7 + ((i * i) % 13)) % VEHICLE_IDS.length]

const shiftIso = (iso: string, minutes: number): string => {
  const shifted = new Date(`${iso}Z`).getTime() + minutes * 60_000
  const d = new Date(shifted)
  const pad2 = (n: number) => `${n}`.padStart(2, '0')

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

const carrierSeq = new Map<string, number>()

const historical: Shipment[] = orders
  .filter(order => order.id.startsWith('ord-hist-') && order.status === 'completed')
  .map((order, i) => {
    const carrier = CARRIER_CYCLE[i % CARRIER_CYCLE.length]
    const seq = (carrierSeq.get(carrier.name) ?? 0) + 1

    carrierSeq.set(carrier.name, seq)

    const returned = i % 29 === 0
    const late = !returned && seq % carrier.lateEvery === 0

    const createdAt = shiftIso(order.createdAt, 45)
    const deadline = order.requiredDeliveryAt

    const deliveredAt = shiftIso(deadline, late ? 60 + (i % 6) * 50 : -(40 + (i % 5) * 30))

    return {
      id: `shp-hist-${String(i).padStart(3, '0')}`,
      displayId: `SHP-${4000 + i}`,
      orderId: order.id,
      status: returned ? ('returned' as const) : ('delivered' as const),
      createdAt,
      serviceLevel: order.serviceLevel,
      originHub: order.pickupAddress,
      pickupWindowStart: order.requestedPickupAt,
      pickupWindowEnd: shiftIso(order.requestedPickupAt, 60),
      deliveryDeadline: deadline,
      routeType: i % 3 === 0 ? 'Shortest route' : 'Fastest route',
      distanceKm: order.distanceKm,
      etaMinutes: order.etaMinutes,
      driverId: DRIVER_IDS[i % DRIVER_IDS.length],
      vehicleId: pickVehicle(i),
      carrier: carrier.name,
      generateLabels: true,
      sendTrackingLink: true,
      requireProofOfDelivery: i % 2 === 0,
      progressPercent: 100,
      ...(returned ? { failureReason: FAILURE_REASONS[i % FAILURE_REASONS.length] } : {}),
      priorityPackageIds: [],
      timeline: [
        { id: `tl-hist-${i}-1`, label: 'Shipment created', timestamp: createdAt, state: 'done' as const },
        {
          id: `tl-hist-${i}-2`,
          label: 'Driver and vehicle assigned',
          timestamp: shiftIso(createdAt, 15),
          state: 'done' as const
        },
        {
          id: `tl-hist-${i}-3`,
          label: 'Pickup scheduled',
          timestamp: order.requestedPickupAt,
          state: 'done' as const
        },
        {
          id: `tl-hist-${i}-4`,
          label: 'In transit',
          timestamp: shiftIso(order.requestedPickupAt, 35),
          state: 'done' as const
        },
        {
          id: `tl-hist-${i}-5`,
          label: returned ? 'Returned to hub' : 'Delivered',
          timestamp: deliveredAt,
          state: 'done' as const
        }
      ]
    }
  })

export const db: Shipment[] = [...authored, ...historical]
