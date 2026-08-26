// Type Imports
import type { OrderPackage } from '@/types/entities/order'

export type PackageFormLike = {
  description?: string
  quantity?: unknown
  weightKg?: unknown
  lengthCm?: unknown
  widthCm?: unknown
  heightCm?: unknown
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const DIMENSIONS_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)\s*×\s*(\d+(?:\.\d+)?)/

export const toPackageFormValues = (packages: OrderPackage[] = []) =>
  packages.map(pkg => {
    const [, lengthCm = '', widthCm = '', heightCm = ''] = pkg.dimensions?.match(DIMENSIONS_PATTERN) ?? []

    return {
      description: pkg.itemName,
      quantity: pkg.quantity,
      weightKg: pkg.weightKg || '',
      lengthCm,
      widthCm,
      heightCm
    }
  })

export const toOrderPackages = (packages: PackageFormLike[] = [], idPrefix = 'pkg'): OrderPackage[] =>
  packages.map((pkg, index) => {
    const lengthCm = toNumber(pkg?.lengthCm)
    const widthCm = toNumber(pkg?.widthCm)
    const heightCm = toNumber(pkg?.heightCm)
    const hasDimensions = Boolean(lengthCm || widthCm || heightCm)

    return {
      id: `${idPrefix}-${index}`,
      itemName: pkg?.description ?? '',
      packageType: 'carton',
      quantity: toNumber(pkg?.quantity),
      weightKg: toNumber(pkg?.weightKg),
      volumeM3: Number(((lengthCm * widthCm * heightCm) / 1_000_000).toFixed(3)),
      dimensions: hasDimensions ? `${lengthCm} × ${widthCm} × ${heightCm} cm` : ''
    }
  })
