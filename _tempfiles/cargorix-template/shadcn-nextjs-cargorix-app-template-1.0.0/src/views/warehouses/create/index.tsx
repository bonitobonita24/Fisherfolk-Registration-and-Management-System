'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeftIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { StockMovement } from '@/types/entities/stock-movement'
import type { User } from '@/types/entities/user'
import type { Warehouse } from '@/types/entities/warehouse'
import type { CreateWarehouseFormInput, CreateWarehouseFormValues } from './create-warehouse-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import CapacityOperationsSection from './capacity-operations-section'
import ContactManagementSection from './contact-management-section'
import WarehouseInformationSection from './warehouse-information-section'
import WarehouseSummarySidebar from './warehouse-summary-sidebar'

// Store Imports
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useUsersStore } from '@/store/use-users-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getWarehouseUnitsStored } from '@/lib/selectors/warehouse-selectors'

// Data Imports
import { createWarehouseSchema } from './create-warehouse-schema'

const createWarehouseResolver = zodResolver as unknown as (
  schema: typeof createWarehouseSchema
) => Resolver<CreateWarehouseFormInput, unknown, CreateWarehouseFormValues>

const CREATE_DEFAULTS: CreateWarehouseFormInput = {
  name: '',
  code: '',
  type: 'Distribution Centre',
  status: 'active',
  line1: '',
  city: '',
  state: '',
  country: 'United States',
  postalCode: '',
  managerId: '',
  email: '',
  phone: '',
  timezone: '(UTC-06:00) Central Time',
  operatingHours: '',
  maxCapacity: '' as unknown as number,
  dockCount: 1,
  zoneCount: 1,
  allowInbound: true,
  allowOutbound: true
}

const mapWarehouseToForm = (warehouse: Warehouse): CreateWarehouseFormInput => ({
  name: warehouse.name,
  code: warehouse.code,
  type: warehouse.type,
  status: warehouse.status,
  line1: warehouse.addressParts.line1,
  city: warehouse.addressParts.city,
  state: warehouse.addressParts.state,
  country: warehouse.addressParts.country,
  postalCode: warehouse.addressParts.postalCode,
  managerId: warehouse.managerId,
  email: warehouse.email,
  phone: warehouse.phone,
  timezone: warehouse.timezone,
  operatingHours: warehouse.operatingHours,
  maxCapacity: warehouse.maxCapacity,
  dockCount: warehouse.dockCount,
  zoneCount: warehouse.zoneCount,
  allowInbound: warehouse.allowInbound,
  allowOutbound: warehouse.allowOutbound
})

// Props
type CreateWarehouseViewProps = {
  warehouseId: string
  warehouses: Warehouse[]
  users: User[]
  movements: StockMovement[]
}

const CreateWarehouseView = ({ warehouseId, warehouses, users, movements }: CreateWarehouseViewProps) => {
  // Hooks
  const router = useRouter()
  const initialize = useWarehousesStore(state => state.initialize)
  const initializeUsers = useUsersStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const storeMovements = useStockLedgerStore(state => state.movements)
  const storeUsers = useUsersStore(state => state.users)
  const createWarehouse = useWarehousesStore(state => state.createWarehouse)
  const updateWarehouse = useWarehousesStore(state => state.updateWarehouse)
  const storeWarehouse = useWarehousesStore(state => state.getWarehouse(warehouseId))

  // Vars
  const existing = storeWarehouse ?? warehouses.find(w => w.id === warehouseId)
  const isEdit = Boolean(existing)
  const activeUsers = storeUsers.length > 0 ? storeUsers : users
  const activeMovements = storeMovements.length > 0 ? storeMovements : movements
  const unitsStored = isEdit ? getWarehouseUnitsStored(activeMovements, warehouseId) : 0

  const form = useForm<CreateWarehouseFormInput, unknown, CreateWarehouseFormValues>({
    resolver: createWarehouseResolver(createWarehouseSchema),
    defaultValues: existing ? mapWarehouseToForm(existing) : CREATE_DEFAULTS
  })

  const onSubmit = (values: CreateWarehouseFormValues) => {
    if (Number(values.maxCapacity) < unitsStored) {
      form.setError('maxCapacity', {
        message: `This warehouse already holds ${unitsStored.toLocaleString()} units. Capacity cannot be lower than that — move stock out first.`
      })

      return
    }

    const location = `${values.city}, ${values.state}`
    const address = `${values.line1}\n${values.city}, ${values.state} ${values.postalCode}\n${values.country}`

    const addressParts = {
      line1: values.line1,
      city: values.city,
      state: values.state,
      country: values.country,
      postalCode: values.postalCode
    }

    if (isEdit) {
      updateWarehouse(warehouseId, {
        name: values.name,
        code: values.code,
        type: values.type,
        status: values.status,
        location,
        address,
        addressParts,
        managerId: values.managerId,
        email: values.email ?? '',
        phone: values.phone ?? '',
        timezone: values.timezone ?? '',
        operatingHours: values.operatingHours ?? '',
        maxCapacity: Number(values.maxCapacity),
        dockCount: Number(values.dockCount),
        zoneCount: Number(values.zoneCount),
        allowInbound: values.allowInbound,
        allowOutbound: values.allowOutbound
      })
      toast.success('Warehouse updated')
    } else {
      const warehouse: Warehouse = {
        id: warehouseId,
        name: values.name,
        code: values.code,
        type: values.type,
        status: values.status,
        location,
        address,
        addressParts,
        lat: 40.7484,
        lng: -73.9857,
        managerId: values.managerId,
        email: values.email ?? '',
        phone: values.phone ?? '',
        timezone: values.timezone ?? '',
        operatingHours: values.operatingHours ?? '',
        openedDate: new Date().toISOString(),
        maxCapacity: Number(values.maxCapacity),
        dockCount: Number(values.dockCount),
        zoneCount: Number(values.zoneCount),
        allowInbound: values.allowInbound,
        allowOutbound: values.allowOutbound,
        zones: [],
        dockSchedule: [],
        today: { inboundPOs: 0, outboundShipments: 0, dockQueueWaiting: 0 }
      }

      createWarehouse(warehouse)
      toast.success('Warehouse created')
    }

    router.push(`/warehouses/${warehouseId}`)
  }

  useEffect(() => {
    initialize(warehouses)
    initializeUsers(users)
    initializeLedger(movements)
  }, [initialize, warehouses, initializeUsers, users, initializeLedger, movements])

  useEffect(() => {
    if (existing) form.reset(mapWarehouseToForm(existing))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id])

  return (
    <div className='space-y-6'>
      {isEdit ? (
        <div className='text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm'>
          <Button
            variant='link'
            size='sm'
            nativeButton={false}
            className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
            render={<Link href='/warehouses' />}
          >
            <ArrowLeftIcon className='size-4' />
            Warehouses
          </Button>
          <span>/</span>
          <Button
            variant='link'
            size='sm'
            nativeButton={false}
            className='text-muted-foreground hover:text-foreground h-auto px-0 no-underline hover:no-underline'
            render={<Link href={`/warehouses/${warehouseId}`} />}
          >
            {existing?.name}
          </Button>
          <span>/</span>
          <span className='text-foreground'>Edit</span>
        </div>
      ) : (
        <Button
          variant='link'
          size='sm'
          nativeButton={false}
          className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
          render={<Link href='/warehouses' />}
        >
          <ArrowLeftIcon className='size-4' />
          Warehouses
        </Button>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{isEdit ? 'Edit Warehouse' : 'Add Warehouse'}</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              {isEdit ? 'Update warehouse information.' : 'Create a new warehouse location.'}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button type='button' variant='outline' nativeButton={false} render={<Link href='/warehouses' />}>
              Cancel
            </Button>
            <Button type='submit'>{isEdit ? 'Save changes' : 'Create warehouse'}</Button>
          </div>
        </div>

        <div className='relative grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            <WarehouseInformationSection control={form.control} isEdit={isEdit} />
            <ContactManagementSection control={form.control} setValue={form.setValue} users={activeUsers} />
            <CapacityOperationsSection control={form.control} unitsStored={unitsStored} />
          </div>

          <aside className='lg:sticky lg:top-18 lg:self-start'>
            <WarehouseSummarySidebar control={form.control} isEdit={isEdit} users={activeUsers} />
          </aside>
        </div>
      </form>
    </div>
  )
}

export default CreateWarehouseView
