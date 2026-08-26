// Type Imports
import type {
  ComplianceDoc,
  ComplianceDocType,
  FuelType,
  MaintenanceRecord,
  Vehicle,
  VehicleActivityEntry,
  VehicleAssignment,
  VehicleOperationalStatus,
  VehicleTrackingStatus,
  VehicleType
} from '@/types/entities/vehicle'

const tracking: Vehicle[] = [
  {
    id: 'TRK-208',
    type: 'truck',
    label: 'Truck',
    capacityTons: 3.5,
    gpsId: 'GPS-1045',
    trackingStatus: 'delayed',
    lat: 40.786,
    lng: -73.908,
    assignedDriverId: 'drv-005',
    path: [
      [40.8302, -73.9226],
      [40.808, -73.916],
      [40.786, -73.908],
      [40.7498, -73.8648]
    ],
    stops: [
      { id: 'trk-208-s1', label: 'Grand Concourse, Bronx', lat: 40.8302, lng: -73.9226, completed: true },
      { id: 'trk-208-s2', label: 'Roosevelt Ave, Corona', lat: 40.7498, lng: -73.8648, completed: false }
    ],
    stopsCompleted: 2,
    stopsTotal: 6,
    etaAt: '2026-07-27T10:25:00',
    delayMinutes: 25,
    nextStopLabel: 'Roosevelt Ave, Corona',
    distanceRemainingKm: 12.3,
    shipmentId: 'shp-3018',
    hasAlert: true
  },
  {
    id: 'TRK-115',
    type: 'truck',
    label: 'Truck',
    capacityTons: 4,
    gpsId: 'GPS-1050',
    trackingStatus: 'delayed',
    lat: 40.7736,
    lng: -73.9566,
    assignedDriverId: 'drv-006',
    path: [
      [40.7081, -73.9571],
      [40.7447, -73.9485],
      [40.7736, -73.9566],
      [40.8302, -73.9226]
    ],
    stops: [{ id: 'trk-115-s1', label: 'Bedford Ave, Williamsburg', lat: 40.7081, lng: -73.9571, completed: true }],
    stopsCompleted: 1,
    stopsTotal: 5,
    etaAt: '2026-07-27T11:10:00',
    delayMinutes: 40,
    nextStopLabel: 'Grand Concourse, Bronx',
    distanceRemainingKm: 15.7,
    shipmentId: 'shp-3019',
    hasAlert: true
  },
  {
    id: 'VAN-022',
    type: 'van',
    label: 'Van',
    capacityTons: 2,
    gpsId: 'GPS-1051',
    trackingStatus: 'delayed',
    lat: 40.793,
    lng: -73.97,
    assignedDriverId: 'drv-001',
    path: [
      [40.7549, -73.984],
      [40.793, -73.97],
      [40.8302, -73.9226]
    ],
    stops: [{ id: 'van-022-s1', label: 'Herald Square, Midtown', lat: 40.7549, lng: -73.984, completed: true }],
    stopsCompleted: 3,
    stopsTotal: 7,
    etaAt: '2026-07-27T10:48:00',
    delayMinutes: 18,
    nextStopLabel: 'Grand Concourse, Bronx',
    distanceRemainingKm: 6.2,
    hasAlert: true
  },

  {
    id: 'VAN-014',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-1046',
    trackingStatus: 'on_route',
    lat: 40.7081,
    lng: -73.9571,
    assignedDriverId: 'drv-002',
    path: [
      [40.6454, -74.0122],
      [40.676, -73.988],
      [40.7081, -73.9571],
      [40.7447, -73.9485]
    ],
    stops: [
      { id: 'van-014-s1', label: '3rd Ave, Sunset Park', lat: 40.6454, lng: -74.0122, completed: true },
      { id: 'van-014-s2', label: 'Bedford Ave, Williamsburg', lat: 40.7081, lng: -73.9571, completed: false }
    ],
    stopsCompleted: 3,
    stopsTotal: 8,
    etaAt: '2026-07-27T09:32:00',
    nextStopLabel: 'Jackson Ave, Long Island City',
    distanceRemainingKm: 6.4,
    shipmentId: 'shp-3017',
    hasAlert: false
  },
  {
    id: 'BIKE-028',
    type: 'motorcycle',
    label: 'Motorcycle',
    capacityTons: 0.1,
    trackingStatus: 'on_route',
    lat: 40.676,
    lng: -73.988,
    assignedDriverId: 'drv-003',
    path: [
      [40.6928, -73.986],
      [40.676, -73.988],
      [40.6454, -74.0122]
    ],
    stops: [{ id: 'bike-028-s1', label: 'Court St, Downtown Brooklyn', lat: 40.6928, lng: -73.986, completed: true }],
    stopsCompleted: 5,
    stopsTotal: 7,
    etaAt: '2026-07-27T09:45:00',
    nextStopLabel: '3rd Ave, Sunset Park',
    distanceRemainingKm: 2.1,
    shipmentId: 'shp-3020',
    hasAlert: false
  },
  {
    id: 'VAN-101',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2001',
    trackingStatus: 'on_route',
    lat: 40.73,
    lng: -73.995,
    assignedDriverId: 'drv-007',
    path: [
      [40.7075, -74.0113],
      [40.73, -73.995],
      [40.7549, -73.984]
    ],
    stops: [{ id: 'van-101-s1', label: 'Water St, Financial District', lat: 40.7075, lng: -74.0113, completed: true }],
    stopsCompleted: 2,
    stopsTotal: 6,
    etaAt: '2026-07-27T10:05:00',
    nextStopLabel: 'Herald Square, Midtown',
    distanceRemainingKm: 4.8,
    hasAlert: false
  },
  {
    id: 'TRK-301',
    type: 'reefer',
    label: 'Reefer',
    capacityTons: 3.5,
    gpsId: 'GPS-2002',
    trackingStatus: 'on_route',
    lat: 40.7268,
    lng: -74.108,
    assignedDriverId: 'drv-008',
    path: [
      [40.7178, -74.0431],
      [40.7268, -74.108],
      [40.7357, -74.1724]
    ],
    stops: [{ id: 'trk-301-s1', label: 'Grove St, Jersey City', lat: 40.7178, lng: -74.0431, completed: true }],
    stopsCompleted: 4,
    stopsTotal: 9,
    etaAt: '2026-07-27T09:50:00',
    nextStopLabel: 'Newark Hub',
    distanceRemainingKm: 5.5,
    hasAlert: false
  },
  {
    id: 'VAN-102',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2003',
    trackingStatus: 'on_route',
    lat: 40.724,
    lng: -74.101,
    assignedDriverId: 'drv-009',
    path: [
      [40.7357, -74.1724],
      [40.724, -74.101],
      [40.7178, -74.0431]
    ],
    stops: [{ id: 'van-102-s1', label: 'Newark Hub', lat: 40.7357, lng: -74.1724, completed: true }],
    stopsCompleted: 3,
    stopsTotal: 5,
    etaAt: '2026-07-27T10:15:00',
    nextStopLabel: 'Grove St, Jersey City',
    distanceRemainingKm: 3.2,
    hasAlert: false
  },
  {
    id: 'BIKE-029',
    type: 'motorcycle',
    label: 'Motorcycle',
    capacityTons: 0.1,
    trackingStatus: 'on_route',
    lat: 40.701,
    lng: -73.97,
    assignedDriverId: 'drv-010',
    path: [
      [40.7081, -73.9571],
      [40.701, -73.97],
      [40.6928, -73.986]
    ],
    stops: [{ id: 'bike-029-s1', label: 'Bedford Ave, Williamsburg', lat: 40.7081, lng: -73.9571, completed: true }],
    stopsCompleted: 6,
    stopsTotal: 8,
    etaAt: '2026-07-27T09:58:00',
    nextStopLabel: 'Court St, Downtown Brooklyn',
    distanceRemainingKm: 1.4,
    hasAlert: false
  },
  {
    id: 'VAN-103',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2004',
    trackingStatus: 'on_route',
    lat: 40.786,
    lng: -73.926,
    assignedDriverId: 'drv-011',
    path: [
      [40.7447, -73.9485],
      [40.786, -73.926],
      [40.8302, -73.9226]
    ],
    stops: [{ id: 'van-103-s1', label: 'Jackson Ave, Long Island City', lat: 40.7447, lng: -73.9485, completed: true }],
    stopsCompleted: 1,
    stopsTotal: 4,
    etaAt: '2026-07-27T10:40:00',
    nextStopLabel: 'Grand Concourse, Bronx',
    distanceRemainingKm: 7.1,
    hasAlert: false
  },
  {
    id: 'TRK-302',
    type: 'reefer',
    label: 'Reefer',
    capacityTons: 4,
    gpsId: 'GPS-2005',
    trackingStatus: 'on_route',
    lat: 40.7454,
    lng: -73.9062,
    assignedDriverId: 'drv-012',
    path: [
      [40.7498, -73.8648],
      [40.7454, -73.9062],
      [40.7447, -73.9485]
    ],
    stops: [{ id: 'trk-302-s1', label: 'Roosevelt Ave, Corona', lat: 40.7498, lng: -73.8648, completed: true }],
    stopsCompleted: 2,
    stopsTotal: 7,
    etaAt: '2026-07-27T11:00:00',
    nextStopLabel: 'Jackson Ave, Long Island City',
    distanceRemainingKm: 8.9,
    hasAlert: false
  },
  {
    id: 'VAN-104',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2006',
    trackingStatus: 'on_route',
    lat: 40.769,
    lng: -73.962,
    assignedDriverId: 'drv-013',
    path: [
      [40.7549, -73.984],
      [40.769, -73.962],
      [40.8116, -73.9465]
    ],
    stops: [{ id: 'van-104-s1', label: 'Herald Square, Midtown', lat: 40.7549, lng: -73.984, completed: true }],
    stopsCompleted: 3,
    stopsTotal: 6,
    etaAt: '2026-07-27T10:22:00',
    nextStopLabel: 'E 125th St, Harlem',
    distanceRemainingKm: 4.0,
    hasAlert: false
  },
  {
    id: 'BIKE-030',
    type: 'motorcycle',
    label: 'Motorcycle',
    capacityTons: 0.1,
    trackingStatus: 'on_route',
    lat: 40.699,
    lng: -73.974,
    assignedDriverId: 'drv-014',
    path: [
      [40.6928, -73.986],
      [40.699, -73.974],
      [40.7081, -73.9571]
    ],
    stops: [{ id: 'bike-030-s1', label: 'Court St, Downtown Brooklyn', lat: 40.6928, lng: -73.986, completed: true }],
    stopsCompleted: 7,
    stopsTotal: 8,
    etaAt: '2026-07-27T09:40:00',
    nextStopLabel: 'Bedford Ave, Williamsburg',
    distanceRemainingKm: 1.0,
    hasAlert: false
  },
  {
    id: 'VAN-105',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2007',
    trackingStatus: 'on_route',
    lat: 40.746,
    lng: -74.156,
    assignedDriverId: 'drv-015',
    path: [
      [40.7357, -74.1724],
      [40.746, -74.156],
      [40.758, -74.12]
    ],
    stops: [{ id: 'van-105-s1', label: 'Newark Hub', lat: 40.7357, lng: -74.1724, completed: true }],
    stopsCompleted: 2,
    stopsTotal: 5,
    etaAt: '2026-07-27T10:50:00',
    nextStopLabel: 'Schuyler Ave, Kearny',
    distanceRemainingKm: 6.6,
    hasAlert: false
  },
  {
    id: 'TRK-303',
    type: 'reefer',
    label: 'Reefer',
    capacityTons: 3.5,
    gpsId: 'GPS-2008',
    trackingStatus: 'on_route',
    lat: 40.776,
    lng: -74.087,
    assignedDriverId: 'drv-016',
    path: [
      [40.758, -74.12],
      [40.776, -74.087],
      [40.7895, -74.0565]
    ],
    stops: [{ id: 'trk-303-s1', label: 'Schuyler Ave, Kearny', lat: 40.758, lng: -74.12, completed: true }],
    stopsCompleted: 1,
    stopsTotal: 6,
    etaAt: '2026-07-27T11:15:00',
    nextStopLabel: 'Meadowlands Pkwy, Secaucus',
    distanceRemainingKm: 9.4,
    hasAlert: true
  },
  {
    id: 'VAN-106',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2009',
    trackingStatus: 'on_route',
    lat: 40.729,
    lng: -74.04,
    assignedDriverId: 'drv-017',
    path: [
      [40.7178, -74.0431],
      [40.729, -74.04],
      [40.744, -74.0324]
    ],
    stops: [{ id: 'van-106-s1', label: 'Washington St, Hoboken', lat: 40.744, lng: -74.0324, completed: false }],
    stopsCompleted: 4,
    stopsTotal: 7,
    etaAt: '2026-07-27T10:05:00',
    nextStopLabel: 'Washington St, Hoboken',
    distanceRemainingKm: 3.8,
    hasAlert: false
  },
  {
    id: 'VAN-107',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2010',
    trackingStatus: 'on_route',
    lat: 40.722,
    lng: -74.003,
    assignedDriverId: 'drv-018',
    path: [
      [40.7549, -73.984],
      [40.722, -74.003],
      [40.7075, -74.0113]
    ],
    stops: [{ id: 'van-107-s1', label: 'Water St, Financial District', lat: 40.7075, lng: -74.0113, completed: false }],
    stopsCompleted: 5,
    stopsTotal: 6,
    etaAt: '2026-07-27T09:47:00',
    nextStopLabel: 'Water St, Financial District',
    distanceRemainingKm: 2.5,
    hasAlert: false
  },
  {
    id: 'TRK-304',
    type: 'truck',
    label: 'Truck',
    capacityTons: 4,
    gpsId: 'GPS-2011',
    trackingStatus: 'on_route',
    lat: 40.739,
    lng: -73.993,
    assignedDriverId: 'drv-019',
    path: [
      [40.7075, -74.0113],
      [40.739, -73.993],
      [40.7549, -73.984]
    ],
    stops: [{ id: 'trk-304-s1', label: 'Water St, Financial District', lat: 40.7075, lng: -74.0113, completed: true }],
    stopsCompleted: 2,
    stopsTotal: 8,
    etaAt: '2026-07-27T10:35:00',
    nextStopLabel: 'Herald Square, Midtown',
    distanceRemainingKm: 5.9,
    hasAlert: false
  },
  {
    id: 'BIKE-031',
    type: 'motorcycle',
    label: 'Motorcycle',
    capacityTons: 0.1,
    trackingStatus: 'on_route',
    lat: 40.733,
    lng: -74.0035,
    assignedDriverId: 'drv-020',
    path: [
      [40.719, -74.006],
      [40.733, -74.0035],
      [40.7465, -74.0014]
    ],
    stops: [{ id: 'bike-031-s1', label: 'Canal St, Tribeca', lat: 40.719, lng: -74.006, completed: true }],
    stopsCompleted: 6,
    stopsTotal: 7,
    etaAt: '2026-07-27T09:52:00',
    nextStopLabel: 'Chelsea Piers, Manhattan',
    distanceRemainingKm: 1.7,
    hasAlert: false
  },

  {
    id: 'VAN-021',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-1052',
    trackingStatus: 'completed',
    lat: 40.6928,
    lng: -73.986,
    assignedDriverId: 'drv-021',
    path: [
      [40.6454, -74.0122],
      [40.6767, -74.0111],
      [40.6928, -73.986]
    ],
    stops: [
      { id: 'van-021-s1', label: '3rd Ave, Sunset Park', lat: 40.6454, lng: -74.0122, completed: true },
      { id: 'van-021-s2', label: 'Van Brunt St, Red Hook', lat: 40.6767, lng: -74.0111, completed: true },
      { id: 'van-021-s3', label: 'Court St, Downtown Brooklyn', lat: 40.6928, lng: -73.986, completed: true }
    ],
    stopsCompleted: 6,
    stopsTotal: 6,
    etaAt: '2026-07-27T08:55:00',
    hasAlert: false
  },
  {
    id: 'TRK-305',
    type: 'reefer',
    label: 'Reefer',
    capacityTons: 3.5,
    gpsId: 'GPS-2016',
    trackingStatus: 'completed',
    lat: 40.719,
    lng: -74.033,
    assignedDriverId: 'drv-022',
    path: [
      [40.7357, -74.1724],
      [40.7268, -74.108],
      [40.719, -74.033]
    ],
    stops: [
      { id: 'trk-305-s1', label: 'Newark Hub', lat: 40.7357, lng: -74.1724, completed: true },
      { id: 'trk-305-s2', label: 'Grove St, Jersey City', lat: 40.7178, lng: -74.0431, completed: true }
    ],
    stopsCompleted: 5,
    stopsTotal: 5,
    etaAt: '2026-07-27T08:20:00',
    hasAlert: false
  },
  {
    id: 'VAN-109',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-2017',
    trackingStatus: 'completed',
    lat: 40.7557,
    lng: -73.8831,
    assignedDriverId: 'drv-023',
    path: [
      [40.7447, -73.9485],
      [40.7498, -73.8648],
      [40.7557, -73.8831]
    ],
    stops: [
      { id: 'van-109-s1', label: 'Jackson Ave, Long Island City', lat: 40.7447, lng: -73.9485, completed: true },
      { id: 'van-109-s2', label: 'Roosevelt Ave, Corona', lat: 40.7498, lng: -73.8648, completed: true }
    ],
    stopsCompleted: 4,
    stopsTotal: 4,
    etaAt: '2026-07-27T09:10:00',
    hasAlert: false
  },

  {
    id: 'VAN-009',
    type: 'van',
    label: 'Van',
    capacityTons: 2.5,
    gpsId: 'GPS-1090',
    trackingStatus: 'idle',
    lat: 40.725,
    lng: -73.908,
    assignedDriverId: 'drv-024',
    path: [],
    stops: [],
    stopsCompleted: 0,
    stopsTotal: 0,
    currentLocationLabel: 'Maspeth Yard, Queens',
    hasAlert: false
  },
  {
    id: 'TRK-306',
    type: 'reefer',
    label: 'Reefer',
    capacityTons: 3.5,
    gpsId: 'GPS-2018',
    trackingStatus: 'idle',
    lat: 40.696,
    lng: -74.14,
    assignedDriverId: 'drv-025',
    path: [],
    stops: [],
    stopsCompleted: 0,
    stopsTotal: 0,
    currentLocationLabel: 'Port Newark Depot',
    hasAlert: true
  }
]

