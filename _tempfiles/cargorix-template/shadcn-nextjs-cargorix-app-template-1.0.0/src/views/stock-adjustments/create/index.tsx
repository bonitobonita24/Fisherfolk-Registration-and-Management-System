'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, CheckCircle2Icon, FileTextIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Product } from '@/types/entities/product'
import type { StockAdjustment, StockAdjustmentReason } from '@/types/entities/stock-adjustment'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { Warehouse } from '@/types/entities/warehouse'
import type { AdjustmentFormPatch } from '@/store/use-stock-adjustments-store'
import type { CreateAdjustmentFormInput, CreateAdjustmentFormValues } from './create-adjustment-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import AdjustmentInfoSection from './adjustment-info-section'
import AdjustmentSummarySidebar from './adjustment-summary-sidebar'
import LineItemsSection from './line-items-section'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { checkAdjustmentIntake, useStockAdjustmentsStore } from '@/store/use-stock-adjustments-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import { getWarehouseBalances } from '@/lib/selectors/stock-ledger-selectors'
import { warnIfOverCapacity } from '@/lib/capacity-toast'
import { excludeDrafts } from '@/lib/exclude-drafts'

// Data Imports
import { createAdjustmentSchema } from './create-adjustment-schema'

const createAdjustmentResolver = zodResolver as unknown as (
  schema: typeof createAdjustmentSchema
) => Resolver<CreateAdjustmentFormInput, unknown, CreateAdjustmentFormValues>

const EMPTY_VALUES: CreateAdjustmentFormInput = {
  warehouseId: '',
  reason: '',
  requestedBy: '',
  date: '',
  notes: '',
  lines: []
}

const mapAdjustmentToForm = (a: StockAdjustment): CreateAdjustmentFormInput => ({
  warehouseId: a.warehouseId,
  reason: a.reason,
  requestedBy: a.requestedBy,
  date: a.date,
  notes: a.notes,
  lines: a.lines.map(line => ({
    id: line.id,
    productId: line.productId,
    name: line.name,
    sku: line.sku,
    primaryImage: line.primaryImage,
    unit: line.unit,
    currentQty: line.currentQty,
    adjustmentQty: line.adjustmentQty
  }))
})

type CreateStockAdjustmentViewProps = {
  adjustmentId: string
  adjustments: StockAdjustment[]
  warehouses: Warehouse[]
  products: Product[]
  movements: StockMovement[]
}

