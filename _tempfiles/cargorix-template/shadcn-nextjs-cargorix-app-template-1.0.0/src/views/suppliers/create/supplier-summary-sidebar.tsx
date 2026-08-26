'use client'

// React Imports
import type { ReactNode } from 'react'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { PurchaseOrder } from '@/types/entities/purchase-order'
import type { Supplier, SupplierCategory, SupplierDocument, SupplierStatus } from '@/types/entities/supplier'
import type { CreateSupplierFormInput } from './supplier-form-schema'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'

// Util Imports
import { getInitials } from '@/lib/get-initials'
import { getSupplierReadiness, getSupplierRollup } from '@/lib/selectors/supplier-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { SUPPLIER_STATUS_BADGE } from '../supplier-badges'

// Vars
const PLACEHOLDER = '— — —'

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0
  }).format(amount)

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : PLACEHOLDER

// Props
type SupplierSummarySidebarProps = {
  control: Control<CreateSupplierFormInput>
  mode: 'add' | 'edit'
  supplier?: Supplier
  purchaseOrders: PurchaseOrder[]
}

const SupplierSummarySidebar = ({ control, mode, supplier, purchaseOrders }: SupplierSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })
  const storedPurchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)

  const poList = storedPurchaseOrders.length > 0 ? storedPurchaseOrders : purchaseOrders

  const isEdit = mode === 'edit'
  const name = values.name?.trim() || PLACEHOLDER
  const status = SUPPLIER_STATUS_BADGE[(values.status as SupplierStatus) || 'active'] ?? SUPPLIER_STATUS_BADGE.active
  const currency = values.currency || 'USD'
  const initials = getInitials((values.name ?? '').trim()) || '—'

  const leadTimeDays = String(values.leadTimeDays ?? '').trim()
  const minimumOrderValue = String(values.minimumOrderValue ?? '').trim()

  const draft: Partial<Supplier> = {
    name: values.name,
    supplierCode: values.supplierCode,
    category: values.category as SupplierCategory,
    status: (values.status as SupplierStatus) || undefined,
    contactPerson: values.contactPerson,
    email: values.email,
    phone: values.phone,
    addressLine1: values.addressLine1,
    city: values.city,
    postalCode: values.postalCode,
    country: values.country,
    paymentTerms: values.paymentTerms,
    currency: values.currency,
    leadTimeDays: leadTimeDays === '' ? undefined : Number(leadTimeDays),
    minimumOrderValue: minimumOrderValue === '' ? undefined : Number(minimumOrderValue),
    productsSupplied: values.productsSupplied,

    documents: (values.documents as SupplierDocument[] | undefined) ?? supplier?.documents ?? []
  }

  const checklist = getSupplierReadiness(draft, mode)
  const allPassed = checklist.every(item => item.passed)
  const rollup = supplier ? getSupplierRollup(supplier, poList) : undefined

  const summaryRows: { label: string; value: ReactNode }[] = [
    ...(isEdit
      ? []
      : [
          { label: 'Supplier name', value: name },
          { label: 'Supplier code', value: values.supplierCode || PLACEHOLDER },
          {
            label: 'Status',
            value: (
              <Badge className={cn('gap-1.5', status.className)}>
                <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
                {status.label}
              </Badge>
            )
          }
        ]),
    { label: 'Category', value: values.category || PLACEHOLDER },
    { label: 'Payment terms', value: values.paymentTerms || PLACEHOLDER },
    { label: 'Currency', value: currency },
    { label: 'Lead time (days)', value: leadTimeDays === '' ? PLACEHOLDER : leadTimeDays },
    {
      label: 'Minimum order value',
      value: minimumOrderValue === '' ? PLACEHOLDER : formatMoney(Number(minimumOrderValue), currency)
    },
    ...(isEdit
      ? [
          { label: 'Account owner', value: values.accountOwner || PLACEHOLDER },
          { label: 'Open POs', value: rollup ? String(rollup.openPOs) : PLACEHOLDER },

          { label: 'Total purchased', value: rollup ? formatMoney(rollup.totalPurchased, 'USD') : PLACEHOLDER },
          { label: 'Onboarded on', value: formatDate(supplier?.onboardedAt) },
          { label: 'Last updated', value: formatDate(supplier?.lastUpdatedAt) }
        ]
      : [])
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Supplier summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          {isEdit && (
            <>
              <div className='flex items-center gap-3'>
                <Avatar className='size-12'>
                  <AvatarFallback className='bg-muted text-muted-foreground'>{initials}</AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{name}</p>
                  <p className='text-muted-foreground truncate text-xs'>{values.supplierCode || PLACEHOLDER}</p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className={cn('gap-1.5', status.className)}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
                  {status.label}
                </Badge>
              </div>
              <Separator />
            </>
          )}

          {summaryRows.map(row => (
            <div key={row.label} className='flex items-baseline justify-between gap-4'>
              <span className='text-muted-foreground shrink-0'>{row.label}</span>
              <span className='min-w-0 truncate text-right font-medium'>{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Readiness checklist</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          <ul className='space-y-3'>
            {checklist.map(item => (
              <li key={item.label} className='flex items-start gap-2'>
                {item.passed ? (
                  <CheckCircle2Icon className='text-success mt-0.5 size-4 shrink-0' />
                ) : (
                  <CircleIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                )}
                <div className='min-w-0'>
                  <p className={item.passed ? 'font-medium' : 'text-muted-foreground font-medium'}>{item.label}</p>
                  <p className='text-muted-foreground text-xs'>{item.caption}</p>
                </div>
              </li>
            ))}
          </ul>
          {isEdit ? (
            allPassed && (
              <p className='text-muted-foreground text-xs'>Supplier is fully onboarded and ready to transact.</p>
            )
          ) : (
            <p className='text-muted-foreground text-xs'>
              All required fields must be completed before creating the supplier.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SupplierSummarySidebar
