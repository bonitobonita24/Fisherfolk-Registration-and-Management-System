// Type Imports
import type { Order, OrderPackage, OrderStatus } from '@/types/entities/order'

// Util Imports
import { haversineKm, legMinutes } from '@/lib/selectors/route-selectors'

// Data Imports
import { db as clients } from '@/fake-db/entities/clients'
import { db as warehouses } from '@/fake-db/entities/warehouses'

const authored: Order[] = [
  {
    id: 'ord-2040',
    displayId: 'OR-2040',
    status: 'cancelled',
    source: 'api',
    createdAt: '2026-07-10T09:00:00',
    createdBy: 'Anita Kim',
    clientId: 'cust-010',
    contactName: 'Yossi Mizrahi',
    contactEmail: 'yossi@denimfarms.com',
    contactPhone: '(718) 555-0107',
    billingAccount: 'Denim Farms — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 1, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '501 7th Ave',
    deliveryAddressDetail: 'Loading Bay 4, New York, NY 10018',
    deliveryLat: 40.7549,
    deliveryLng: -73.984,
    requestedPickupAt: '2026-07-12T09:00:00',
    requiredDeliveryAt: '2026-07-13T17:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2040-01',
        itemName: 'Denim rolls',
        packageType: 'pallet',
        quantity: 6,
        weightKg: 320,
        volumeM3: 4.8,
        dimensions: '110 × 110 × 140 cm'
      }
    ],
    declaredValue: 2600,
    handlingRequirement: 'standard',
    totalAmount: 53,
    distanceKm: 21.4,
    etaMinutes: 36,
    tollEstimate: 3.1,
    activity: [
      {
        id: 'act-2040-03',
        label: 'Order cancelled',
        actor: 'Anita Kim',
        timestamp: '2026-07-11T09:00:00',
        icon: 'ban',
        description: 'Cancellation reason: Customer request'
      },
      {
        id: 'act-2040-02',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-10T11:00:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2040-01',
        label: 'Order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-10T09:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2041',
    displayId: 'OR-2041',
    status: 'on_hold',
    source: 'portal',
    createdAt: '2026-07-12T09:30:00',
    createdBy: 'Anita Kim',
    clientId: 'cust-009',
    contactName: 'Lior Shani',
    contactEmail: 'lior@bloomandco.com',
    contactPhone: '(201) 555-0191',
    billingAccount: 'Bloom & Co — Net 15',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 2, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '199 Water St',
    deliveryAddressDetail: 'Suite 311, New York, NY 10038',
    deliveryLat: 40.7075,
    deliveryLng: -74.0113,
    requestedPickupAt: '2026-07-15T10:00:00',
    requiredDeliveryAt: '2026-07-16T15:00:00',
    serviceLevel: 'express',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2041-01',
        itemName: 'Floral arrangements',
        packageType: 'carton',
        quantity: 10,
        weightKg: 150,
        volumeM3: 2.0,
        dimensions: '50 × 50 × 60 cm'
      }
    ],
    declaredValue: 3400,
    handlingRequirement: 'fragile',
    customerInstructions: 'Keep upright, do not stack.',
    totalAmount: 81,
    distanceKm: 27.9,
    etaMinutes: 44,
    tollEstimate: 4.2,
    activity: [
      {
        id: 'act-2041-02',
        label: 'Order placed on hold',
        actor: 'Anita Kim',
        timestamp: '2026-07-12T10:15:00',
        icon: 'ban',
        description: 'Hold reason: Payment pending'
      },
      {
        id: 'act-2041-01',
        label: 'Order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-12T09:30:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2042',
    displayId: 'OR-2042',
    status: 'completed',
    source: 'csv',
    createdAt: '2026-07-05T08:00:00',
    createdBy: 'System',
    clientId: 'cust-011',
    contactName: 'Talia Gold',
    contactEmail: 'talia@coastalgrocers.com',
    contactPhone: '(212) 555-0169',
    billingAccount: 'Coastal Grocers — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 3, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '240 Kent Ave',
    deliveryAddressDetail: 'Bay 2, Brooklyn, NY 11211',
    deliveryLat: 40.7081,
    deliveryLng: -73.9571,
    requestedPickupAt: '2026-07-07T09:00:00',
    requiredDeliveryAt: '2026-07-08T14:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2042-01',
        itemName: 'Grocery cartons',
        packageType: 'carton',
        quantity: 3,
        weightKg: 90,
        volumeM3: 1.2,
        dimensions: '60 × 40 × 40 cm'
      }
    ],
    declaredValue: 900,
    handlingRequirement: 'standard',
    totalAmount: 44,
    distanceKm: 32.1,
    etaMinutes: 50,
    tollEstimate: 4.9,
    shipmentId: 'shp-3017',
    activity: [
      {
        id: 'act-2042-02',
        label: 'Shipment linked — SHP-3017',
        actor: 'System',
        timestamp: '2026-07-06T10:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2042-01',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-05T09:30:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2042-00',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-05T08:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2043',
    displayId: 'OR-2043',
    status: 'completed',
    source: 'portal',
    createdAt: '2026-07-08T13:00:00',
    createdBy: 'Rachel Adams',
    clientId: 'cust-003',
    contactName: 'Dana Peretz',
    contactEmail: 'dana@avivflavor.com',
    contactPhone: '(201) 555-0119',
    billingAccount: 'Aviv Flavor — Prepaid',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 4, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '850 3rd Ave',
    deliveryAddressDetail: 'Suite 702, Brooklyn, NY 11220',
    deliveryLat: 40.6454,
    deliveryLng: -74.0122,
    requestedPickupAt: '2026-07-09T09:00:00',
    requiredDeliveryAt: '2026-07-09T18:00:00',
    serviceLevel: 'same_day',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2043-01',
        itemName: 'Spice jars',
        packageType: 'carton',
        quantity: 1,
        weightKg: 38,
        volumeM3: 0.4,
        dimensions: '40 × 30 × 30 cm'
      }
    ],
    declaredValue: 640,
    handlingRequirement: 'temperature_controlled',
    totalAmount: 122,
    distanceKm: 9.8,
    etaMinutes: 18,
    tollEstimate: 1.2,
    shipmentId: 'shp-3018',
    activity: [
      {
        id: 'act-2043-02',
        label: 'Shipment linked — SHP-3018',
        actor: 'System',
        timestamp: '2026-07-08T14:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2043-01',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-08T13:45:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2043-00',
        label: 'Order created',
        actor: 'Rachel Adams',
        timestamp: '2026-07-08T13:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2044',
    displayId: 'OR-2044',
    status: 'in_fulfilment',
    source: 'api',
    createdAt: '2026-07-17T09:00:00',
    createdBy: 'System',
    clientId: 'cust-008',
    contactName: 'Ilan Ben-David',
    contactEmail: 'ilan@devtakhumtraders.com',
    contactPhone: '(973) 555-0136',
    billingAccount: 'Devtakhum Traders — Net 45',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 5, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '47-10 Austell Pl',
    deliveryAddressDetail: 'Loading Bay 1, Long Island City, NY 11101',
    deliveryLat: 40.7447,
    deliveryLng: -73.9485,
    requestedPickupAt: '2026-07-21T08:00:00',
    requiredDeliveryAt: '2026-07-22T12:00:00',
    serviceLevel: 'express',
    priority: 'high',
    packages: [
      {
        id: 'pkg-2044-01',
        itemName: 'Wholesale pallets',
        packageType: 'pallet',
        quantity: 4,
        weightKg: 480,
        volumeM3: 6.0,
        dimensions: '120 × 100 × 100 cm'
      }
    ],
    declaredValue: 5200,
    handlingRequirement: 'standard',
    totalAmount: 94,
    distanceKm: 24.5,
    etaMinutes: 42,
    tollEstimate: 3.8,
    shipmentId: 'shp-3019',
    activity: [
      {
        id: 'act-2044-02',
        label: 'Shipment linked — SHP-3019',
        actor: 'System',
        timestamp: '2026-07-18T09:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2044-01',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-17T10:20:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2044-00',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-17T09:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2045',
    displayId: 'OR-2045',
    status: 'in_fulfilment',
    source: 'manual',
    createdAt: '2026-07-19T10:00:00',
    createdBy: 'Anita Kim',
    entryReason: 'Customer placed order by phone',
    customerReference: 'PH-6612',
    internalNote: 'Recurring monthly restock order.',
    clientId: 'cust-004',
    contactName: 'Ronit Levi',
    contactEmail: 'ronit@simchaspa.com',
    contactPhone: '(917) 555-0164',
    billingAccount: 'Simcha Spa — Net 15',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 6, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '104-01 Roosevelt Ave',
    deliveryAddressDetail: 'Suite 218, Corona, NY 11368',
    deliveryLat: 40.7498,
    deliveryLng: -73.8648,
    requestedPickupAt: '2026-07-23T09:00:00',
    requiredDeliveryAt: '2026-07-24T17:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2045-01',
        itemName: 'Spa supplies',
        packageType: 'carton',
        quantity: 3,
        weightKg: 220,
        volumeM3: 1.5,
        dimensions: '70 × 50 × 45 cm'
      }
    ],
    declaredValue: 2100,
    handlingRequirement: 'standard',
    totalAmount: 49,
    distanceKm: 19.3,
    etaMinutes: 33,
    tollEstimate: 2.7,
    shipmentId: 'shp-3020',
    activity: [
      {
        id: 'act-2045-03',
        label: 'Shipment linked — SHP-3020',
        actor: 'System',
        timestamp: '2026-07-19T12:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2045-02',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-19T10:45:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2045-01',
        label: 'Manual order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-19T10:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2046',
    displayId: 'OR-2046',
    status: 'in_fulfilment',
    source: 'api',
    createdAt: '2026-07-16T08:15:00',
    createdBy: 'System',
    clientId: 'cust-002',
    contactName: 'Noa Regev',
    contactEmail: 'noa@ahshavhome.com',
    contactPhone: '(718) 555-0182',
    billingAccount: 'Ahshav Home — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 1, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '1930 Grand Concourse',
    deliveryAddressDetail: 'Suite 124, Bronx, NY 10453',
    deliveryLat: 40.8302,
    deliveryLng: -73.9226,
    requestedPickupAt: '2026-07-20T09:00:00',
    requiredDeliveryAt: '2026-07-21T16:00:00',
    serviceLevel: 'express',
    priority: 'high',
    packages: [
      {
        id: 'pkg-2046-01',
        itemName: 'Furniture crates',
        packageType: 'pallet',
        quantity: 2,
        weightKg: 740,
        volumeM3: 3.1,
        dimensions: '100 × 90 × 120 cm'
      }
    ],
    declaredValue: 6200,
    handlingRequirement: 'fragile',
    totalAmount: 105,
    distanceKm: 18.6,
    etaMinutes: 31,
    tollEstimate: 2.9,
    shipmentId: 'shp-3021',
    activity: [
      {
        id: 'act-2046-02',
        label: 'Shipment linked — SHP-3021',
        actor: 'System',
        timestamp: '2026-07-16T09:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2046-01',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-16T08:50:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2046-00',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-16T08:15:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2047',
    displayId: 'OR-2047',
    status: 'ready_for_shipment',
    source: 'api',
    createdAt: '2026-07-17T12:10:00',
    createdBy: 'Anita Kim',
    clientId: 'cust-005',
    contactName: 'Maya Ostrovsky',
    contactEmail: 'maya@littlehaifa.com',
    contactPhone: '(347) 555-0173',
    billingAccount: 'Little Haifa — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 2, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '95 Christopher Columbus Dr',
    deliveryAddressDetail: 'Suite 409, Jersey City, NJ 07302',
    deliveryLat: 40.7178,
    deliveryLng: -74.0431,
    requestedPickupAt: '2026-07-24T08:00:00',
    requiredDeliveryAt: '2026-07-25T15:00:00',
    serviceLevel: 'express',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2047-01',
        itemName: 'Fashion garments',
        packageType: 'carton',
        quantity: 5,
        weightKg: 360,
        volumeM3: 2.2,
        dimensions: '80 × 60 × 55 cm'
      }
    ],
    declaredValue: 3600,
    handlingRequirement: 'standard',
    totalAmount: 89,
    distanceKm: 25.8,
    etaMinutes: 40,
    tollEstimate: 3.5,
    activity: [
      {
        id: 'act-2047-02',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-17T13:00:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2047-01',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-17T12:30:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2047-00',
        label: 'Order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-17T12:10:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2048',
    displayId: 'OR-2048',
    status: 'ready_for_shipment',
    source: 'manual',
    createdAt: '2026-07-18T09:30:00',
    createdBy: 'Anita Kim',
    entryReason: 'Customer placed order by phone',
    customerReference: 'PO-88213',
    internalNote: 'Confirmed by phone with Bessie Cooper.',
    clientId: 'cust-001',
    contactName: 'Bessie Cooper',
    contactEmail: 'bessie@toptalent.co',
    contactPhone: '(212) 555-0147',
    billingAccount: 'Top Talent — Net 30',
    currency: 'USD',
    pickupAddress: '32 Diamond Street',
    pickupAddressDetail: 'Warehouse 8, Brooklyn, NY 11222',
    pickupLat: 40.7285,
    pickupLng: -73.9451,
    deliveryAddress: '221 Washington St',
    deliveryAddressDetail: 'Suite 1013, Hoboken, NJ 07030',
    deliveryLat: 40.744,
    deliveryLng: -74.0324,
    requestedPickupAt: '2026-07-25T09:00:00',
    requiredDeliveryAt: '2026-07-26T16:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2048-01',
        itemName: 'Retail cartons',
        packageType: 'carton',
        quantity: 4,
        weightKg: 1990,
        volumeM3: 8.2,
        dimensions: '120 × 80 × 110 cm'
      }
    ],
    declaredValue: 8600,
    handlingRequirement: 'standard',
    totalAmount: 120,
    distanceKm: 38.6,
    etaMinutes: 54,
    tollEstimate: 8.4,
    activity: [
      {
        id: 'act-2048-03',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-18T10:12:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2048-02',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-18T09:48:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2048-01',
        label: 'Manual order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-18T09:30:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2049',
    displayId: 'OR-2049',
    status: 'pending_review',
    source: 'manual',
    createdAt: '2026-07-19T11:20:00',
    createdBy: 'Rachel Adams',
    entryReason: 'Email request',
    customerReference: 'EM-8823',
    clientId: 'cust-007',
    contactName: 'Shira Katz',
    contactEmail: 'shira@asterliving.com',
    contactPhone: '(929) 555-0155',
    billingAccount: 'Aster Living — Prepaid',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 3, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '60 Park Pl',
    deliveryAddressDetail: 'Suite 311, Newark, NJ 07102',
    deliveryLat: 40.7417,
    deliveryLng: -74.1664,
    requestedPickupAt: '2026-07-22T10:00:00',
    requiredDeliveryAt: '2026-07-23T09:00:00',
    serviceLevel: 'express',
    priority: 'high',
    packages: [
      {
        id: 'pkg-2049-01',
        itemName: 'Decor crates',
        packageType: 'carton',
        quantity: 3,
        weightKg: 210,
        volumeM3: 1.1,
        dimensions: '60 × 60 × 80 cm'
      }
    ],
    declaredValue: 3100,
    handlingRequirement: 'fragile',
    totalAmount: 83,
    distanceKm: 21.7,
    etaMinutes: 34,
    tollEstimate: 3.2,
    activity: [
      {
        id: 'act-2049-01',
        label: 'Manual order created',
        actor: 'Rachel Adams',
        timestamp: '2026-07-19T11:20:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2050',
    displayId: 'OR-2050',
    status: 'pending_review',
    source: 'manual',
    createdAt: '2026-07-20T08:45:00',
    createdBy: 'Rachel Adams',
    entryReason: 'Customer placed order by phone',
    customerReference: 'PH-2207',
    internalNote: 'Customer called to confirm pallet count.',
    clientId: 'cust-006',
    contactName: 'Tomer Adin',
    contactEmail: 'tomer@northwindmarket.com',
    contactPhone: '(646) 555-0128',
    billingAccount: 'Northwind Market — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 4, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '1359 Broadway',
    deliveryAddressDetail: 'Loading Bay 2, New York, NY 10018',
    deliveryLat: 40.7609,
    deliveryLng: -73.99,
    requestedPickupAt: '2026-07-24T09:00:00',
    requiredDeliveryAt: '2026-07-25T16:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2050-01',
        itemName: 'Grocery pallets',
        packageType: 'pallet',
        quantity: 2,
        weightKg: 640,
        volumeM3: 3.2,
        dimensions: '100 × 120 × 90 cm'
      }
    ],
    declaredValue: 2400,
    handlingRequirement: 'standard',
    totalAmount: 66,
    distanceKm: 16.4,
    etaMinutes: 28,
    tollEstimate: 2.1,
    activity: [
      {
        id: 'act-2050-01',
        label: 'Manual order created',
        actor: 'Rachel Adams',
        timestamp: '2026-07-20T08:45:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2051',
    displayId: 'OR-2051',
    status: 'draft',
    source: 'manual',
    createdAt: '2026-07-21T15:00:00',
    createdBy: 'Rachel Adams',
    entryReason: 'Customer placed order by phone',
    clientId: 'cust-001',
    contactName: 'Bessie Cooper',
    contactEmail: 'bessie@toptalent.co',
    contactPhone: '(212) 555-0147',
    billingAccount: 'Top Talent — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 5, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '110 Fulton St',
    deliveryAddressDetail: 'Suite 502, New York, NY 10038',
    deliveryLat: 40.7135,
    deliveryLng: -74.0173,
    requestedPickupAt: '2026-07-26T09:00:00',
    requiredDeliveryAt: '2026-07-27T16:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2051-01',
        itemName: 'Retail cartons',
        packageType: 'carton',
        quantity: 5,
        weightKg: 300,
        volumeM3: 2.0,
        dimensions: '90 × 70 × 60 cm'
      }
    ],
    declaredValue: 3000,
    handlingRequirement: 'standard',
    totalAmount: 52,
    distanceKm: 22.3,
    etaMinutes: 37,
    tollEstimate: 3.0,
    activity: [
      {
        id: 'act-2051-01',
        label: 'Manual order saved as draft',
        actor: 'Rachel Adams',
        timestamp: '2026-07-21T15:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2052',
    displayId: 'OR-2052',
    status: 'in_fulfilment',
    source: 'portal',
    createdAt: '2026-07-20T09:15:00',
    createdBy: 'Rachel Adams',
    clientId: 'cust-006',
    contactName: 'Tomer Adin',
    contactEmail: 'tomer@northwindmarket.com',
    contactPhone: '(646) 555-0128',
    billingAccount: 'Northwind Market — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 6, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '134 N 7th St',
    deliveryAddressDetail: 'Loading Bay 2, Brooklyn, NY 11211',
    deliveryLat: 40.7141,
    deliveryLng: -73.9631,
    requestedPickupAt: '2026-07-24T08:30:00',
    requiredDeliveryAt: '2026-07-25T14:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2052-01',
        itemName: 'Dry goods cartons',
        packageType: 'carton',
        quantity: 8,
        weightKg: 410,
        volumeM3: 3.6,
        dimensions: '60 × 45 × 50 cm'
      }
    ],
    declaredValue: 3900,
    handlingRequirement: 'standard',
    totalAmount: 76,
    distanceKm: 19.8,
    etaMinutes: 34,
    tollEstimate: 2.9,
    shipmentId: 'shp-3022',
    activity: [
      {
        id: 'act-2052-03',
        label: 'Shipment linked — SHP-3022',
        actor: 'System',
        timestamp: '2026-07-21T09:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2052-02',
        label: 'Order confirmed',
        actor: 'Rachel Adams',
        timestamp: '2026-07-20T10:30:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2052-01',
        label: 'Order created',
        actor: 'Rachel Adams',
        timestamp: '2026-07-20T09:15:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2053',
    displayId: 'OR-2053',
    status: 'in_fulfilment',
    source: 'api',
    createdAt: '2026-07-20T13:40:00',
    createdBy: 'System',
    clientId: 'cust-007',
    contactName: 'Shira Katz',
    contactEmail: 'shira@asterliving.com',
    contactPhone: '(929) 555-0155',
    billingAccount: 'Aster Living — Prepaid',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 1, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '5401 5th Ave',
    deliveryAddressDetail: 'Suite 214, Brooklyn, NY 11220',
    deliveryLat: 40.6514,
    deliveryLng: -74.0182,
    requestedPickupAt: '2026-07-23T10:00:00',
    requiredDeliveryAt: '2026-07-24T16:00:00',
    serviceLevel: 'express',
    priority: 'high',
    packages: [
      {
        id: 'pkg-2053-01',
        itemName: 'Ceramic homeware',
        packageType: 'carton',
        quantity: 12,
        weightKg: 260,
        volumeM3: 2.4,
        dimensions: '45 × 45 × 40 cm'
      }
    ],
    declaredValue: 4400,
    handlingRequirement: 'fragile',
    customerInstructions: 'Fragile — do not stack above two cartons.',
    totalAmount: 88,
    distanceKm: 8.6,
    etaMinutes: 19,
    tollEstimate: 1.4,
    shipmentId: 'shp-3023',
    activity: [
      {
        id: 'act-2053-03',
        label: 'Shipment linked — SHP-3023',
        actor: 'System',
        timestamp: '2026-07-21T11:20:00',
        icon: 'truck'
      },
      {
        id: 'act-2053-02',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-20T14:15:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2053-01',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-20T13:40:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2054',
    displayId: 'OR-2054',
    status: 'in_fulfilment',
    source: 'manual',
    createdAt: '2026-07-21T08:20:00',
    createdBy: 'Anita Kim',
    entryReason: 'Customer placed order by phone',
    clientId: 'cust-005',
    contactName: 'Maya Ostrovsky',
    contactEmail: 'maya@littlehaifa.com',
    contactPhone: '(347) 555-0173',
    billingAccount: 'Little Haifa — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 2, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '27-25 Jackson Ave',
    deliveryAddressDetail: 'Suite 408, Long Island City, NY 11101',
    deliveryLat: 40.7507,
    deliveryLng: -73.9545,
    requestedPickupAt: '2026-07-24T09:30:00',
    requiredDeliveryAt: '2026-07-25T13:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2054-01',
        itemName: 'Apparel cartons',
        packageType: 'carton',
        quantity: 6,
        weightKg: 180,
        volumeM3: 1.8,
        dimensions: '55 × 40 × 40 cm'
      }
    ],
    declaredValue: 2800,
    handlingRequirement: 'standard',
    totalAmount: 61,
    distanceKm: 11.3,
    etaMinutes: 23,
    tollEstimate: 1.8,
    shipmentId: 'shp-3024',
    activity: [
      {
        id: 'act-2054-03',
        label: 'Shipment linked — SHP-3024',
        actor: 'System',
        timestamp: '2026-07-22T08:00:00',
        icon: 'truck'
      },
      {
        id: 'act-2054-02',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-21T09:05:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2054-01',
        label: 'Order created',
        actor: 'Anita Kim',
        timestamp: '2026-07-21T08:20:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2055',
    displayId: 'OR-2055',
    status: 'in_fulfilment',
    source: 'portal',
    createdAt: '2026-07-21T12:00:00',
    createdBy: 'Rachel Adams',
    clientId: 'cust-001',
    contactName: 'Bessie Cooper',
    contactEmail: 'bessie@toptalent.co',
    contactPhone: '(212) 555-0147',
    billingAccount: 'Top Talent — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 3, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '40-15 108th St',
    deliveryAddressDetail: 'Loading Bay 6, Corona, NY 11368',
    deliveryLat: 40.7558,
    deliveryLng: -73.8708,
    requestedPickupAt: '2026-07-25T08:00:00',
    requiredDeliveryAt: '2026-07-26T15:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2055-01',
        itemName: 'Retail pallets',
        packageType: 'pallet',
        quantity: 3,
        weightKg: 520,
        volumeM3: 5.4,
        dimensions: '120 × 100 × 120 cm'
      }
    ],
    declaredValue: 4700,
    handlingRequirement: 'standard',
    totalAmount: 92,
    distanceKm: 16.7,
    etaMinutes: 30,
    tollEstimate: 2.6,
    shipmentId: 'shp-3025',
    activity: [
      {
        id: 'act-2055-03',
        label: 'Shipment linked — SHP-3025',
        actor: 'System',
        timestamp: '2026-07-22T10:15:00',
        icon: 'truck'
      },
      {
        id: 'act-2055-02',
        label: 'Order confirmed',
        actor: 'Rachel Adams',
        timestamp: '2026-07-21T12:45:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2055-01',
        label: 'Order created',
        actor: 'Rachel Adams',
        timestamp: '2026-07-21T12:00:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2056',
    displayId: 'OR-2056',
    status: 'completed',
    source: 'csv',
    createdAt: '2026-07-14T07:45:00',
    createdBy: 'System',
    clientId: 'cust-011',
    contactName: 'Talia Gold',
    contactEmail: 'talia@coastalgrocers.com',
    contactPhone: '(212) 555-0169',
    billingAccount: 'Coastal Grocers — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 4, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '2085 Jerome Ave',
    deliveryAddressDetail: 'Loading Bay 3, Bronx, NY 10453',
    deliveryLat: 40.8362,
    deliveryLng: -73.9286,
    requestedPickupAt: '2026-07-15T08:00:00',
    requiredDeliveryAt: '2026-07-16T12:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2056-01',
        itemName: 'Chilled produce crates',
        packageType: 'carton',
        quantity: 10,
        weightKg: 340,
        volumeM3: 3.0,
        dimensions: '50 × 40 × 45 cm'
      }
    ],
    declaredValue: 3100,
    handlingRequirement: 'temperature_controlled',
    customerInstructions: 'Keep below 6 °C for the full journey.',
    totalAmount: 84,
    distanceKm: 13.9,
    etaMinutes: 25,
    tollEstimate: 2.2,
    shipmentId: 'shp-3026',
    activity: [
      {
        id: 'act-2056-03',
        label: 'Shipment linked — SHP-3026',
        actor: 'System',
        timestamp: '2026-07-14T09:30:00',
        icon: 'truck'
      },
      {
        id: 'act-2056-02',
        label: 'Order confirmed',
        actor: 'System',
        timestamp: '2026-07-14T08:20:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2056-01',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-14T07:45:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2057',
    displayId: 'OR-2057',
    status: 'ready_for_shipment',
    source: 'portal',
    createdAt: '2026-07-19T08:20:00',
    createdBy: 'Anita Kim',
    customerReference: 'NM-44120',
    clientId: 'cust-006',
    contactName: 'Tomer Adin',
    contactEmail: 'tomer@northwindmarket.com',
    contactPhone: '(646) 555-0128',
    billingAccount: 'Northwind Market — Net 30',
    currency: 'USD',
    pickupAddress: 'Kearny Cold Chain Depot',
    pickupAddressDetail: 'Bay 12, Kearny, NJ 07032',
    pickupLat: 40.7684,
    pickupLng: -74.1454,
    deliveryAddress: '30 Montgomery St',
    deliveryAddressDetail: 'Loading bay B, Jersey City, NJ 07302',
    deliveryLat: 40.7238,
    deliveryLng: -74.0491,
    requestedPickupAt: '2026-07-26T07:30:00',
    requiredDeliveryAt: '2026-07-26T18:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2057-01',
        itemName: 'Dry goods pallets',
        packageType: 'pallet',
        quantity: 2,
        weightKg: 640,
        volumeM3: 4.1,
        dimensions: '120 × 100 × 140 cm'
      },
      {
        id: 'pkg-2057-02',
        itemName: 'Beverage cartons',
        packageType: 'carton',
        quantity: 6,
        weightKg: 120,
        volumeM3: 0.9,
        dimensions: '50 × 40 × 35 cm'
      }
    ],
    declaredValue: 5200,
    handlingRequirement: 'standard',
    totalAmount: 70,
    distanceKm: 27.4,
    etaMinutes: 44,
    tollEstimate: 4.2,
    activity: [
      {
        id: 'act-2057-03',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-19T09:05:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2057-02',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-19T08:41:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2057-01',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-19T08:20:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2058',
    displayId: 'OR-2058',
    status: 'ready_for_shipment',
    source: 'manual',
    createdAt: '2026-07-20T10:05:00',
    createdBy: 'David Palmer',
    entryReason: 'Customer placed order by phone',
    customerReference: 'BC-70455',
    internalNote: 'Flowers must stay chilled — confirm reefer van at dispatch.',
    clientId: 'cust-009',
    contactName: 'Lior Shani',
    contactEmail: 'lior@bloomandco.com',
    contactPhone: '(201) 555-0191',
    billingAccount: 'Bloom & Co — Net 15',
    currency: 'USD',
    pickupAddress: 'Bloom & Co Nursery',
    pickupAddressDetail: 'Gate 2, Secaucus, NJ 07094',
    pickupLat: 40.7895,
    pickupLng: -74.0565,
    deliveryAddress: '1300 Willow Ave',
    deliveryAddressDetail: 'Service entrance, Hoboken, NJ 07030',
    deliveryLat: 40.75,
    deliveryLng: -74.0384,
    requestedPickupAt: '2026-07-27T06:00:00',
    requiredDeliveryAt: '2026-07-27T11:00:00',
    serviceLevel: 'same_day',
    priority: 'urgent',
    packages: [
      {
        id: 'pkg-2058-01',
        itemName: 'Fresh floral arrangements',
        packageType: 'carton',
        quantity: 12,
        weightKg: 180,
        volumeM3: 2.6,
        dimensions: '60 × 45 × 50 cm'
      }
    ],
    declaredValue: 4400,
    handlingRequirement: 'temperature_controlled',
    customerInstructions: 'Keep between 4–8 °C. Deliver before the 12:00 setup call.',
    totalAmount: 127,
    distanceKm: 31.2,
    etaMinutes: 48,
    tollEstimate: 5.6,
    activity: [
      {
        id: 'act-2058-03',
        label: 'Order confirmed',
        actor: 'David Palmer',
        timestamp: '2026-07-20T10:52:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2058-02',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-20T10:24:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2058-01',
        label: 'Manual order created',
        actor: 'David Palmer',
        timestamp: '2026-07-20T10:05:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2059',
    displayId: 'OR-2059',
    status: 'ready_for_shipment',
    source: 'api',
    createdAt: '2026-07-21T13:40:00',
    createdBy: 'System',
    customerReference: 'DT-91007',
    clientId: 'cust-008',
    contactName: 'Ilan Ben-David',
    contactEmail: 'ilan@devtakhumtraders.com',
    contactPhone: '(973) 555-0136',
    billingAccount: 'Devtakhum Traders — Net 45',
    currency: 'USD',
    pickupAddress: 'Port Newark Terminal',
    pickupAddressDetail: 'Container yard C, Newark, NJ 07114',
    pickupLat: 40.6895,
    pickupLng: -74.1502,
    deliveryAddress: '1180 Raymond Blvd',
    deliveryAddressDetail: 'Building 7, Newark, NJ 07102',
    deliveryLat: 40.7297,
    deliveryLng: -74.1784,
    requestedPickupAt: '2026-07-28T09:00:00',
    requiredDeliveryAt: '2026-07-29T17:00:00',
    serviceLevel: 'express',
    priority: 'high',
    packages: [
      {
        id: 'pkg-2059-01',
        itemName: '20ft consolidated container',
        packageType: 'container',
        quantity: 1,
        weightKg: 2400,
        volumeM3: 33,
        dimensions: '605 × 244 × 259 cm'
      }
    ],
    declaredValue: 18500,
    handlingRequirement: 'standard',
    totalAmount: 171,
    distanceKm: 19.7,
    etaMinutes: 35,
    tollEstimate: 2.8,
    activity: [
      {
        id: 'act-2059-03',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-21T14:15:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2059-02',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-21T13:58:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2059-01',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-21T13:40:00',
        icon: 'file-plus-2'
      }
    ]
  },
  {
    id: 'ord-2060',
    displayId: 'OR-2060',
    status: 'ready_for_shipment',
    source: 'csv',
    createdAt: '2026-07-22T07:15:00',
    createdBy: 'System',
    customerReference: 'CG-33218',
    clientId: 'cust-011',
    contactName: 'Talia Gold',
    contactEmail: 'talia@coastalgrocers.com',
    contactPhone: '(212) 555-0169',
    billingAccount: 'Coastal Grocers — Net 30',
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: 'Dock 7, Newark, NJ 07102',
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: '260 W 39th St',
    deliveryAddressDetail: 'Rear dock, New York, NY 10018',
    deliveryLat: 40.7489,
    deliveryLng: -73.978,
    requestedPickupAt: '2026-07-29T08:30:00',
    requiredDeliveryAt: '2026-07-30T14:00:00',
    serviceLevel: 'regular',
    priority: 'normal',
    packages: [
      {
        id: 'pkg-2060-01',
        itemName: 'Packaged grocery pallets',
        packageType: 'pallet',
        quantity: 3,
        weightKg: 1450,
        volumeM3: 9.6,
        dimensions: '120 × 100 × 150 cm'
      },
      {
        id: 'pkg-2060-02',
        itemName: 'Glassware cartons',
        packageType: 'carton',
        quantity: 4,
        weightKg: 90,
        volumeM3: 0.7,
        dimensions: '45 × 45 × 40 cm'
      }
    ],
    declaredValue: 7300,
    handlingRequirement: 'fragile',
    customerInstructions: 'Stack glassware cartons on top — do not load under pallets.',
    totalAmount: 102,
    distanceKm: 34.9,
    etaMinutes: 52,
    tollEstimate: 6.1,
    activity: [
      {
        id: 'act-2060-03',
        label: 'Order confirmed',
        actor: 'Anita Kim',
        timestamp: '2026-07-22T08:02:00',
        icon: 'badge-check'
      },
      {
        id: 'act-2060-02',
        label: 'Addresses validated',
        actor: 'System',
        timestamp: '2026-07-22T07:36:00',
        icon: 'map-pin-check'
      },
      {
        id: 'act-2060-01',
        label: 'Order created',
        actor: 'System',
        timestamp: '2026-07-22T07:15:00',
        icon: 'file-plus-2'
      }
    ]
  }
]

const GENERATED_COUNT = 60

const ANCHOR = new Date('2026-07-20T00:00:00Z').getTime()

const AREAS = [
  {
    city: 'New York',
    state: 'NY',
    zip: '10018',
    lat: 40.7549,
    lng: -73.984,
    streets: ['256 W 38th St', '525 7th Ave', '1407 Broadway', '330 W 34th St']
  },
  {
    city: 'New York',
    state: 'NY',
    zip: '10038',
    lat: 40.7075,
    lng: -74.0113,
    streets: ['100 Gold St', '127 John St', '150 Nassau St', '80 Maiden Ln']
  },
  {
    city: 'Brooklyn',
    state: 'NY',
    zip: '11211',
    lat: 40.7081,
    lng: -73.9571,
    streets: ['80 N 6th St', '111 Wythe Ave', '175 Grand St', '218 Bedford Ave']
  },
  {
    city: 'Brooklyn',
    state: 'NY',
    zip: '11220',
    lat: 40.6454,
    lng: -74.0122,
    streets: ['220 36th St', '4720 5th Ave', '5601 8th Ave', '140 58th St']
  },
  {
    city: 'Long Island City',
    state: 'NY',
    zip: '11101',
    lat: 40.7447,
    lng: -73.9485,
    streets: ['27-01 Queens Plaza N', '43-10 Crescent St', '10-17 Jackson Ave', '31-00 47th Ave']
  },
  {
    city: 'Corona',
    state: 'NY',
    zip: '11368',
    lat: 40.7498,
    lng: -73.8648,
    streets: ['111-20 Corona Ave', '37-24 Junction Blvd', '99-01 Northern Blvd', '52-10 108th St']
  },
  {
    city: 'Bronx',
    state: 'NY',
    zip: '10453',
    lat: 40.8302,
    lng: -73.9226,
    streets: ['1780 Grand Concourse', '35 W Burnside Ave', '1500 University Ave', '1875 Sedgwick Ave']
  },
  {
    city: 'Jersey City',
    state: 'NJ',
    zip: '07302',
    lat: 40.7178,
    lng: -74.0431,
    streets: ['160 Grove St', '25 Newark Ave', '101 Hudson St', '2 Exchange Pl']
  },
  {
    city: 'Hoboken',
    state: 'NJ',
    zip: '07030',
    lat: 40.744,
    lng: -74.0324,
    streets: ['50 Harrison St', '111 River St', '720 Monroe St', '1 Newark St']
  },
  {
    city: 'Newark',
    state: 'NJ',
    zip: '07102',
    lat: 40.7357,
    lng: -74.1724,
    streets: ['744 Broad St', '89 Market St', '50 Halsey St', '1 Center St']
  }
]

const ITEMS = ['Wireless Headset', 'LED Panel Kit', 'Ceramic Tile Pack', 'Filter Cartridge', 'Cable Reel']

const STATUS_CYCLE: OrderStatus[] = [
  ...Array<OrderStatus>(35).fill('ready_for_shipment'),
  ...Array<OrderStatus>(15).fill('in_fulfilment'),
  ...Array<OrderStatus>(4).fill('pending_review'),
  ...Array<OrderStatus>(3).fill('order_received'),
  ...Array<OrderStatus>(3).fill('completed')
]

const iso = (dayOffset: number, hour: number): string => {
  const d = new Date(ANCHOR + dayOffset * 86_400_000 + hour * 3_600_000)
  const pad2 = (n: number) => `${n}`.padStart(2, '0')

  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`
}

const buildOrder = (i: number): Order => {
  const area = AREAS[i % AREAS.length]
  const client = clients[i % clients.length]
  const packageCount = (i % 3) + 1

  const packages: OrderPackage[] = Array.from({ length: packageCount }, (_, p) => ({
    id: `ord-gen-${i}-pkg-${p}`,
    itemName: ITEMS[(i + p) % ITEMS.length],
    packageType: p % 3 === 2 ? 'pallet' : 'carton',
    quantity: ((i + p) % 4) + 1,
    weightKg: 4 + ((i + p) % 12),
    volumeM3: 0.1 + ((i + p) % 5) / 10,
    dimensions: '40 x 30 x 25 cm'
  }))

  return {
    id: `ord-gen-${String(i).padStart(3, '0')}`,
    displayId: `OR-${2100 + i}`,
    status: STATUS_CYCLE[i % STATUS_CYCLE.length],
    source: (['manual', 'api', 'portal', 'csv'] as const)[i % 4],
    createdAt: iso(-(i % 14), 9),
    createdBy: 'Dispatch Desk',
    clientId: client.id,
    contactName: client.contactName,
    contactEmail: client.email,
    contactPhone: client.phone,
    billingAccount: client.billingAccount,
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: `Dock ${(i % 6) + 1}, Newark, NJ 07102`,
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: area.streets[Math.floor(i / AREAS.length) % area.streets.length],
    deliveryAddressDetail: `${area.city}, ${area.state} ${area.zip}`,
    deliveryLat: area.lat + ((i % 7) - 3) * 0.002,
    deliveryLng: area.lng + ((i % 11) - 5) * 0.002,
    requestedPickupAt: iso(i % 5, 8 + (i % 3)),
    requiredDeliveryAt: iso(i % 5, 14 + (i % 4)),
    serviceLevel: (['regular', 'express', 'same_day'] as const)[i % 3],
    priority: (['normal', 'high', 'urgent'] as const)[i % 3],
    packages,
    declaredValue: 250 + i * 15,
    handlingRequirement: (['standard', 'fragile', 'temperature_controlled', 'hazardous'] as const)[i % 4],
    totalAmount: 180 + i * 12,
    distanceKm: 8 + (i % 30),
    etaMinutes: 25 + (i % 60),
    tollEstimate: 4 + (i % 9),
    activity: [
      {
        id: `ord-gen-${i}-act-1`,
        label: 'Order created',
        actor: 'Dispatch Desk',
        timestamp: iso(-(i % 14), 9),
        icon: 'file-plus-2'
      }
    ]
  }
}

const generated: Order[] = Array.from({ length: GENERATED_COUNT }, (_, i) => buildOrder(i))

const HISTORY_FIRST_DAY = -180
const HISTORY_LAST_DAY = -1
const HISTORY_PER_DAY = 2
const HISTORY_COUNT = (HISTORY_LAST_DAY - HISTORY_FIRST_DAY + 1) * HISTORY_PER_DAY

const buildHistoricalOrder = (i: number): Order => {
  const dayOffset = HISTORY_FIRST_DAY + Math.floor(i / HISTORY_PER_DAY)
  const area = AREAS[i % AREAS.length]
  const client = clients[(i * 5) % clients.length]
  const packageCount = (i % 3) + 1
  const cancelled = i % 14 === 0
  const createdAt = iso(dayOffset, 8 + (i % 9))

  const progress = i / (HISTORY_COUNT - 1)
  const wave = 1 + 0.18 * Math.sin(i / 4.5)
  const totalAmount = Math.round((190 + i * 1.6) * (0.78 + 0.4 * progress) * wave)

  const packages: OrderPackage[] = Array.from({ length: packageCount }, (_, p) => ({
    id: `ord-hist-${i}-pkg-${p}`,
    itemName: ITEMS[(i + p) % ITEMS.length],
    packageType: p % 3 === 2 ? 'pallet' : 'carton',
    quantity: ((i + p) % 4) + 1,
    weightKg: 4 + ((i + p) % 12),
    volumeM3: 0.1 + ((i + p) % 5) / 10,
    dimensions: '40 x 30 x 25 cm'
  }))

  return {
    id: `ord-hist-${String(i).padStart(3, '0')}`,
    displayId: `OR-${1500 + i}`,
    status: cancelled ? 'cancelled' : 'completed',
    source: (['manual', 'api', 'portal', 'csv'] as const)[i % 4],
    createdAt,
    createdBy: 'Dispatch Desk',
    clientId: client.id,
    contactName: client.contactName,
    contactEmail: client.email,
    contactPhone: client.phone,
    billingAccount: client.billingAccount,
    currency: 'USD',
    pickupAddress: 'Newark Hub',
    pickupAddressDetail: `Dock ${(i % 6) + 1}, Newark, NJ 07102`,
    pickupLat: 40.7357,
    pickupLng: -74.1724,
    deliveryAddress: area.streets[Math.floor(i / AREAS.length) % area.streets.length],
    deliveryAddressDetail: `${area.city}, ${area.state} ${area.zip}`,
    deliveryLat: area.lat + ((i % 7) - 3) * 0.002,
    deliveryLng: area.lng + ((i % 11) - 5) * 0.002,
    requestedPickupAt: iso(dayOffset + 1, 8 + (i % 3)),
    requiredDeliveryAt: iso(dayOffset + 2, 14 + (i % 4)),
    serviceLevel: (['regular', 'regular', 'express', 'same_day'] as const)[i % 4],
    priority: (['normal', 'high', 'urgent'] as const)[i % 3],
    packages,
    declaredValue: 250 + (i % 40) * 15,
    handlingRequirement: (['standard', 'fragile', 'temperature_controlled', 'hazardous'] as const)[i % 4],
    totalAmount,
    distanceKm: 8 + (i % 30),
    etaMinutes: 25 + (i % 60),
    tollEstimate: 4 + (i % 9),
    activity: [
      {
        id: `ord-hist-${i}-act-2`,
        label: cancelled ? 'Order cancelled' : 'Order completed',
        actor: 'Dispatch Desk',
        timestamp: iso(dayOffset + 2, 16),
        icon: cancelled ? 'ban' : 'badge-check'
      },
      {
        id: `ord-hist-${i}-act-1`,
        label: 'Order created',
        actor: 'Dispatch Desk',
        timestamp: createdAt,
        icon: 'file-plus-2'
      }
    ]
  }
}

const historical: Order[] = Array.from({ length: HISTORY_COUNT }, (_, i) => buildHistoricalOrder(i))

const HUBS = warehouses.map(w => ({
  name: w.name,
  detail: `${w.addressParts.city}, ${w.addressParts.state} ${w.addressParts.postalCode}`,
  lat: w.lat,
  lng: w.lng
}))

const CLIENT_SITE_PICKUPS = new Set([
  'Port Newark Terminal',
  'Kearny Cold Chain Depot',
  '32 Diamond Street',
  'Bloom & Co Nursery'
])

const dockLabel = (detail?: string) => detail?.match(/^Dock \d+/)?.[0] ?? 'Dock 1'

const withPickupAndRoute = (order: Order, index: number): Order => {
  const hub = CLIENT_SITE_PICKUPS.has(order.pickupAddress) ? null : HUBS[index % HUBS.length]
  const lat = hub?.lat ?? order.pickupLat
  const lng = hub?.lng ?? order.pickupLng
  const km = haversineKm(lat, lng, order.deliveryLat, order.deliveryLng)

  return {
    ...order,
    pickupAddress: hub?.name ?? order.pickupAddress,
    pickupAddressDetail: hub ? `${dockLabel(order.pickupAddressDetail)}, ${hub.detail}` : order.pickupAddressDetail,
    pickupLat: lat,
    pickupLng: lng,
    distanceKm: Math.round(km * 10) / 10,
    etaMinutes: legMinutes(km)
  }
}

export const db: Order[] = [...authored, ...generated, ...historical].map(withPickupAndRoute)
