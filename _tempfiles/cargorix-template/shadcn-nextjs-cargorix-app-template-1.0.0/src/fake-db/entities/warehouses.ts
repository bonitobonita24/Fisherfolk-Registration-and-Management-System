// Type Imports
import type { Warehouse } from '@/types/entities/warehouse'

export const db: Warehouse[] = [
  {
    id: 'wh-bronx',
    name: 'Bronx DC',
    code: 'WH-NY-B',
    type: 'Distribution Centre',
    status: 'active',
    location: 'Bronx, NY',
    address: '1200 Zerega Ave\nBronx, NY 10462\nUnited States',
    addressParts: {
      line1: '1200 Zerega Ave',
      city: 'Bronx',
      state: 'NY',
      country: 'United States',
      postalCode: '10462'
    },
    lat: 40.83,
    lng: -73.846,
    managerId: 'usr-001',
    email: 'sarah.johnson@cargorix.com',
    phone: '+1 718 555 0188',
    timezone: '(UTC-05:00) Eastern Time',
    operatingHours: '08:00 AM – 06:00 PM',
    openedDate: '2021-03-01',
    maxCapacity: 500,
    dockCount: 4,
    zoneCount: 6,
    allowInbound: true,
    allowOutbound: true,
    zones: [
      { id: 'wh-bronx-z-a', name: 'Zone A', category: 'Electronics', usedBins: 22, totalBins: 30 },
      { id: 'wh-bronx-z-b', name: 'Zone B', category: 'Clothing', usedBins: 18, totalBins: 25 },
      { id: 'wh-bronx-z-c', name: 'Zone C', category: 'Home & Garden', usedBins: 19, totalBins: 25 },
      { id: 'wh-bronx-z-d', name: 'Zone D', category: 'Accessories', usedBins: 14, totalBins: 20 },
      { id: 'wh-bronx-z-e', name: 'Zone E', category: 'Health', usedBins: 10, totalBins: 15 },
      { id: 'wh-bronx-z-f', name: 'Zone F', category: 'Seasonal', usedBins: 8, totalBins: 15 }
    ],
    dockSchedule: [
      {
        id: 'wh-bronx-dk-1',
        reference: 'PO-6021',
        direction: 'inbound',
        dock: 'Dock 3',
        windowStart: '09:00',
        windowEnd: '10:00',
        carrier: 'DHL Logistics',
        status: 'arriving'
      },
      {
        id: 'wh-bronx-dk-2',
        reference: 'SH-2024-014',
        direction: 'outbound',
        dock: 'Dock 1',
        windowStart: '11:30',
        windowEnd: '12:00',
        carrier: 'FedEx',
        status: 'loaded'
      },
      {
        id: 'wh-bronx-dk-3',
        reference: 'SH-2024-021',
        direction: 'outbound',
        dock: 'Dock 2',
        windowStart: '13:00',
        windowEnd: '13:45',
        carrier: 'UPS',
        status: 'loading'
      }
    ],
    today: { inboundPOs: 2, outboundShipments: 6, dockQueueWaiting: 1 }
  },
  {
    id: 'wh-newark',
    name: 'Newark Hub',
    code: 'WH-NJ-N',
    type: 'Fulfillment Center',
    status: 'active',
    location: 'Newark, NJ',
    address: '120 Raymond Blvd\nNewark, NJ 07102\nUnited States',
    addressParts: {
      line1: '120 Raymond Blvd',
      city: 'Newark',
      state: 'NJ',
      country: 'United States',
      postalCode: '07102'
    },
    lat: 40.7357,
    lng: -74.1724,
    managerId: 'usr-005',
    email: 'jason.miller@cargorix.com',
    phone: '+1 973 555 0142',
    timezone: '(UTC-05:00) Eastern Time',
    operatingHours: '07:00 AM – 08:00 PM',
    openedDate: '2019-08-01',
    maxCapacity: 500,
    dockCount: 3,
    zoneCount: 6,
    allowInbound: true,
    allowOutbound: true,
    zones: [
      { id: 'wh-newark-z-a', name: 'Zone A', category: 'Electronics', usedBins: 16, totalBins: 28 },
      { id: 'wh-newark-z-b', name: 'Zone B', category: 'Apparel', usedBins: 20, totalBins: 30 },
      { id: 'wh-newark-z-c', name: 'Zone C', category: 'Packaging', usedBins: 12, totalBins: 22 },
      { id: 'wh-newark-z-d', name: 'Zone D', category: 'Accessories', usedBins: 11, totalBins: 20 },
      { id: 'wh-newark-z-e', name: 'Zone E', category: 'Books', usedBins: 7, totalBins: 15 },
      { id: 'wh-newark-z-f', name: 'Zone F', category: 'Overflow', usedBins: 9, totalBins: 20 }
    ],
    dockSchedule: [
      {
        id: 'wh-newark-dk-1',
        reference: 'PO-9033',
        direction: 'inbound',
        dock: 'Dock 2',
        windowStart: '14:00',
        windowEnd: '15:00',
        carrier: 'UPS',
        status: 'scheduled'
      },
      {
        id: 'wh-newark-dk-2',
        reference: 'PO-9041',
        direction: 'inbound',
        dock: 'Dock 1',
        windowStart: '08:30',
        windowEnd: '09:15',
        carrier: 'Old Dominion',
        status: 'completed'
      },
      {
        id: 'wh-newark-dk-3',
        reference: 'SH-2024-030',
        direction: 'outbound',
        dock: 'Dock 3',
        windowStart: '16:00',
        windowEnd: '16:45',
        carrier: 'FedEx',
        status: 'scheduled'
      }
    ],
    today: { inboundPOs: 3, outboundShipments: 4, dockQueueWaiting: 0 }
  },
  {
    id: 'wh-brooklyn',
    name: 'Brooklyn Fulfillment',
    code: 'WH-NY-K',
    type: 'Fulfillment Center',
    status: 'active',
    location: 'Brooklyn, NY',
    address: '280 Richards St\nBrooklyn, NY 11231\nUnited States',
    addressParts: {
      line1: '280 Richards St',
      city: 'Brooklyn',
      state: 'NY',
      country: 'United States',
      postalCode: '11231'
    },
    lat: 40.676,
    lng: -74.011,
    managerId: 'usr-012',
    email: 'aisha.lee@cargorix.com',
    phone: '+1 718 555 0119',
    timezone: '(UTC-05:00) Eastern Time',
    operatingHours: '06:00 AM – 06:00 PM',
    openedDate: '2022-01-15',
    maxCapacity: 450,
    dockCount: 5,
    zoneCount: 6,
    allowInbound: true,
    allowOutbound: true,
    zones: [
      { id: 'wh-brooklyn-z-a', name: 'Zone A', category: 'Electronics', usedBins: 27, totalBins: 30 },
      { id: 'wh-brooklyn-z-b', name: 'Zone B', category: 'Sports', usedBins: 23, totalBins: 25 },
      { id: 'wh-brooklyn-z-c', name: 'Zone C', category: 'Home & Garden', usedBins: 21, totalBins: 24 },
      { id: 'wh-brooklyn-z-d', name: 'Zone D', category: 'Books', usedBins: 18, totalBins: 20 },
      { id: 'wh-brooklyn-z-e', name: 'Zone E', category: 'Packaging', usedBins: 16, totalBins: 18 },
      { id: 'wh-brooklyn-z-f', name: 'Zone F', category: 'Seasonal', usedBins: 12, totalBins: 18 }
    ],
    dockSchedule: [
      {
        id: 'wh-brooklyn-dk-1',
        reference: 'PO-6044',
        direction: 'inbound',
        dock: 'Dock 4',
        windowStart: '10:00',
        windowEnd: '11:00',
        carrier: 'XPO Logistics',
        status: 'arriving'
      },
      {
        id: 'wh-brooklyn-dk-2',
        reference: 'SH-2024-035',
        direction: 'outbound',
        dock: 'Dock 1',
        windowStart: '12:30',
        windowEnd: '13:15',
        carrier: 'FedEx',
        status: 'loading'
      },
      {
        id: 'wh-brooklyn-dk-3',
        reference: 'SH-2024-038',
        direction: 'outbound',
        dock: 'Dock 2',
        windowStart: '15:00',
        windowEnd: '15:45',
        carrier: 'DHL Logistics',
        status: 'scheduled'
      }
    ],
    today: { inboundPOs: 3, outboundShipments: 5, dockQueueWaiting: 2 }
  },
  {
    id: 'wh-queens',
    name: 'Queens Cross-dock',
    code: 'WH-NY-Q',
    type: 'Cross-dock',
    status: 'active',
    location: 'Long Island City, NY',
    address: '47-20 34th St\nLong Island City, NY 11101\nUnited States',
    addressParts: {
      line1: '47-20 34th St',
      city: 'Long Island City',
      state: 'NY',
      country: 'United States',
      postalCode: '11101'
    },
    lat: 40.743,
    lng: -73.935,
    managerId: 'usr-017',
    email: 'owen.brady@cargorix.com',
    phone: '+1 718 555 0173',
    timezone: '(UTC-05:00) Eastern Time',
    operatingHours: '08:00 AM – 08:00 PM',
    openedDate: '2020-06-01',
    maxCapacity: 700,
    dockCount: 4,
    zoneCount: 6,
    allowInbound: true,
    allowOutbound: true,
    zones: [
      { id: 'wh-queens-z-a', name: 'Zone A', category: 'Electronics', usedBins: 10, totalBins: 26 },
      { id: 'wh-queens-z-b', name: 'Zone B', category: 'Apparel', usedBins: 14, totalBins: 30 },
      { id: 'wh-queens-z-c', name: 'Zone C', category: 'Home & Garden', usedBins: 9, totalBins: 22 },
      { id: 'wh-queens-z-d', name: 'Zone D', category: 'Accessories', usedBins: 7, totalBins: 18 },
      { id: 'wh-queens-z-e', name: 'Zone E', category: 'Returns', usedBins: 6, totalBins: 20 },
      { id: 'wh-queens-z-f', name: 'Zone F', category: 'Seasonal', usedBins: 5, totalBins: 16 }
    ],
    dockSchedule: [
      {
        id: 'wh-queens-dk-1',
        reference: 'PO-6050',
        direction: 'inbound',
        dock: 'Dock 1',
        windowStart: '09:30',
        windowEnd: '10:15',
        carrier: 'UPS',
        status: 'scheduled'
      },
      {
        id: 'wh-queens-dk-2',
        reference: 'SH-2024-042',
        direction: 'outbound',
        dock: 'Dock 3',
        windowStart: '13:30',
        windowEnd: '14:15',
        carrier: 'USPS',
        status: 'arriving'
      }
    ],
    today: { inboundPOs: 1, outboundShipments: 3, dockQueueWaiting: 1 }
  }
]
