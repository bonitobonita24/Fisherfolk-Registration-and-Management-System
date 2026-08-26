'use client'

// Third-party Imports
import { useWatch, type Control } from 'react-hook-form'
import { CheckIcon, WarehouseIcon } from 'lucide-react'

// Type Imports
import type { User } from '@/types/entities/user'
import type { CreateWarehouseFormInput } from './create-warehouse-schema'

// Component Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Config Imports
import { WAREHOUSE_STATUS_FORM_OPTIONS } from '@/views/warehouses/warehouse-badges'

// Util Imports
import { getUserName } from '@/lib/selectors/user-selectors'
import { cn } from '@/lib/utils'

const EM_DASH = '—'

// Props
type WarehouseSummarySidebarProps = {
  control: Control<CreateWarehouseFormInput>
  isEdit: boolean
  users: User[]
}

const WarehouseSummarySidebar = ({ control, isEdit, users }: WarehouseSummarySidebarProps) => {
  // Hooks
  const values = useWatch({ control })

  // Vars
  const name = values.name?.trim() || ''
  const code = values.code?.trim() || ''
  const city = values.city?.trim() || ''
  const state = values.state?.trim() || ''
  const country = values.country?.trim() || ''
  const line1 = values.line1?.trim() || ''
  const postalCode = values.postalCode?.trim() || ''
  const managerId = values.managerId?.trim() || ''
  const managerName = managerId ? getUserName(users, managerId) : ''

  const maxCapacity = Number(values.maxCapacity) || 0
  const dockCount = Number(values.dockCount) || 0
  const zoneCount = Number(values.zoneCount) || 0

  const locationLabel = city && state ? `${city}, ${state}${country ? `, ${country}` : ''}` : ''
  const statusLabel = WAREHOUSE_STATUS_FORM_OPTIONS.find(option => option.value === values.status)?.label ?? EM_DASH

  const summaryRows = [
    { label: 'Location', value: locationLabel, muted: !locationLabel, placeholder: 'Not set' },
    { label: 'Manager', value: managerName, muted: !managerName, placeholder: 'Not set' },
    { label: 'Capacity', value: `${maxCapacity.toLocaleString()} units` },
    { label: 'Docks', value: String(dockCount) },
    { label: 'Zones', value: String(zoneCount) },
    { label: 'Status', value: statusLabel }
  ]

  const checklist = [
    { label: 'Warehouse name added', done: name.length > 0 },
    { label: 'Unique code added', done: code.length > 0 },
    { label: 'Address completed', done: Boolean(line1 && city && state && postalCode) },
    { label: 'Capacity entered', done: maxCapacity > 0 },
    { label: 'Manager selected', done: managerId.length > 0 },
    { label: 'At least one dock configured', done: dockCount >= 1 }
  ]

  return (
    <div className='grid grid-cols-1 gap-6 md:max-lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Warehouse Summary' : 'Warehouse Preview'}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-sm'>
          <div className='bg-muted/50 flex items-center gap-3 rounded-lg border p-3'>
            <div className='bg-background flex size-10 shrink-0 items-center justify-center rounded-md border'>
              <WarehouseIcon className='text-muted-foreground size-5' />
            </div>
            <div className='min-w-0'>
              <p className='truncate font-semibold'>{name || 'Warehouse name'}</p>
              <p className='text-muted-foreground truncate'>{code || 'Warehouse code'}</p>
            </div>
          </div>

          <dl className='space-y-3'>
            {summaryRows.map(row => (
              <div key={row.label} className='flex items-baseline justify-between gap-4'>
                <dt className='text-muted-foreground'>{row.label}</dt>
                <dd
                  className={cn(
                    'truncate text-right font-medium tabular-nums',
                    row.muted && 'text-muted-foreground font-normal'
                  )}
                >
                  {row.value || row.placeholder || EM_DASH}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readiness Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-3 text-sm'>
            {checklist.map(item => (
              <li key={item.label} className='flex items-center gap-2.5'>
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border',
                    item.done ? 'border-success bg-success text-white' : 'border-input text-muted-foreground'
                  )}
                >
                  <CheckIcon className='size-3' />
                </span>
                <span className={item.done ? 'font-medium' : 'text-muted-foreground'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default WarehouseSummarySidebar
