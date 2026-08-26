// Component Imports
import SupplierDetailView from '@/views/suppliers/detail'

// Server Action Imports
import { getPurchaseOrdersData, getSuppliersData } from '@/app/server/actions'

type SupplierDetailPageProps = {
  params: Promise<{ supplierId: string }>
}

const SupplierDetailPage = async ({ params }: SupplierDetailPageProps) => {
  const { supplierId } = await params

  const [suppliers, purchaseOrders] = await Promise.all([getSuppliersData(), getPurchaseOrdersData()])

  return <SupplierDetailView supplierId={supplierId} suppliers={suppliers} purchaseOrders={purchaseOrders} />
}

export default SupplierDetailPage