const AS_OF = '2026-05-22'

const HOME_WAREHOUSES = ['wh-newark']

const WAREHOUSE_STATE: Record<string, string> = {
  'wh-bronx': 'TX',
  'wh-newark': 'NJ',
  'wh-brooklyn': 'NV',
  'wh-queens': 'GA'
}

const WAREHOUSE_REGION: Record<string, string> = {
  'wh-bronx': 'Northeast',
  'wh-newark': 'Northeast',
  'wh-brooklyn': 'Northeast',
  'wh-queens': 'Northeast'
}

const WAREHOUSE_CITY: Record<string, string> = {
  'wh-bronx': 'Bronx',
  'wh-newark': 'Newark',
  'wh-brooklyn': 'Brooklyn',
  'wh-queens': 'Long Island City'
}

const DRIVER_IDS = [
  'drv-001',
  'drv-002',
  'drv-003',
  'drv-004',
  'drv-005',
  'drv-006',
  'drv-007',
  'drv-008',
  'drv-009',
  'drv-010',
  'drv-011',
  'drv-012',
  'drv-013',
  'drv-014',
  'drv-015',
  'drv-016',
  'drv-017',
  'drv-018',
  'drv-019',
  'drv-020',
  'drv-021',
  'drv-022',
  'drv-023',
  'drv-024',
  'drv-025'
]

const UNASSIGNED = new Set(['VAN-009', 'TRK-306'])

const MAKES_BY_TYPE: Record<VehicleType, [string, string][]> = {
  truck: [
    ['Freightliner', 'M2 106'],
    ['Volvo', 'VNL 300'],
    ['Hino', '268A']
  ],
  van: [
    ['Ford', 'Transit'],
    ['Mercedes-Benz', 'Sprinter'],
    ['Isuzu', 'NPR HD']
  ],
  reefer: [
    ['Isuzu', 'FTR Reefer'],
    ['Hino', '338 Reefer'],
    ['Freightliner', 'M2 106 Reefer']
  ],
  motorcycle: [
    ['Honda', 'CB500X'],
    ['Yamaha', 'FZ-09']
  ]
}

const STATUS_BY_TRACKING: Record<VehicleTrackingStatus, VehicleOperationalStatus> = {
  on_route: 'on_route',
  delayed: 'on_route',
  completed: 'available',
  idle: 'available'
}

const STATUS_OVERRIDE: Record<string, VehicleOperationalStatus> = {
  'VAN-101': 'assigned',
  'VAN-107': 'assigned',
  'TRK-304': 'assigned',
  'VAN-109': 'maintenance',
  'VAN-009': 'maintenance',
  'TRK-306': 'out_of_service'
}

const VAN_FUELS: FuelType[] = ['diesel', 'electric', 'hybrid', 'cng']
const PLATE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ'
const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'

const PROVIDERS = [
  'Ryder Fleet Care',
  'Penske Truck Leasing',
  "Love's Truck Care",
  'TA Truck Service',
  'Firestone Fleet Care'
]

const MAINT_TYPES = [
  'Tire Service',
  'Brake Inspection',
  'Transmission Service',
  'Engine Diagnostics',
  'Cooling System Service'
]

const MAINT_DESCS = [
  'Rotated tires and balanced all axles',
  'Replaced front brake pads and resurfaced rotors',
  'Transmission fluid flush and filter change',
  'Full engine diagnostic scan and tune-up',
  'Coolant flush and thermostat replacement'
]

const INSURERS = ['Progressive Commercial', 'The Hartford', 'Nationwide Fleet', 'Travelers', 'Sentry Insurance']
const EMISSION_STANDARDS = ['EPA 2010', 'EPA 2017', 'CARB Compliant']
const DEFAULT_ROUTE_TYPES = ['Regional', 'Long-haul', 'Last-mile', 'Metro']
const ZONE_LETTERS = ['A', 'B', 'C', 'D', 'E']
const WORKING_HOURS = ['06:00 – 14:00', '08:00 – 16:00', '14:00 – 22:00']
const FLEET_NICKNAMES = ['Hauler', 'Runner', 'Courier', 'Express', 'Ranger', 'Pioneer']

