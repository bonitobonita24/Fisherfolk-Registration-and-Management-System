'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Third-party Imports
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, FileTextIcon, TruckIcon } from 'lucide-react'

// Type Imports
import type { Resolver } from 'react-hook-form'

import type { Product } from '@/types/entities/product'
import type { StockMovement } from '@/types/entities/stock-movement'
import type { StockTransfer } from '@/types/entities/stock-transfer'
import type { Warehouse } from '@/types/entities/warehouse'
import type { TransferFormPatch } from '@/store/use-stock-transfers-store'
import type { CreateTransferFormInput, CreateTransferFormValues } from './create-transfer-schema'

// Component Imports
import { Button } from '@/components/ui/button'
import LineItemsSection from './line-items-section'
import TransferInfoSection from './transfer-info-section'
import TransferSummarySidebar from './transfer-summary-sidebar'

// Store Imports
import { useProductsStore } from '@/store/use-products-store'
import { useStockLedgerStore } from '@/store/use-stock-ledger-store'
import { checkTransferDestination, useStockTransfersStore } from '@/store/use-stock-transfers-store'
import { useWarehousesStore } from '@/store/use-warehouses-store'

// Util Imports
import {
  getAvailableAtSource,
  getInboundUnitsByWarehouse,
  getReservedByWarehouse
} from '@/lib/selectors/stock-transfers-selectors'
import { getWarehouseBalances } from '@/lib/selectors/stock-ledger-selectors'
import { checkWarehouseIntake } from '@/lib/selectors/warehouse-selectors'
import { warnIfOverCapacity } from '@/lib/capacity-toast'
import { excludeDrafts } from '@/lib/exclude-drafts'

// Data Imports
import { createTransferSchema } from './create-transfer-schema'

const createTransferResolver = zodResolver as unknown as (
  schema: typeof createTransferSchema
) => Resolver<CreateTransferFormInput, unknown, CreateTransferFormValues>

const EMPTY_VALUES: CreateTransferFormInput = {
  sourceWarehouseId: '',
  destinationWarehouseId: '',
  requestedBy: '',
  dispatchDate: '',
  expectedArrival: '',
  notes: '',
  lines: []
}

const mapTransferToForm = (t: StockTransfer): CreateTransferFormInput => ({
  sourceWarehouseId: t.sourceWarehouseId,
  destinationWarehouseId: t.destinationWarehouseId,
  requestedBy: t.requestedBy,
  dispatchDate: t.dispatchDate,
  expectedArrival: t.expectedArrival,
  notes: t.notes,
  lines: t.lines.map(line => ({
    id: line.id,
    productId: line.productId,
    name: line.name,
    sku: line.sku,
    primaryImage: line.primaryImage,
    unit: line.unit,
    quantitySent: line.quantitySent
  }))
})

type CreateStockTransferViewProps = {
  transferId: string
  transfers: StockTransfer[]
  warehouses: Warehouse[]
  products: Product[]
  movements: StockMovement[]
}

