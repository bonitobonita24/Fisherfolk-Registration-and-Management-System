// Type Imports
import type { Product, ProductLifecycleStatus, ProductSpec, ProductVariant } from '@/types/entities/product'

const ELECTRONICS_IMAGES: string[] = [
  '/images/products/electronics-1.webp',
  '/images/products/electronics-2.webp',
  '/images/products/electronics-3.webp',
  '/images/products/electronics-4.webp',
  '/images/products/electronics-5.webp',
  '/images/products/electronics-6.webp',
  '/images/products/electronics-7.webp',
  '/images/products/electronics-8.webp'
]

const CLOTHING_IMAGES: string[] = [
  '/images/products/clothing-1.webp',
  '/images/products/clothing-2.webp',
  '/images/products/clothing-3.webp',
  '/images/products/clothing-4.webp',
  '/images/products/clothing-5.webp',
  '/images/products/clothing-6.webp',
  '/images/products/clothing-7.webp',
  '/images/products/clothing-8.webp'
]

const SPORTS_IMAGES: string[] = [
  '/images/products/sports-1.webp',
  '/images/products/sports-2.webp',
  '/images/products/sports-3.webp',
  '/images/products/sports-4.webp',
  '/images/products/sports-5.webp',
  '/images/products/sports-6.webp'
]

const HOME_GARDEN_IMAGES: string[] = [
  '/images/products/home-garden-1.webp',
  '/images/products/home-garden-2.webp',
  '/images/products/home-garden-3.webp',
  '/images/products/home-garden-4.webp',
  '/images/products/home-garden-5.webp',
  '/images/products/home-garden-6.webp'
]

const BOOKS_IMAGES: string[] = [
  '/images/products/books-1.webp',
  '/images/products/books-2.webp',
  '/images/products/books-3.webp',
  '/images/products/books-4.webp',
  '/images/products/books-5.webp',
  '/images/products/books-6.webp'
]

const PACKAGING_IMAGES: string[] = [
  '/images/products/packaging-1.webp',
  '/images/products/packaging-2.webp',
  '/images/products/packaging-3.webp',
  '/images/products/packaging-4.webp',
  '/images/products/packaging-5.webp',
  '/images/products/packaging-6.webp'
]

type ProductSeed = {
  id: string
  sku: string
  name: string
  category: Product['category']
  categoryPath?: string[]
  warehouseId: string
  unitCost: number
  price: number
  compareAtPrice?: number
  onHand: number
  reserved: number
  incoming: number
  outgoing: number
  reorderPoint: number
  reorderQuantity: number
  brand: string
  shortDescription: string
  description?: string
  tags: string[]
  status?: ProductLifecycleStatus
  barcode?: string
  featured?: boolean
  variants?: ProductVariant[]
  keySpecs?: ProductSpec[]
}

const IMAGE_POOL_BY_CATEGORY: Record<Product['category'], string[]> = {
  Electronics: ELECTRONICS_IMAGES,
  Clothing: CLOTHING_IMAGES,
  Sports: SPORTS_IMAGES,
  'Home & Garden': HOME_GARDEN_IMAGES,
  Books: BOOKS_IMAGES,
  'Packaging Supplies': PACKAGING_IMAGES
}

const generateBarcode = (index: number) => String(8901234567890 + index)

const buildSalesTrend = (seed: ProductSeed, index: number): Product['salesTrend'] => {
  const baseline = Math.max(1, Math.round(seed.onHand / 12))

  return Array.from({ length: 30 }, (_, day) => {
    const wave = Math.round(baseline * (1 + 0.4 * Math.sin((day + index) / 3)))
    const sold = Math.max(0, wave)

    return {
      date: `Day ${day + 1}`,
      sold,
      revenue: Math.round(sold * seed.price * 100) / 100
    }
  })
}

const buildGallery = (seed: ProductSeed, index: number): string[] => {
  const pool = IMAGE_POOL_BY_CATEGORY[seed.category]
  const size = Math.min(pool.length, 3 + (index % 3))

  return Array.from({ length: size }, (_, offset) => pool[(index + offset) % pool.length])
}

const deriveKeySpecs = (seed: ProductSeed): ProductSpec[] => [
  { label: 'Brand', value: seed.brand },
  { label: 'Category', value: seed.category },
  { label: 'Weight', value: '1.2 kg' },
  { label: 'Dimensions', value: '25 × 15 × 8 cm' },
  { label: 'Unit', value: 'each' }
]