const addDays = (base: string, days: number): string => {
  const d = new Date(base)

  d.setUTCDate(d.getUTCDate() + days)

  return d.toISOString().slice(0, 10)
}

const buildMasterData = (v: Vehicle, i: number): Partial<Vehicle> => {
  // Vars
  const [make, model] = MAKES_BY_TYPE[v.type][i % MAKES_BY_TYPE[v.type].length]
  const homeWarehouseId = HOME_WAREHOUSES[i % HOME_WAREHOUSES.length]
  const stateAbbr = WAREHOUSE_STATE[homeWarehouseId]
  const region = WAREHOUSE_REGION[homeWarehouseId]
  const city = WAREHOUSE_CITY[homeWarehouseId]
  const routeType = DEFAULT_ROUTE_TYPES[i % DEFAULT_ROUTE_TYPES.length]

  const operationalStatus = STATUS_OVERRIDE[v.id] ?? STATUS_BY_TRACKING[v.trackingStatus]
  const isAssigned = operationalStatus === 'on_route' || operationalStatus === 'assigned'
  const assignedDriverId = UNASSIGNED.has(v.id) ? '' : (v.assignedDriverId ?? DRIVER_IDS[i % DRIVER_IDS.length])

  const refrigerated = v.type === 'reefer'

  const fuelType: FuelType =
    v.type === 'motorcycle'
      ? i % 2 === 0
        ? 'petrol'
        : 'electric'
      : v.type === 'van'
        ? VAN_FUELS[i % VAN_FUELS.length]
        : i % 5 === 0
          ? 'cng'
          : 'diesel'

  const capacityKg = Math.round(v.capacityTons * 1000)
  const odometerKm = v.type === 'motorcycle' ? 8000 + i * 640 : v.type === 'van' ? 42000 + i * 1830 : 96000 + i * 2450

  const three = `${PLATE_LETTERS[i % PLATE_LETTERS.length]}${PLATE_LETTERS[(i * 3) % PLATE_LETTERS.length]}${PLATE_LETTERS[(i * 5) % PLATE_LETTERS.length]}`
  const registrationNo = `${stateAbbr}-${three}-${1000 + ((i * 349) % 9000)}`
  const vin = Array.from({ length: 17 }, (_, k) => VIN_CHARS[(i * 31 + k * 17 + 7) % VIN_CHARS.length]).join('')
  const engineNo = `ENG-${100000 + ((i * 911) % 900000)}`

  const nextServiceAt = addDays(AS_OF, (i % 6) * 22 - 15)
  const lastServiceAt = addDays(AS_OF, -(30 + ((i * 13) % 120)))
  const nextServiceOdometerKm = odometerKm + (v.type === 'motorcycle' ? 3000 : 15000)

  const inspectionIssues =
    i % 5 === 0
      ? ['Brake pad wear beyond 60%', 'Left headlight alignment out']
      : i % 7 === 0
        ? ['Front axle tire tread depth low']
        : []

  const maintenanceHistory: MaintenanceRecord[] = [
    {
      id: `${v.id}-mh-1`,
      date: addDays(AS_OF, -(40 + ((i * 11) % 80))),
      type: 'Preventive Maintenance',
      description: 'Oil change, filter replacement, and multi-point safety inspection',
      provider: PROVIDERS[i % PROVIDERS.length],
      odometerKm: Math.round(odometerKm * 0.9)
    },
    {
      id: `${v.id}-mh-2`,
      date: addDays(AS_OF, -(150 + ((i * 9) % 120))),
      type: MAINT_TYPES[i % MAINT_TYPES.length],
      description: MAINT_DESCS[i % MAINT_DESCS.length],
      provider: PROVIDERS[(i + 2) % PROVIDERS.length],
      odometerKm: Math.round(odometerKm * 0.72)
    },
    {
      id: `${v.id}-mh-3`,
      date: addDays(AS_OF, -(300 + ((i * 7) % 90))),
      type: 'DOT Inspection',
      description: 'Annual federal DOT inspection — passed with no defects',
      provider: PROVIDERS[(i + 1) % PROVIDERS.length],
      odometerKm: Math.round(odometerKm * 0.5)
    }
  ].slice(0, i % 2 === 0 ? 3 : 2)

  const mkDoc = (type: ComplianceDocType, prefix: string, expiryOffset: number): ComplianceDoc => {
    const expiry = addDays(AS_OF, expiryOffset)

    return {
      type,
      number: `${prefix}-${stateAbbr}${100000 + ((i * 617) % 900000)}`,
      issuedOn: addDays(expiry, -365),
      expiry
    }
  }

  const complianceDocs: ComplianceDoc[] = [
    mkDoc('insurance', 'INS', (i % 4) * 30 - 20),
    mkDoc('registration', 'REG', (i % 5) * 40 - 30),
    mkDoc('inspection', 'DOT', (i % 3) * 45 - 10)
  ]

  if (v.type !== 'motorcycle') complianceDocs.push(mkDoc('permit', 'PMT', 60 + (i % 4) * 30))
  if (v.type === 'reefer' || v.type === 'truck') complianceDocs.push(mkDoc('emissions', 'EMS', 20 + (i % 5) * 25))

  const originStop = v.stops[0]
  const destStop = v.stops[v.stops.length - 1]
  const shipmentId = v.shipmentId ?? `shp-9${100 + i}`

  const currentAssignment: VehicleAssignment | undefined = isAssigned
    ? {
        routeId: `RT-${1000 + i}`,
        routeName: `${routeType} Route ${1000 + i}`,
        shipmentId,
        shipmentName: shipmentId.replace('shp-', 'SHP-'),
        origin: originStop?.label ?? v.currentLocationLabel ?? `${city} DC`,
        destination: (v.stops.length > 1 ? destStop?.label : v.nextStopLabel) ?? destStop?.label ?? '—',
        nextStop: v.nextStopLabel ?? destStop?.label ?? '—',
        etaLabel: v.etaAt ? `Today ${v.etaAt.slice(11, 16)}` : '—'
      }
    : undefined

  const currentLoadKg = isAssigned ? Math.round(capacityKg * (0.5 + (i % 6) * 0.05)) : undefined

  const activity: VehicleActivityEntry[] = [
    { id: `${v.id}-act-1`, label: 'Departed home depot for scheduled route', at: `${addDays(AS_OF, -1)}T07:15:00` },
    {
      id: `${v.id}-act-2`,
      label: `Odometer logged at ${odometerKm.toLocaleString()} km`,
      at: `${addDays(AS_OF, -2)}T18:40:00`
    },
    { id: `${v.id}-act-3`, label: 'Fuel top-up recorded at partner station', at: `${addDays(AS_OF, -4)}T12:05:00` },
    { id: `${v.id}-act-4`, label: 'Preventive maintenance completed', at: `${addDays(AS_OF, -6)}T09:30:00` }
  ].slice(0, i % 2 === 0 ? 4 : 3)

  const notes =
    operationalStatus === 'maintenance'
      ? 'Currently in the workshop for scheduled preventive maintenance. Expected back in service within 48 hours.'
      : operationalStatus === 'out_of_service'
        ? 'Withdrawn from service pending major repair. Do not dispatch until inspection is cleared.'
        : `${make} ${model} assigned to ${region} operations. Handles ${routeType.toLowerCase()} deliveries out of ${city}.`

  return {
    registrationNo,
    make,
    model,
    year: 2019 + (i % 6),
    name: `${city} ${FLEET_NICKNAMES[i % FLEET_NICKNAMES.length]} ${String(i + 1).padStart(2, '0')}`,
    vin,
    engineNo,
    fuelType,
    operationalStatus,
    homeWarehouseId,
    assignedDriverId,
    odometerKm,
    defaultRegion: region,
    operatingZone: `Zone ${ZONE_LETTERS[i % ZONE_LETTERS.length]}`,
    defaultRouteType: routeType,
    workingHours: WORKING_HOURS[i % WORKING_HOURS.length],
    healthStatus:
      operationalStatus === 'out_of_service'
        ? 'poor'
        : operationalStatus === 'maintenance'
          ? 'fair'
          : i % 7 === 0
            ? 'fair'
            : 'good',
    cargoVolumeM3: v.type === 'motorcycle' ? 0.3 : Math.round(v.capacityTons * 6 * 10) / 10,
    palletCapacity: v.type === 'motorcycle' ? 0 : Math.max(1, Math.round(v.capacityTons * 4)),
    refrigerated,
    tempRangeC: refrigerated ? '-20 to 8' : undefined,
    fuelTankCapacityL: v.type === 'motorcycle' ? 15 : v.type === 'van' ? 80 : 200,
    transmission: v.type === 'motorcycle' ? 'manual' : i % 3 === 0 ? 'manual' : 'automatic',
    emissionStandard: EMISSION_STANDARDS[i % EMISSION_STANDARDS.length],
    dimensions:
      v.type === 'motorcycle'
        ? '2100 x 800 x 1200 mm'
        : v.type === 'van'
          ? '5900 x 2000 x 2500 mm'
          : '8200 x 2400 x 3200 mm',
    seatingCapacity: v.type === 'motorcycle' ? 1 : v.type === 'van' ? 3 : 2,
    axleConfig: v.type === 'motorcycle' ? '2-wheel' : v.type === 'van' ? '4x2' : i % 2 === 0 ? '6x4' : '4x2',
    lastServiceAt,
    nextServiceAt,
    nextServiceOdometerKm,
    inspectionIssues,
    maintenanceHistory,
    complianceDocs,
    insuranceProvider: INSURERS[i % INSURERS.length],
    insurancePolicyNo: `POL-${stateAbbr}-${200000 + ((i * 733) % 800000)}`,
    currentAssignment,
    currentLoadKg,
    notes,
    activity
  }
}

export const db: Vehicle[] = tracking.map((v, i) => ({ ...v, ...buildMasterData(v, i) }))
