// Type Imports
import type { Supplier } from '@/types/entities/supplier'

export const db: Supplier[] = [
  {
    id: 'sup-001',
    name: 'Northwind Distribution',
    contactPerson: 'John Anderson',
    email: 'john.anderson@northwind.com',
    phone: '+1 (312) 555-0189',
    address: '742 Evergreen Terrace\nSpringfield, IL 62704\nUnited States',
    supplierCode: 'SUP-1001',
    category: 'Electronics & Accessories',
    status: 'active',
    accountOwner: 'Sarah Johnson',
    description: 'Primary consumer electronics distributor covering accessories, chargers and networking gear.',
    onboardedAt: '2018-04-11',
    lastUpdatedAt: '2026-07-22',
    lastUpdatedBy: 'Sarah Johnson',
    contactJobTitle: 'Head of Wholesale',
    addressLine1: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62704',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    leadTimeDays: 7,
    minimumOrderValue: 2500,
    incoterms: 'FOB',
    priceValidityDays: 60,
    productsSupplied: ['Electronics', 'Accessories', 'Networking'],
    notes: 'Holds buffer stock on best sellers. Confirm allocation before quarter end — volumes tighten in December.',
    documents: [
      {
        id: 'sdoc-001-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '156 KB',
        uploadedAt: '2026-01-12',
        uploadedBy: 'Sarah Johnson'
      },
      {
        id: 'sdoc-001-2',
        name: 'Business Registration',
        type: 'pdf',
        sizeLabel: '742 KB',
        uploadedAt: '2026-01-12',
        uploadedBy: 'Sarah Johnson'
      },
      {
        id: 'sdoc-001-3',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '318 KB',
        uploadedAt: '2026-03-05',
        uploadedBy: 'Michael Chen'
      }
    ],
    activity: [
      {
        id: 'sact-001-1',
        label: 'Purchase order PO-2026-00013 created',
        at: '2026-07-22T14:10:00',
        actor: 'Sarah Johnson',
        icon: 'plus-square'
      },
      {
        id: 'sact-001-2',
        label: 'Shipment received against PO-2026-00025',
        at: '2026-07-18T09:35:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      },
      {
        id: 'sact-001-3',
        label: 'Certificate of Insurance uploaded',
        at: '2026-07-05T11:20:00',
        actor: 'Michael Chen',
        icon: 'file-text'
      },
      {
        id: 'sact-001-4',
        label: 'Primary contact details updated',
        at: '2026-06-27T16:45:00',
        actor: 'Sarah Johnson',
        icon: 'user'
      }
    ],
    historicalPOs: 146,
    historicalSpend: 1_320_000
  },
  {
    id: 'sup-002',
    name: 'Apex Supply Co.',
    contactPerson: 'Maria Gomez',
    email: 'maria.gomez@apexsupply.com',
    phone: '+1 (415) 555-0142',
    address: '188 Harbor Blvd\nOakland, CA 94607\nUnited States',
    supplierCode: 'SUP-1002',
    category: 'Packaging & Labels',
    status: 'active',
    accountOwner: 'Michael Chen',
    description: 'Corrugated packaging and thermal label supplier for the West Coast fulfilment sites.',
    onboardedAt: '2019-09-30',
    lastUpdatedAt: '2026-07-14',
    lastUpdatedBy: 'Michael Chen',
    contactJobTitle: 'Account Director',
    addressLine1: '188 Harbor Blvd',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94607',
    country: 'United States',
    paymentTerms: 'Net 15',
    currency: 'USD',
    leadTimeDays: 5,
    minimumOrderValue: 1200,
    incoterms: 'DAP',
    priceValidityDays: 30,
    productsSupplied: ['Packaging', 'Labels', 'Pallet Wrap'],
    notes: 'Runs a standing weekly carton replenishment. Custom print plates need 10 days on top of lead time.',
    documents: [
      {
        id: 'sdoc-002-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '148 KB',
        uploadedAt: '2026-01-22',
        uploadedBy: 'Michael Chen'
      },
      {
        id: 'sdoc-002-2',
        name: 'Bank Details',
        type: 'pdf',
        sizeLabel: '96 KB',
        uploadedAt: '2026-02-08',
        uploadedBy: 'Emily Davis'
      }
    ],
    activity: [
      {
        id: 'sact-002-1',
        label: 'Shipment received against PO-2026-00026',
        at: '2026-07-14T08:50:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      },
      {
        id: 'sact-002-2',
        label: 'Purchase order PO-2026-00026 created',
        at: '2026-07-06T13:05:00',
        actor: 'Michael Chen',
        icon: 'plus-square'
      },
      {
        id: 'sact-002-3',
        label: 'Updated price list uploaded',
        at: '2026-06-19T10:30:00',
        actor: 'Emily Davis',
        icon: 'file-text'
      }
    ],
    historicalPOs: 118,
    historicalSpend: 1_040_000
  },
  {
    id: 'sup-003',
    name: 'Horizon Wholesale',
    contactPerson: 'David Kim',
    email: 'david.kim@horizonws.com',
    phone: '+1 (206) 555-0177',
    address: '55 Rainier Ave\nSeattle, WA 98144\nUnited States',
    supplierCode: 'SUP-1003',
    category: 'Office Supplies',
    status: 'active',
    accountOwner: 'Emily Davis',
    description: 'General wholesale account covering office consumables and warehouse breakroom supplies.',
    onboardedAt: '2020-02-17',
    lastUpdatedAt: '2026-06-30',
    lastUpdatedBy: 'Emily Davis',
    contactJobTitle: 'Regional Sales Manager',
    addressLine1: '55 Rainier Ave',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98144',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    leadTimeDays: 9,
    minimumOrderValue: 750,
    incoterms: 'DDP',
    priceValidityDays: 45,
    productsSupplied: ['Office Supplies', 'Janitorial', 'Safety Gear'],
    notes: 'Small-order friendly — no surcharge under the minimum, just a slower pick window.',
    documents: [
      {
        id: 'sdoc-003-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '151 KB',
        uploadedAt: '2026-02-14',
        uploadedBy: 'Emily Davis'
      }
    ],
    activity: [
      {
        id: 'sact-003-1',
        label: 'Purchase order PO-2026-00015 created',
        at: '2026-06-30T15:25:00',
        actor: 'Emily Davis',
        icon: 'plus-square'
      },
      {
        id: 'sact-003-2',
        label: 'Inbound delivery received at the warehouse',
        at: '2026-06-21T09:10:00',
        actor: 'Jason Miller',
        icon: 'truck'
      },
      {
        id: 'sact-003-3',
        label: 'W-9 Form uploaded',
        at: '2026-05-30T12:00:00',
        actor: 'Emily Davis',
        icon: 'file-text'
      }
    ],
    historicalPOs: 92,
    historicalSpend: 810_000
  },
  {
    id: 'sup-004',
    name: 'Cascade Logistics Partners',
    contactPerson: 'Sarah Bennett',
    email: 'sarah.bennett@cascadelp.com',
    phone: '+1 (503) 555-0163',
    address: '900 Willamette St\nPortland, OR 97205\nUnited States',
    supplierCode: 'SUP-1004',
    category: 'Logistics Services',
    status: 'active',
    accountOwner: 'Daniel Lee',
    description: 'Third-party carrier and drayage partner used for Pacific Northwest inbound freight.',
    onboardedAt: '2021-06-08',
    lastUpdatedAt: '2026-07-28',
    lastUpdatedBy: 'Daniel Lee',
    contactJobTitle: 'Partnerships Lead',
    addressLine1: '900 Willamette St',
    city: 'Portland',
    state: 'OR',
    postalCode: '97205',
    country: 'United States',
    paymentTerms: 'Net 60',
    currency: 'USD',
    leadTimeDays: 12,
    minimumOrderValue: 3000,
    incoterms: 'EXW',
    priceValidityDays: 90,
    productsSupplied: ['Freight Services', 'Drayage', 'Warehousing'],
    notes: 'Rate card is reviewed twice a year. Fuel surcharge is billed separately from the base linehaul.',
    documents: [
      {
        id: 'sdoc-004-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '154 KB',
        uploadedAt: '2026-01-30',
        uploadedBy: 'Daniel Lee'
      },
      {
        id: 'sdoc-004-2',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '288 KB',
        uploadedAt: '2026-04-02',
        uploadedBy: 'Daniel Lee'
      },
      {
        id: 'sdoc-004-3',
        name: 'Business Registration',
        type: 'pdf',
        sizeLabel: '694 KB',
        uploadedAt: '2026-01-30',
        uploadedBy: 'Rachel Adams'
      }
    ],
    activity: [
      {
        id: 'sact-004-1',
        label: 'Rate card revision uploaded',
        at: '2026-07-28T10:40:00',
        actor: 'Daniel Lee',
        icon: 'file-text'
      },
      {
        id: 'sact-004-2',
        label: 'Inbound delivery checked in at the dock',
        at: '2026-07-17T07:55:00',
        actor: 'Jason Miller',
        icon: 'truck'
      },
      {
        id: 'sact-004-3',
        label: 'Purchase order PO-2026-00016 created',
        at: '2026-07-09T14:15:00',
        actor: 'Daniel Lee',
        icon: 'plus-square'
      },
      {
        id: 'sact-004-4',
        label: 'Account owner reassigned',
        at: '2026-05-14T11:05:00',
        actor: 'Rachel Adams',
        icon: 'user'
      }
    ],
    historicalPOs: 64,
    historicalSpend: 545_000
  },
  {
    id: 'sup-005',
    name: 'Pacific Component Group',
    contactPerson: 'Elena Ruiz',
    email: 'elena.ruiz@pacificcomponent.com',
    phone: '+1 (213) 555-0134',
    address: '3400 Alameda Street, Building C\nLos Angeles, CA 90058\nUnited States',
    supplierCode: 'SUP-1005',
    category: 'Electronics & Accessories',
    status: 'active',
    accountOwner: 'Sarah Johnson',
    description: 'High-volume component importer supplying audio, cabling and power accessories out of the LA port.',
    onboardedAt: '2019-01-24',
    lastUpdatedAt: '2026-07-31',
    lastUpdatedBy: 'Sarah Johnson',
    contactJobTitle: 'VP of Sales',
    addressLine1: '3400 Alameda Street',
    addressLine2: 'Building C',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90058',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    leadTimeDays: 14,
    minimumOrderValue: 4000,
    incoterms: 'CIF',
    priceValidityDays: 30,
    productsSupplied: ['Electronics', 'Cables', 'Power Accessories', 'Audio'],
    notes: 'Container arrivals cluster mid-month. Book receiving dock slots a week ahead during peak season.',
    documents: [
      {
        id: 'sdoc-005-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '162 KB',
        uploadedAt: '2026-01-09',
        uploadedBy: 'Sarah Johnson'
      },
      {
        id: 'sdoc-005-2',
        name: 'Business Registration',
        type: 'pdf',
        sizeLabel: '806 KB',
        uploadedAt: '2026-01-09',
        uploadedBy: 'Sarah Johnson'
      },
      {
        id: 'sdoc-005-3',
        name: 'Bank Details',
        type: 'pdf',
        sizeLabel: '104 KB',
        uploadedAt: '2026-02-20',
        uploadedBy: 'Marcus Bennett'
      },
      {
        id: 'sdoc-005-4',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '332 KB',
        uploadedAt: '2026-05-11',
        uploadedBy: 'Sarah Johnson'
      }
    ],
    activity: [
      {
        id: 'sact-005-1',
        label: 'Purchase order PO-2026-00005 created',
        at: '2026-07-31T09:20:00',
        actor: 'Sarah Johnson',
        icon: 'plus-square'
      },
      {
        id: 'sact-005-2',
        label: 'Partial shipment received against PO-2026-00017',
        at: '2026-07-23T13:40:00',
        actor: 'Jason Miller',
        icon: 'truck'
      },
      {
        id: 'sact-005-3',
        label: 'Certificate of Insurance renewed',
        at: '2026-07-02T10:10:00',
        actor: 'Sarah Johnson',
        icon: 'file-text'
      },
      {
        id: 'sact-005-4',
        label: 'Secondary contact added',
        at: '2026-06-11T15:55:00',
        actor: 'Marcus Bennett',
        icon: 'user'
      }
    ],
    historicalPOs: 134,
    historicalSpend: 1_240_000
  },
  {
    id: 'sup-006',
    name: 'Midwest Industrial Works',
    contactPerson: 'Thomas Whitfield',
    email: 'thomas.whitfield@midwestindustrial.com',
    phone: '+1 (773) 555-0198',
    address: '2250 W Grand Avenue, Unit 4\nChicago, IL 60612\nUnited States',
    supplierCode: 'SUP-1006',
    category: 'Industrial Equipment',
    status: 'limited',
    accountOwner: 'Jason Miller',
    description: 'Materials-handling equipment vendor for conveyors, dock levellers and spare parts.',
    onboardedAt: '2022-03-15',
    lastUpdatedAt: '2026-06-12',
    lastUpdatedBy: 'Jason Miller',
    contactJobTitle: 'Account Director',
    addressLine1: '2250 W Grand Avenue',
    addressLine2: 'Unit 4',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60612',
    country: 'United States',
    paymentTerms: 'Net 60',
    currency: 'USD',
    leadTimeDays: 21,
    minimumOrderValue: 5000,
    incoterms: 'EXW',
    priceValidityDays: 90,
    productsSupplied: ['Conveyors', 'Dock Equipment', 'Spare Parts'],
    notes: 'Limited to spare parts only until the two open warranty claims on the 2025 conveyor build are closed.',
    documents: [
      {
        id: 'sdoc-006-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '149 KB',
        uploadedAt: '2026-03-04',
        uploadedBy: 'Jason Miller'
      },
      {
        id: 'sdoc-006-2',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '301 KB',
        uploadedAt: '2026-03-04',
        uploadedBy: 'Jason Miller'
      }
    ],
    activity: [
      {
        id: 'sact-006-1',
        label: 'Status changed to limited',
        at: '2026-06-12T11:30:00',
        actor: 'Jason Miller',
        icon: 'user'
      },
      {
        id: 'sact-006-2',
        label: 'Warranty claim documentation uploaded',
        at: '2026-06-04T14:45:00',
        actor: 'Rachel Adams',
        icon: 'file-text'
      },
      {
        id: 'sact-006-3',
        label: 'Replacement units received for warranty claim',
        at: '2026-05-22T08:25:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      }
    ],
    historicalPOs: 57,
    historicalSpend: 486_000
  },
  {
    id: 'sup-007',
    name: 'Blue Ridge Materials',
    contactPerson: 'Grace Okafor',
    email: 'grace.okafor@blueridgematerials.com',
    phone: '+1 (828) 555-0121',
    address: '118 Riverside Drive\nAsheville, NC 28801\nUnited States',
    supplierCode: 'SUP-1007',
    category: 'Raw Materials',
    status: 'active',
    accountOwner: 'Rachel Adams',
    description: 'Regional raw materials mill supplying timber, resin pellets and recycled fibre stock.',
    onboardedAt: '2020-11-05',
    lastUpdatedAt: '2026-07-19',
    lastUpdatedBy: 'Rachel Adams',
    contactJobTitle: 'Sales Manager',
    addressLine1: '118 Riverside Drive',
    city: 'Asheville',
    state: 'NC',
    postalCode: '28801',
    country: 'United States',
    paymentTerms: 'Due on receipt',
    currency: 'USD',
    leadTimeDays: 10,
    minimumOrderValue: 1800,
    incoterms: 'FOB',
    priceValidityDays: 15,
    productsSupplied: ['Timber', 'Resin Pellets', 'Recycled Fibre'],
    notes: 'Pricing tracks a commodity index, so quotes expire fast. Re-confirm before releasing any large PO.',
    documents: [
      {
        id: 'sdoc-007-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '158 KB',
        uploadedAt: '2026-02-02',
        uploadedBy: 'Rachel Adams'
      },
      {
        id: 'sdoc-007-2',
        name: 'Bank Details',
        type: 'pdf',
        sizeLabel: '92 KB',
        uploadedAt: '2026-02-02',
        uploadedBy: 'Rachel Adams'
      },
      {
        id: 'sdoc-007-3',
        name: 'Business Registration',
        type: 'pdf',
        sizeLabel: '718 KB',
        uploadedAt: '2026-04-16',
        uploadedBy: 'Sofia Alvarez'
      }
    ],
    activity: [
      {
        id: 'sact-007-1',
        label: 'Purchase order PO-2026-00007 created',
        at: '2026-07-19T10:05:00',
        actor: 'Rachel Adams',
        icon: 'plus-square'
      },
      {
        id: 'sact-007-2',
        label: 'Partial shipment received against PO-2026-00019',
        at: '2026-07-08T12:35:00',
        actor: 'Jason Miller',
        icon: 'truck'
      },
      {
        id: 'sact-007-3',
        label: 'Quarterly price index sheet uploaded',
        at: '2026-06-25T09:50:00',
        actor: 'Sofia Alvarez',
        icon: 'file-text'
      }
    ],
    historicalPOs: 108,
    historicalSpend: 925_000
  },
  {
    id: 'sup-008',
    name: 'Lone Star Chemical Supply',
    contactPerson: 'Robert Hayes',
    email: 'robert.hayes@lonestarchem.com',
    phone: '+1 (214) 555-0157',
    address: '7700 Stemmons Freeway, Suite 210\nDallas, TX 75247\nUnited States',
    supplierCode: 'SUP-1008',
    category: 'Chemicals',
    status: 'active',
    accountOwner: 'Marcus Bennett',
    description: 'Industrial cleaning agents, adhesives and coatings supplier with hazmat-certified freight.',
    onboardedAt: '2021-10-19',
    lastUpdatedAt: '2026-07-25',
    lastUpdatedBy: 'Marcus Bennett',
    contactJobTitle: 'Regional Sales Lead',
    addressLine1: '7700 Stemmons Freeway',
    addressLine2: 'Suite 210',
    city: 'Dallas',
    state: 'TX',
    postalCode: '75247',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    leadTimeDays: 8,
    minimumOrderValue: 2200,
    incoterms: 'DAP',
    priceValidityDays: 45,
    productsSupplied: ['Cleaning Agents', 'Adhesives', 'Coatings'],
    notes: 'Every inbound load needs an SDS packet on the trailer. Refuse receipt without one.',
    documents: [
      {
        id: 'sdoc-008-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '153 KB',
        uploadedAt: '2026-01-28',
        uploadedBy: 'Marcus Bennett'
      },
      {
        id: 'sdoc-008-2',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '344 KB',
        uploadedAt: '2026-03-19',
        uploadedBy: 'Marcus Bennett'
      }
    ],
    activity: [
      {
        id: 'sact-008-1',
        label: 'Safety data sheets refreshed',
        at: '2026-07-25T13:15:00',
        actor: 'Marcus Bennett',
        icon: 'file-text'
      },
      {
        id: 'sact-008-2',
        label: 'Shipment received against PO-2026-00020',
        at: '2026-07-15T08:05:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      },
      {
        id: 'sact-008-3',
        label: 'Purchase order PO-2026-00020 created',
        at: '2026-07-03T15:30:00',
        actor: 'Marcus Bennett',
        icon: 'plus-square'
      }
    ],
    historicalPOs: 81,
    historicalSpend: 690_000
  },
  {
    id: 'sup-009',
    name: 'Ironbound Packaging',
    contactPerson: 'Laura Mercado',
    email: 'laura.mercado@ironboundpkg.com',
    phone: '+1 (973) 555-0146',
    address: '512 Wilson Avenue\nNewark, NJ 07105\nUnited States',
    supplierCode: 'SUP-1009',
    category: 'Packaging & Labels',
    status: 'limited',
    accountOwner: 'Sofia Alvarez',
    description: 'East Coast secondary packaging source used to cover overflow when Apex runs long.',
    onboardedAt: '2023-05-22',
    lastUpdatedAt: '2026-06-05',
    lastUpdatedBy: 'Sofia Alvarez',
    contactJobTitle: 'Key Accounts Manager',
    addressLine1: '512 Wilson Avenue',
    city: 'Newark',
    state: 'NJ',
    postalCode: '07105',
    country: 'United States',
    paymentTerms: 'Net 15',
    currency: 'USD',
    leadTimeDays: 6,
    minimumOrderValue: 900,
    incoterms: 'DDP',
    priceValidityDays: 30,
    productsSupplied: ['Packaging', 'Void Fill'],
    notes: 'Overflow supplier only — two late deliveries in Q1 kept it off the primary list.',
    documents: [
      {
        id: 'sdoc-009-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '147 KB',
        uploadedAt: '2026-02-26',
        uploadedBy: 'Sofia Alvarez'
      }
    ],
    activity: [
      {
        id: 'sact-009-1',
        label: 'Status changed to limited',
        at: '2026-06-05T09:40:00',
        actor: 'Sofia Alvarez',
        icon: 'user'
      },
      {
        id: 'sact-009-2',
        label: 'Delivery performance review filed',
        at: '2026-05-28T14:20:00',
        actor: 'Rachel Adams',
        icon: 'file-text'
      },
      {
        id: 'sact-009-3',
        label: 'Late inbound delivery received and logged',
        at: '2026-04-30T10:55:00',
        actor: 'Jason Miller',
        icon: 'truck'
      }
    ],
    historicalPOs: 73,
    historicalSpend: 612_000
  },
  {
    id: 'sup-010',
    name: 'Peachtree Textile Mills',
    contactPerson: 'Andre Coleman',
    email: 'andre.coleman@peachtreetextile.com',
    phone: '+1 (404) 555-0172',
    address: '1650 Marietta Boulevard NW\nAtlanta, GA 30318\nUnited States',
    supplierCode: 'SUP-1010',
    category: 'Apparel & Textiles',
    status: 'active',
    accountOwner: 'Emily Davis',
    description: 'Cut-and-sew mill producing branded workwear and packaging textiles for the fulfilment sites.',
    onboardedAt: '2020-07-13',
    lastUpdatedAt: '2026-07-21',
    lastUpdatedBy: 'Emily Davis',
    contactJobTitle: 'Business Development Manager',
    addressLine1: '1650 Marietta Boulevard NW',
    city: 'Atlanta',
    state: 'GA',
    postalCode: '30318',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    leadTimeDays: 18,
    minimumOrderValue: 3500,
    incoterms: 'FOB',
    priceValidityDays: 60,
    productsSupplied: ['Workwear', 'Textiles', 'Branded Apparel'],
    notes: 'Size-curve changes need a new sample run. Budget three extra weeks whenever the spec moves.',
    documents: [
      {
        id: 'sdoc-010-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '155 KB',
        uploadedAt: '2026-01-17',
        uploadedBy: 'Emily Davis'
      },
      {
        id: 'sdoc-010-2',
        name: 'Business Registration',
        type: 'pdf',
        sizeLabel: '764 KB',
        uploadedAt: '2026-01-17',
        uploadedBy: 'Emily Davis'
      },
      {
        id: 'sdoc-010-3',
        name: 'Bank Details',
        type: 'pdf',
        sizeLabel: '98 KB',
        uploadedAt: '2026-03-28',
        uploadedBy: 'Sofia Alvarez'
      }
    ],
    activity: [
      {
        id: 'sact-010-1',
        label: 'Purchase order PO-2026-00022 created',
        at: '2026-07-21T11:45:00',
        actor: 'Emily Davis',
        icon: 'plus-square'
      },
      {
        id: 'sact-010-2',
        label: 'Inbound delivery received at the warehouse',
        at: '2026-07-10T09:15:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      },
      {
        id: 'sact-010-3',
        label: 'Updated size specification uploaded',
        at: '2026-06-16T16:00:00',
        actor: 'Sofia Alvarez',
        icon: 'file-text'
      },
      {
        id: 'sact-010-4',
        label: 'Primary contact changed',
        at: '2026-05-08T10:25:00',
        actor: 'Emily Davis',
        icon: 'user'
      }
    ],
    historicalPOs: 121,
    historicalSpend: 1_075_000
  },
  {
    id: 'sup-011',
    name: 'Front Range Equipment Co.',
    contactPerson: 'Karen Lindqvist',
    email: 'karen.lindqvist@frontrangeequip.com',
    phone: '+1 (720) 555-0115',
    address: '4820 Havana Street, Dock 6\nDenver, CO 80239\nUnited States',
    supplierCode: 'SUP-1011',
    category: 'Industrial Equipment',
    status: 'inactive',
    accountOwner: 'Daniel Lee',
    description: 'Forklift and racking supplier retired after the Denver depot consolidated into Phoenix.',
    onboardedAt: '2019-04-02',
    lastUpdatedAt: '2026-02-27',
    lastUpdatedBy: 'Daniel Lee',
    contactJobTitle: 'Sales Director',
    addressLine1: '4820 Havana Street',
    addressLine2: 'Dock 6',
    city: 'Denver',
    state: 'CO',
    postalCode: '80239',
    country: 'United States',
    paymentTerms: 'Net 60',
    currency: 'USD',
    leadTimeDays: 20,
    minimumOrderValue: 4500,
    incoterms: 'EXW',
    priceValidityDays: 75,
    productsSupplied: ['Forklifts', 'Racking', 'Spare Parts'],
    notes: 'Dormant since the depot closure. Service contracts were transferred to Midwest Industrial Works.',
    documents: [
      {
        id: 'sdoc-011-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '150 KB',
        uploadedAt: '2026-01-15',
        uploadedBy: 'Daniel Lee'
      },
      {
        id: 'sdoc-011-2',
        name: 'Certificate of Insurance',
        type: 'pdf',
        sizeLabel: '296 KB',
        uploadedAt: '2026-01-15',
        uploadedBy: 'Daniel Lee'
      }
    ],
    activity: [
      {
        id: 'sact-011-1',
        label: 'Status changed to inactive',
        at: '2026-02-27T15:10:00',
        actor: 'Daniel Lee',
        icon: 'user'
      },
      {
        id: 'sact-011-2',
        label: 'Final settlement statement uploaded',
        at: '2026-02-20T12:40:00',
        actor: 'Marcus Bennett',
        icon: 'file-text'
      },
      {
        id: 'sact-011-3',
        label: 'Final inbound delivery received before closeout',
        at: '2026-01-31T08:35:00',
        actor: 'Jason Miller',
        icon: 'truck'
      }
    ],
    historicalPOs: 34,
    historicalSpend: 284_000
  },
  {
    id: 'sup-012',
    name: 'Bay State Alloys',
    contactPerson: 'Nathan Brooks',
    email: 'nathan.brooks@baystatealloys.com',
    phone: '+1 (617) 555-0188',
    address: '275 Southampton Street\nBoston, MA 02118\nUnited States',
    supplierCode: 'SUP-1012',
    category: 'Raw Materials',
    status: 'inactive',
    accountOwner: 'Sofia Alvarez',
    description: 'Metal stock supplier paused after a failed incoming-quality audit on the last two lots.',
    onboardedAt: '2023-09-11',
    lastUpdatedAt: '2026-03-16',
    lastUpdatedBy: 'Sofia Alvarez',
    contactJobTitle: 'Account Executive',
    addressLine1: '275 Southampton Street',
    city: 'Boston',
    state: 'MA',
    postalCode: '02118',
    country: 'United States',
    paymentTerms: 'Due on receipt',
    currency: 'USD',
    leadTimeDays: 16,
    minimumOrderValue: 500,
    incoterms: 'CIF',
    priceValidityDays: 20,
    productsSupplied: ['Aluminium Stock', 'Steel Sheet'],
    notes: 'On hold pending a corrective action plan. Do not reopen until QA signs off on a new sample lot.',
    documents: [
      {
        id: 'sdoc-012-1',
        name: 'W-9 Form',
        type: 'pdf',
        sizeLabel: '145 KB',
        uploadedAt: '2026-02-11',
        uploadedBy: 'Sofia Alvarez'
      },
      {
        id: 'sdoc-012-2',
        name: 'Bank Details',
        type: 'pdf',
        sizeLabel: '101 KB',
        uploadedAt: '2026-02-11',
        uploadedBy: 'Sofia Alvarez'
      }
    ],
    activity: [
      {
        id: 'sact-012-1',
        label: 'Status changed to inactive',
        at: '2026-03-16T10:50:00',
        actor: 'Sofia Alvarez',
        icon: 'user'
      },
      {
        id: 'sact-012-2',
        label: 'Quality audit report uploaded',
        at: '2026-03-09T14:05:00',
        actor: 'Rachel Adams',
        icon: 'file-text'
      },
      {
        id: 'sact-012-3',
        label: 'Final inbound delivery received and inspected',
        at: '2026-02-13T09:30:00',
        actor: 'Daniel Lee',
        icon: 'truck'
      }
    ],
    historicalPOs: 22,
    historicalSpend: 186_000
  }
]