const buildProduct = (seed: ProductSeed, index: number): Product => {
  const gallery = buildGallery(seed, index)

  return {
    id: seed.id,
    sku: seed.sku,
    name: seed.name,
    slug: seed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    category: seed.category,
    categoryPath: seed.categoryPath ?? [seed.category],
    productType: 'Physical',
    brand: seed.brand,
    barcode: seed.barcode ?? generateBarcode(index),
    shortDescription: seed.shortDescription,
    description: seed.description ?? seed.shortDescription,
    tags: seed.tags,
    status: seed.status ?? 'active',
    visibility: 'visible',
    featured: seed.featured ?? false,
    warehouseId: seed.warehouseId,
    unitCost: seed.unitCost,
    onHand: seed.onHand,
    reserved: seed.reserved,
    incoming: seed.incoming,
    outgoing: seed.outgoing,
    reorderPoint: seed.reorderPoint,
    reorderQuantity: seed.reorderQuantity,
    unit: 'each',
    weightKg: 1.2,
    lengthCm: 25,
    widthCm: 15,
    heightCm: 8,
    trackInventory: true,
    price: seed.price,
    compareAtPrice: seed.compareAtPrice ?? null,
    currency: 'USD',
    taxClass: 'Standard Tax Rate',
    primaryImage: gallery[0],
    galleryImages: gallery,
    videoUrl: null,
    collections: [],
    salesChannels: ['Online Store'],
    variants: seed.variants ?? [],
    salesTrend: buildSalesTrend(seed, index),
    keySpecs: seed.keySpecs ?? deriveKeySpecs(seed),
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-07-20T09:15:00.000Z'
  }
}