const CreateStockTransferView = ({
  transferId,
  transfers,
  warehouses,
  products,
  movements
}: CreateStockTransferViewProps) => {
  // Hooks
  const router = useRouter()
  const initializeTransfers = useStockTransfersStore(state => state.initialize)
  const initializeWarehouses = useWarehousesStore(state => state.initialize)
  const initializeProducts = useProductsStore(state => state.initialize)
  const initializeLedger = useStockLedgerStore(state => state.initialize)
  const createDraftTransfer = useStockTransfersStore(state => state.createDraftTransfer)
  const saveTransferDraft = useStockTransfersStore(state => state.saveTransferDraft)
  const dispatchTransfer = useStockTransfersStore(state => state.dispatchTransfer)
  const t = useStockTransfersStore(state => state.getTransfer(transferId))
  const storeWarehouses = useWarehousesStore(state => state.warehouses)
  const allProducts = useProductsStore(state => state.products)
  const storeMovements = useStockLedgerStore(state => state.movements)
  const storeTransfers = useStockTransfersStore(state => state.transfers)

  // Vars
  const storeProducts = excludeDrafts(allProducts)
  const isNew = !t?.number

  const form = useForm<CreateTransferFormInput, unknown, CreateTransferFormValues>({
    resolver: createTransferResolver(createTransferSchema),
    defaultValues: EMPTY_VALUES
  })

  const watchedValues = useWatch({ control: form.control })
  const watchedLines = watchedValues.lines ?? []

  const ready = Boolean(
    watchedValues.sourceWarehouseId &&
    watchedValues.destinationWarehouseId &&
    watchedValues.sourceWarehouseId !== watchedValues.destinationWarehouseId &&
    watchedLines.length > 0 &&
    watchedLines.every(line => Number(line?.quantitySent) > 0) &&
    watchedValues.dispatchDate &&
    watchedValues.expectedArrival
  )

  const balances = getWarehouseBalances(storeMovements)
  const reserved = getReservedByWarehouse(storeTransfers)

  const destinationId = watchedValues.destinationWarehouseId ?? ''

  const destinationCheck = destinationId
    ? checkWarehouseIntake(
        storeMovements,
        storeWarehouses,
        destinationId,
        watchedLines.reduce((sum, line) => sum + (Number(line?.quantitySent) || 0), 0) +
          (getInboundUnitsByWarehouse(storeTransfers, transferId).get(destinationId) ?? 0)
      )
    : undefined

  const availableAt = (productId: string, warehouseId: string) =>
    getAvailableAtSource(balances, reserved, productId, warehouseId)

  const mapFormToPatch = (values: CreateTransferFormValues | CreateTransferFormInput): TransferFormPatch => {
    const selectedSource = storeWarehouses.find(warehouse => warehouse.id === values.sourceWarehouseId)
    const selectedDestination = storeWarehouses.find(warehouse => warehouse.id === values.destinationWarehouseId)

    const lines = (values.lines ?? []).map(line => ({
      id: line.id ?? crypto.randomUUID(),
      productId: line.productId ?? '',
      name: line.name ?? '',
      sku: line.sku ?? '',
      primaryImage: line.primaryImage ?? '',
      unit: line.unit ?? 'units',
      quantitySent: Number(line.quantitySent) || 0,
      quantityReceived: 0
    }))

    return {
      sourceWarehouseId: values.sourceWarehouseId ?? '',
      sourceWarehouseName: selectedSource?.name ?? t?.sourceWarehouseName ?? '',
      destinationWarehouseId: values.destinationWarehouseId ?? '',
      destinationWarehouseName: selectedDestination?.name ?? t?.destinationWarehouseName ?? '',
      requestedBy: values.requestedBy ?? '',
      dispatchDate: values.dispatchDate ?? '',
      expectedArrival: values.expectedArrival ?? '',
      notes: values.notes ?? '',
      lines,
      attachments: t?.attachments ?? []
    }
  }

  const handleSaveDraft = () => {
    saveTransferDraft(transferId, mapFormToPatch(form.getValues()))
    router.push('/stock-transfers')
  }

  const handleCreateAndDispatch = form.handleSubmit(values => {
    const patch = mapFormToPatch(values)

    if (!warnIfOverCapacity(checkTransferDestination(patch, transferId, true))) return

    if (dispatchTransfer(transferId, patch)) router.push(`/stock-transfers/${transferId}`)
  })

  useEffect(() => {
    initializeTransfers(transfers)
  }, [initializeTransfers, transfers])

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
    createDraftTransfer(transferId)
  }, [createDraftTransfer, transferId])

  useEffect(() => {
    if (t) form.reset(mapTransferToForm(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?.id])

  return (
    <div className='space-y-6'>
      <Button
        variant='link'
        size='sm'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground h-auto gap-1.5 px-0 no-underline hover:no-underline'
        render={<Link href='/stock-transfers' />}
      >
        <ArrowLeftIcon className='size-4' />
        Back to stock transfers
      </Button>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            {isNew ? 'Create Stock Transfer' : 'Edit Stock Transfer'}
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Build the transfer, then dispatch it to move stock between warehouses.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' onClick={handleSaveDraft}>
            <FileTextIcon className='size-4' />
            Save draft
          </Button>
          <Button type='button' onClick={handleCreateAndDispatch} disabled={!ready}>
            <TruckIcon className='size-4' />
            Create & dispatch
          </Button>
        </div>
      </div>

      <div className='relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]'>
        <div className='space-y-6'>
          <TransferInfoSection
            control={form.control}
            transfer={t}
            warehouses={storeWarehouses}
            destinationCheck={destinationCheck}
          />
          <LineItemsSection control={form.control} products={storeProducts} availableAt={availableAt} />
        </div>

        <aside className='xl:sticky xl:top-18 xl:self-start'>
          <TransferSummarySidebar control={form.control} warehouses={storeWarehouses} />
        </aside>
      </div>
    </div>
  )
}

export default CreateStockTransferView
