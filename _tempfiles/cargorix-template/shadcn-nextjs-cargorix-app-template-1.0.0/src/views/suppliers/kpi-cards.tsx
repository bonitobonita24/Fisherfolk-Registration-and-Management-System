'use client'

// Third-party Imports
import { CircleCheckIcon, FactoryIcon, FileTextIcon, WalletIcon } from 'lucide-react'

// Shared Imports
import StatCard from '@/components/shared/stat-card'

// Store Imports
import { usePurchaseOrdersStore } from '@/store/use-purchase-orders-store'
import { useSuppliersStore } from '@/store/use-suppliers-store'

// Util Imports
import { getSuppliersSummary } from '@/lib/selectors/supplier-selectors'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const SupplierKpiCards = () => {
  // Vars
  const suppliers = useSuppliersStore(state => state.suppliers)
  const purchaseOrders = usePurchaseOrdersStore(state => state.purchaseOrders)

  const summary = getSuppliersSummary(suppliers, purchaseOrders)

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <StatCard
        label='Total suppliers'
        value={summary.totalSuppliers}
        icon={<FactoryIcon />}
        iconClassName='bg-info-soft text-info'
      />
      <StatCard
        label='Active'
        value={summary.activeSuppliers}
        icon={<CircleCheckIcon />}
        iconClassName='bg-success-soft text-success'
      />
      <StatCard
        label='Open POs'
        value={summary.openPOs}
        icon={<FileTextIcon />}
        iconClassName='bg-warning-soft text-warning'
      />
      <StatCard
        label='Total purchased'
        value={currency.format(summary.totalPurchased)}
        caption='Across all suppliers'
        icon={<WalletIcon />}
        iconClassName='bg-accent text-accent-foreground'
      />
    </div>
  )
}

export default SupplierKpiCards