const CreateStockAdjustmentView = ({
  adjustmentId,
  adjustments,
  warehouses,
  products,
  movements
}: CreateStockAdjustmentViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeAdjustments = useStockAdjustmentsStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const createDraftAdjustment = useStockAdjustmentsStore(state => state.createDraftAdjustment)
  const saveAdjustmentDraft = useStockAdjustmentsStore(state => state.saveAdjustmentDraft)
  const postAdjustment = useStockAdjustmentsStore(state => state.postAdjustment)
  const a = useStockAdjustmentsStore(state => state.getAdjustment(adjustmentId))
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const allProducts = useProductsStore(state => state.products)
  const storeMovements = useStockLedgerStore(state => state.movements)

  // Vars
  const storeProducts = excludeDrafts(allProducts)
  const isNew = !a?.number
  const isDraft = a?.status === 'draft'

  const form = useForm<CreateAdjustmentFormInput, unknown, CreateAdjustmentFormValues>({
    resolver: createAdjustmentResolver(createAdjustmentSchema),
    defaultValues: EMPTY_VALUES
  })

  const watchedValues = useWatch({ control: form.control })
  const watchedLines = watchedValues.lines ?? []

  const ready = Boolean(
    watchedValues.warehouseId &&
    watchedValues.reason &&
    watchedValues.date &&
    watchedLines.length > 0 &&
    watchedLines.every(line => Number(line?.adjustmentQty) !== 0) &&
    watchedLines.every(line => (Number(line?.currentQty) || 0) + (Number(line?.adjustmentQty) || 0) >= 0)
  )

  const balances = getWarehouseBalances(storeMovements)

  const balanceFor = (productId: string, warehouseId: string) => balances.get(`${productId}::${warehouseId}`) ?? 0

  const setAdjustmentQty = (index: number, value: number) =>
    form.setValue(`lines.${index}.adjustmentQty`, value, { shouldValidate: true, shouldDirty: true })

  const mapFormToPatch = (values: CreateAdjustmentFormValues | CreateAdjustmentFormInput): AdjustmentFormPatch => {
    const selectedWarehouse = storeWarehouses.find(warehouse => warehouse.id === values.warehouseId)

    const lines = (values.lines ?? []).map(line => ({
      id: line.id ?? crypto.randomUUID(),
      productId: line.productId ?? '',
      name: line.name ?? '',
      sku: line.sku ?? '',
      primaryImage: line.primaryImage ?? '',
      unit: line.unit ?? 'units',
      currentQty: Number(line.currentQty) || 0,
      adjustmentQty: Number(line.adjustmentQty) || 0
    }))

    return {
      warehouseId: values.warehouseId ?? '',
      warehouseName: selectedWarehouse?.name ?? a?.warehouseName ?? '',
      reason: (values.reason as StockAdjustmentReason) || 'cycle_count',
      requestedBy: values.requestedBy ?? '',
      date: values.date ?? '',
      notes: values.notes ?? '',
      lines,
      attachments: a?.attachments ?? []
    }
  }

  const handleSaveDraft = () => {
    saveAdjustmentDraft(adjustmentId, mapFormToPatch(form.getValues()))
    router.push('/stock-adjustments')
  }

  const handlePost = form.handleSubmit(values => {
    const patch = mapFormToPatch(values)

    if (!warnIfOverCapacity(checkAdjustmentIntake(patch))) return

    if (postAdjustment(adjustmentId, patch)) router.push(`/stock-adjustments/${adjustmentId}`)
  })

  useEffect(() => {
    initializeAdjustments(adjustments)
  }, [initializeAdjustments, adjustments])

  useEffect(() => {
    initializeWarehouses(warehouses)
  }, [initializeWarehouses, warehouses])

  useEffect(() => {
    initializeProducts(products)
  }, [initializeProducts, products])

  useEffect(() => {
    initializeLedger(movements)
  }, [initializeLedger, movements])

  useEffect(() => {
    createDraftAdjustment(adjustmentId)
  }, [createDraftAdjustment, adjustmentId])

  useEffect(() => {
    if (a && a.status !== 'draft') router.replace(`/stock-adjustments/${adjustmentId}`)
  }, [a, adjustmentId, router])

  useEffect(() => {
    if (a) form.reset(mapAdjustmentToForm(a))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a?.id])

  if (a && !isDraft) return null

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/stock-adjustments' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to adjustments
      </Button>

      <div className='flex justify-between gap-4 max-lg:flex-col lg:items-start'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {isNew ? 'Create Stock Adjustment' : 'Edit Stock Adjustment'}
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Correct on-hand levels at one warehouse, then post it to update the ledger and stock.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button type='button' variant='outline' onClick={handleSaveDraft}>
            <FileTextIcon className='size-4' />
            Save draft
          </Button>
          <Button type='button' onClick={handlePost} disabled={!ready}>
            <CheckCircle2Icon className='size-4' />
            Post adjustment
          </Button>
        </div>
      </div>

      <div className='relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='grid grid-cols-1 gap-6 lg:max-xl:grid-cols-2'>
          <AdjustmentInfoSection control={form.control} adjustment={a} warehouses={storeWarehouses} />
          <LineItemsSection
            control={form.control}
            products={storeProducts}
            balanceFor={balanceFor}
            setAdjustmentQty={setAdjustmentQty}
          />
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <AdjustmentSummarySidebar control={form.control} warehouses={storeWarehouses} />
        </aside>
      </div>
    </div>
  )
}

export default CreateStockAdjustmentView