const SEEDS: ProductSeed[] = [
  {
    id: 'prod-001',
    sku: 'SWU-002',
    name: 'Smart Watch Ultra',
    category: 'Electronics',
    warehouseId: 'wh-newark',
    unitCost: 145,
    price: 199,
    compareAtPrice: 229,
    onHand: 12,
    reserved: 0,
    incoming: 20,
    outgoing: 3,
    reorderPoint: 20,
    reorderQuantity: 40,
    brand: 'PulseFit',
    shortDescription: 'Fitness & health tracking',
    tags: ['Wearables', 'Fitness', 'Bluetooth']
  },
  {
    id: 'prod-002',
    sku: 'WEP-021',
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    warehouseId: 'wh-bronx',
    unitCost: 89,
    price: 139,
    compareAtPrice: 159,
    onHand: 14,
    reserved: 1,
    incoming: 15,
    outgoing: 2,
    reorderPoint: 25,
    reorderQuantity: 40,
    brand: 'SoundCore',
    shortDescription: 'True wireless · ANC',
    tags: ['Audio', 'Wireless', 'ANC'],
    variants: [
      { id: 'prod-002-blk', name: 'Black', sku: 'WEP-021-BLK', price: 139, onHand: 8, reserved: 1 },
      { id: 'prod-002-wht', name: 'White', sku: 'WEP-021-WHT', price: 139, onHand: 6, reserved: 0 }
    ]
  },
  {
    id: 'prod-003',
    sku: 'ELE-010',
    name: '4K Action Camera',
    category: 'Electronics',
    warehouseId: 'wh-brooklyn',
    unitCost: 210,
    price: 299,
    onHand: 46,
    reserved: 3,
    incoming: 10,
    outgoing: 5,
    reorderPoint: 15,
    reorderQuantity: 30,
    brand: 'TrailCam',
    shortDescription: 'Waterproof · 4K60fps',
    tags: ['Camera', 'Outdoor', '4K']
  },
  {
    id: 'prod-004',
    sku: 'BSM-006',
    name: 'Bluetooth Speaker Mini',
    category: 'Electronics',
    warehouseId: 'wh-queens',
    unitCost: 42,
    price: 59,
    compareAtPrice: 69,
    onHand: 88,
    reserved: 5,
    incoming: 12,
    outgoing: 8,
    reorderPoint: 20,
    reorderQuantity: 30,
    brand: 'EchoWave',
    shortDescription: 'Portable · 12h battery',
    tags: ['Audio', 'Portable', 'Bluetooth']
  },
  {
    id: 'prod-005',
    sku: 'CLO-021',
    name: 'Performance Running Jacket',
    category: 'Clothing',
    warehouseId: 'wh-bronx',
    unitCost: 58,
    price: 89,
    onHand: 64,
    reserved: 4,
    incoming: 0,
    outgoing: 6,
    reorderPoint: 20,
    reorderQuantity: 25,
    brand: 'StrideWear',
    shortDescription: 'Windproof · Reflective trim',
    tags: ['Apparel', 'Running', 'Outerwear']
  },
  {
    id: 'prod-006',
    sku: 'CLO-034',
    name: 'Merino Wool Socks 3-Pack',
    category: 'Clothing',
    warehouseId: 'wh-newark',
    unitCost: 14,
    price: 24,
    onHand: 120,
    reserved: 6,
    incoming: 0,
    outgoing: 10,
    reorderPoint: 30,
    reorderQuantity: 60,
    brand: 'StrideWear',
    shortDescription: 'Moisture-wicking · 3-pack',
    tags: ['Apparel', 'Socks', 'Merino']
  },
  {
    id: 'prod-007',
    sku: 'CLO-045',
    name: 'Insulated Winter Gloves',
    category: 'Clothing',
    warehouseId: 'wh-queens',
    unitCost: 22,
    price: 38,
    onHand: 0,
    reserved: 0,
    incoming: 25,
    outgoing: 4,
    reorderPoint: 25,
    reorderQuantity: 40,
    brand: 'StrideWear',
    shortDescription: 'Touchscreen-compatible',
    tags: ['Apparel', 'Winter', 'Gloves']
  },
  {
    id: 'prod-008',
    sku: 'RSE-005',
    name: 'Running Shoes Elite',
    category: 'Sports',
    warehouseId: 'wh-brooklyn',
    unitCost: 118,
    price: 120,
    onHand: 0,
    reserved: 0,
    incoming: 30,
    outgoing: 15,
    reorderPoint: 24,
    reorderQuantity: 40,
    brand: 'StrideWear',
    shortDescription: 'Lightweight · Breathable',
    tags: ['Footwear', 'Running', 'Performance']
  },
  {
    id: 'prod-009',
    sku: 'SPT-018',
    name: 'Yoga Mat Premium',
    category: 'Sports',
    warehouseId: 'wh-bronx',
    unitCost: 26,
    price: 45,
    onHand: 88,
    reserved: 3,
    incoming: 0,
    outgoing: 6,
    reorderPoint: 20,
    reorderQuantity: 30,
    brand: 'ZenFit',
    shortDescription: 'Non-slip · Eco foam',
    tags: ['Fitness', 'Yoga', 'Eco']
  },
  {
    id: 'prod-010',
    sku: 'DLL-014',
    name: 'Desk Lamp LED',
    category: 'Home & Garden',
    warehouseId: 'wh-queens',
    unitCost: 34,
    price: 54,
    compareAtPrice: 64,
    onHand: 8,
    reserved: 0,
    incoming: 15,
    outgoing: 2,
    reorderPoint: 20,
    reorderQuantity: 30,
    brand: 'BrightSpace',
    shortDescription: 'Dimmable · USB-C',
    tags: ['Home', 'Lighting', 'LED']
  },
  {
    id: 'prod-011',
    sku: 'HG-027',
    name: 'Ceramic Planter Set',
    category: 'Home & Garden',
    warehouseId: 'wh-newark',
    unitCost: 19,
    price: 32,
    onHand: 52,
    reserved: 2,
    incoming: 0,
    outgoing: 5,
    reorderPoint: 15,
    reorderQuantity: 25,
    brand: 'GreenRoot',
    shortDescription: 'Set of 3 · Drainage holes',
    tags: ['Home', 'Garden', 'Decor']
  },
  {
    id: 'prod-012',
    sku: 'BK-002',
    name: 'Modern Logistics Handbook',
    category: 'Books',
    warehouseId: 'wh-brooklyn',
    unitCost: 24,
    price: 39,
    onHand: 40,
    reserved: 1,
    incoming: 0,
    outgoing: 3,
    reorderPoint: 10,
    reorderQuantity: 20,
    brand: 'Cargorix Press',
    shortDescription: '2nd edition · Paperback',
    tags: ['Books', 'Logistics', 'Reference']
  },
  {
    id: 'prod-013',
    sku: 'BK-009',
    name: 'Warehouse Safety Field Guide',
    category: 'Books',
    warehouseId: 'wh-bronx',
    unitCost: 18,
    price: 29,
    onHand: 6,
    reserved: 0,
    incoming: 20,
    outgoing: 1,
    reorderPoint: 15,
    reorderQuantity: 25,
    brand: 'Cargorix Press',
    shortDescription: 'OSHA-aligned · Pocket size',
    tags: ['Books', 'Safety', 'Reference']
  },
  {
    id: 'prod-014',
    sku: 'PKG-2201',
    name: 'Heavy-Duty Pallet Wrap',
    category: 'Packaging Supplies',
    warehouseId: 'wh-bronx',
    unitCost: 28,
    price: 42,
    onHand: 12,
    reserved: 2,
    incoming: 40,
    outgoing: 8,
    reorderPoint: 50,
    reorderQuantity: 80,
    brand: 'WrapTech',
    shortDescription: '20-inch · 80 gauge',
    tags: ['Packaging', 'Wrap', 'Bulk']
  },
  {
    id: 'prod-015',
    sku: 'PKG-1187',
    name: 'Corrugated Shipping Boxes (M)',
    category: 'Packaging Supplies',
    warehouseId: 'wh-newark',
    unitCost: 3,
    price: 6,
    onHand: 34,
    reserved: 4,
    incoming: 100,
    outgoing: 20,
    reorderPoint: 100,
    reorderQuantity: 200,
    brand: 'BoxRight',
    shortDescription: 'Medium · 200-pack case',
    tags: ['Packaging', 'Boxes', 'Bulk']
  },
  {
    id: 'prod-016',
    sku: 'LBL-0456',
    name: 'Thermal Label Rolls',
    category: 'Packaging Supplies',
    warehouseId: 'wh-brooklyn',
    unitCost: 6,
    price: 11,
    onHand: 8,
    reserved: 1,
    incoming: 50,
    outgoing: 10,
    reorderPoint: 40,
    reorderQuantity: 80,
    brand: 'LabelMax',
    shortDescription: '4x6 · 1-inch core',
    tags: ['Packaging', 'Labels', 'Thermal']
  },
  {
    id: 'prod-017',
    sku: 'PKG-3390',
    name: 'Steel Strapping Coil',
    category: 'Packaging Supplies',
    warehouseId: 'wh-bronx',
    unitCost: 45,
    price: 68,
    onHand: 0,
    reserved: 0,
    incoming: 20,
    outgoing: 5,
    reorderPoint: 25,
    reorderQuantity: 40,
    brand: 'WrapTech',
    shortDescription: '1/2-inch · High tensile',
    tags: ['Packaging', 'Strapping', 'Industrial']
  },
  {
    id: 'prod-018',
    sku: 'WHP-001',
    name: 'Wireless Headphones Pro',
    category: 'Electronics',
    categoryPath: ['Electronics', 'Audio', 'Headphones'],
    warehouseId: 'wh-newark',
    unitCost: 56,
    price: 89,
    onHand: 147,
    reserved: 6,
    incoming: 25,
    outgoing: 12,
    reorderPoint: 20,
    reorderQuantity: 50,
    brand: 'SoundCore',
    shortDescription: 'Over-ear noise cancelling',
    description: 'Over-ear noise cancelling headphones with premium sound quality and long battery life.',
    tags: ['Headphones', 'Wireless', 'Noise Cancelling'],
    barcode: '8901234567890',
    featured: true,
    variants: [
      { id: 'prod-018-blk', name: 'Black', sku: 'WHP-001-BLK', price: 89, onHand: 98, reserved: 4 },
      { id: 'prod-018-wht', name: 'White', sku: 'WHP-001-WHT', price: 89, onHand: 49, reserved: 2 }
    ],
    keySpecs: [
      { label: '', value: 'Bluetooth 5.3' },
      { label: 'Driver Size', value: '40mm' },
      { label: 'Battery Life', value: 'Up to 30 hours' },
      { label: 'Fast Charging', value: '5 min charge = 3 hours playtime' },
      { label: 'Weight', value: '260g' },
      { label: 'Color', value: 'Black' }
    ]
  },
  {
    id: 'prod-019',
    sku: 'UH-003',
    name: 'USB-C Hub 7-in-1',
    category: 'Electronics',
    warehouseId: 'wh-bronx',
    unitCost: 27,
    price: 45,
    onHand: 64,
    reserved: 4,
    incoming: 10,
    outgoing: 6,
    reorderPoint: 20,
    reorderQuantity: 30,
    brand: 'LinkPro',
    shortDescription: '4K HDMI · PD 100W',
    tags: ['Accessories', 'USB-C', 'Hub']
  },
  {
    id: 'prod-020',
    sku: 'CTC-004',
    name: 'Cotton T-Shirt Classic',
    category: 'Clothing',
    warehouseId: 'wh-queens',
    unitCost: 8,
    price: 19,
    onHand: 230,
    reserved: 12,
    incoming: 0,
    outgoing: 20,
    reorderPoint: 40,
    reorderQuantity: 80,
    brand: 'StrideWear',
    shortDescription: 'Unisex · 100% cotton',
    tags: ['Apparel', 'Basics', 'Cotton']
  },
  {
    id: 'prod-021',
    sku: 'MK-007',
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    warehouseId: 'wh-brooklyn',
    unitCost: 36,
    price: 60,
    compareAtPrice: 70,
    onHand: 41,
    reserved: 2,
    incoming: 0,
    outgoing: 5,
    reorderPoint: 45,
    reorderQuantity: 60,
    brand: 'KeyForge',
    shortDescription: 'Hot-swappable switches',
    tags: ['Peripherals', 'Keyboard', 'Mechanical'],
    variants: [
      { id: 'prod-021-blu', name: 'Blue switch', sku: 'MK-007-BLU', price: 60, onHand: 25, reserved: 1 },
      { id: 'prod-021-brn', name: 'Brown switch', sku: 'MK-007-BRN', price: 60, onHand: 16, reserved: 1 }
    ]
  },
  {
    id: 'prod-022',
    sku: 'ELE-030',
    name: 'Portable Power Bank 20K',
    category: 'Electronics',
    warehouseId: 'wh-bronx',
    unitCost: 22,
    price: 39,
    onHand: 75,
    reserved: 5,
    incoming: 0,
    outgoing: 10,
    reorderPoint: 20,
    reorderQuantity: 40,
    brand: 'VoltEdge',
    shortDescription: '20,000mAh · Fast charge',
    tags: ['Electronics', 'Charging', 'Portable']
  },
  {
    id: 'prod-023',
    sku: 'SPT-032',
    name: 'Waterproof Hiking Boots',
    category: 'Sports',
    warehouseId: 'wh-newark',
    unitCost: 72,
    price: 115,
    onHand: 18,
    reserved: 2,
    incoming: 10,
    outgoing: 3,
    reorderPoint: 20,
    reorderQuantity: 30,
    brand: 'TrailBlaze',
    shortDescription: 'Waterproof · Ankle support',
    tags: ['Footwear', 'Hiking', 'Outdoor']
  },
  {
    id: 'prod-024',
    sku: 'HG-040',
    name: 'Smart Plant Watering Kit',
    category: 'Home & Garden',
    warehouseId: 'wh-queens',
    unitCost: 16,
    price: 28,
    onHand: 60,
    reserved: 3,
    incoming: 0,
    outgoing: 5,
    reorderPoint: 15,
    reorderQuantity: 25,
    brand: 'GreenRoot',
    shortDescription: 'Self-watering · 4-pack',
    tags: ['Home', 'Garden', 'Smart']
  },
  {
    id: 'prod-025',
    sku: 'BK-015',
    name: 'The Supply Chain Playbook',
    category: 'Books',
    warehouseId: 'wh-brooklyn',
    unitCost: 21,
    price: 34,
    onHand: 22,
    reserved: 1,
    incoming: 0,
    outgoing: 2,
    reorderPoint: 10,
    reorderQuantity: 15,
    brand: 'Cargorix Press',
    shortDescription: 'Hardcover · Case studies',
    tags: ['Books', 'Strategy', 'Reference']
  },
  {
    id: 'prod-026',
    sku: 'PKG-4410',
    name: 'Bubble Mailers (Pack of 100)',
    category: 'Packaging Supplies',
    warehouseId: 'wh-newark',
    unitCost: 9,
    price: 16,
    onHand: 120,
    reserved: 8,
    incoming: 0,
    outgoing: 15,
    reorderPoint: 60,
    reorderQuantity: 100,
    brand: 'BoxRight',
    shortDescription: 'Padded · Self-seal',
    tags: ['Packaging', 'Mailers', 'Bulk']
  },
  {
    id: 'prod-027',
    sku: 'SPT-025',
    name: 'Adjustable Dumbbell Set',
    category: 'Sports',
    warehouseId: 'wh-bronx',
    unitCost: 95,
    price: 149,
    compareAtPrice: 169,
    onHand: 9,
    reserved: 1,
    incoming: 5,
    outgoing: 2,
    reorderPoint: 12,
    reorderQuantity: 20,
    brand: 'IronCore',
    shortDescription: '5–52.5 lbs · Space saving',
    tags: ['Fitness', 'Strength', 'Home Gym'],
    status: 'draft'
  },
  {
    id: 'prod-028',
    sku: 'ELE-045',
    name: 'Smart Home Hub',
    category: 'Electronics',
    warehouseId: 'wh-queens',
    unitCost: 48,
    price: 79,
    onHand: 0,
    reserved: 0,
    incoming: 40,
    outgoing: 0,
    reorderPoint: 15,
    reorderQuantity: 30,
    brand: 'NestLink',
    shortDescription: 'Zigbee + Wi-Fi · Voice ready',
    tags: ['Smart Home', 'Hub', 'Automation'],
    status: 'archived'
  }
]

export const db: Product[] = SEEDS.map(buildProduct)
