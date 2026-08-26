'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckCircle2Icon, CircleIcon } from 'lucide-react'

// Type Imports
import type { Client, ClientAccountType, ClientStatus, PaymentTerms } from '@/types/entities/client'
import type { CreateClientFormInput } from './client-form-schema'

// Component Imports
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// Store Imports
import { useOrdersStore } from '@/store/use-orders-store'
import { useShipmentsStore } from '@/store/use-shipments-store'

// Util Imports
import { getInitials } from '@/lib/get-initials'
import { getClientReadiness, getClientRollup } from '@/lib/selectors/client-selectors'
import { cn } from '@/lib/utils'

// Data Imports
import { ACCOUNT_TYPE_LABEL, CLIENT_STATUS_BADGE, PAYMENT_TERMS_LABEL } from '../client-badges'

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
type ClientSummarySidebarProps = {
  control: Control<CreateClientFormInput>
  mode: 'add' | 'edit'
  client?: Client
}

const ClientSummarySidebar = ({ control, mode, client }: ClientSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })
  const orders = useOrdersStore(state => state.orders)
  const shipments = useShipmentsStore(state => state.shipments)

  // Vars
  const isEdit = mode === 'edit'
  const name = values.name?.trim() || PLACEHOLDER
  const status = CLIENT_STATUS_BADGE[(values.status as ClientStatus) || 'active'] ?? CLIENT_STATUS_BADGE.active
  const accountType = values.accountType ? ACCOUNT_TYPE_LABEL[values.accountType as ClientAccountType] : PLACEHOLDER
  const paymentTerms = values.paymentTerms ? PAYMENT_TERMS_LABEL[values.paymentTerms as PaymentTerms] : PLACEHOLDER
  const currency = values.currency || 'USD'

  const initials = getInitials((values.name ?? '').trim()) || '—'
  const creditLimit = String(values.creditLimit ?? '').trim()

  const draft: Partial<Client> = {
    name: values.name,
    clientCode: values.clientCode,
    industry: values.industry,
    contactName: values.contactName,
    email: values.email,
    phone: values.phone,
    billingAddress: values.billingAddress,
    shippingAddress: values.sameAsBilling ? values.billingAddress : values.shippingAddress,
    paymentTerms: (values.paymentTerms as PaymentTerms) || undefined,
    currency: values.currency,
    billingEmail: values.billingEmail,
    accountManager: values.accountManager,
    preferredServices: values.preferredServices,
    documents: client?.documents ?? []
  }

  const checklist = getClientReadiness(draft, mode)
  const allPassed = checklist.every(item => item.passed)
  const rollup = client ? getClientRollup(client, orders, shipments) : undefined

  const summaryRows = [
    { label: 'Payment terms', value: paymentTerms },
    { label: 'Currency', value: currency },
    {
      label: 'Credit limit',
      value: creditLimit === '' ? PLACEHOLDER : formatMoney(Number(creditLimit), currency)
    },
    { label: 'Billing email', value: values.billingEmail || PLACEHOLDER },
    { label: 'Tax ID', value: values.taxId || PLACEHOLDER },
    { label: 'Account manager', value: values.accountManager || PLACEHOLDER },
    ...(isEdit
      ? [
          { label: 'Industry', value: values.industry || PLACEHOLDER },
          { label: 'Primary contact', value: values.contactName || PLACEHOLDER },
          {
            label: 'Open order value',
            value: rollup ? formatMoney(rollup.outstandingBalance, 'USD') : PLACEHOLDER
          },
          { label: 'Lifetime value', value: rollup ? formatMoney(rollup.lifetimeValue, 'USD') : PLACEHOLDER },
          { label: 'Member since', value: formatDate(client?.memberSince) }
        ]
      : [])
  ]

  return (
    <div className='grid h-fit grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-1'>
      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Client summary</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          {isEdit ? (
            <>
              <div className='flex items-center gap-3'>
                <Avatar className='size-12'>
                  <AvatarFallback className='bg-muted text-muted-foreground'>{initials}</AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{name}</p>
                  <p className='text-muted-foreground truncate text-xs'>{values.clientCode || PLACEHOLDER}</p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className={cn('gap-1.5', status.className)}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
                  {status.label}
                </Badge>
                <Badge variant='outline'>{accountType}</Badge>
              </div>
            </>
          ) : (
            <>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Status</span>
                <Badge className={cn('gap-1.5', status.className)}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} />
                  {status.label}
                </Badge>
              </div>
              <div className='flex items-baseline justify-between gap-4'>
                <span className='text-muted-foreground'>Account type</span>
                <span className='truncate text-right font-medium'>{accountType}</span>
              </div>
            </>
          )}

          <Separator />

          {summaryRows.map(row => (
            <div key={row.label} className='flex items-baseline justify-between gap-4'>
              <span className='text-muted-foreground'>{row.label}</span>
              <span className='truncate text-right font-medium'>{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className='gap-0 py-0'>
        <CardHeader className='px-5 pt-5'>
          <CardTitle>Readiness checklist</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-4 text-sm'>
          <ul className='space-y-2'>
            {checklist.map(item => (
              <li key={item.label} className='flex items-center gap-2'>
                {item.passed ? (
                  <CheckCircle2Icon className='text-success size-4 shrink-0' />
                ) : (
                  <CircleIcon className='text-muted-foreground size-4 shrink-0' />
                )}
                <span className={item.passed ? '' : 'text-muted-foreground'}>{item.label}</span>
              </li>
            ))}
          </ul>
          {isEdit ? (
            allPassed && <p className='text-muted-foreground text-xs'>All required information is complete.</p>
          ) : (
            <p className='text-muted-foreground text-xs'>All required fields are marked with *</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientSummarySidebar
